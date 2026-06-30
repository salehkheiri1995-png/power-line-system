from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Base, PowerLineRecord, User
from schemas import Record, RecordCreate, RecordUpdate, FilterOptions
from services.excel_parser import parse_excel
from auth import get_current_user, get_current_admin_user
import tempfile
import os

router = APIRouter(
    prefix="/api",
    tags=["records"],
)


# ===================== CRUD با احراز هویت =====================
@router.get("/records", response_model=List[Record])
def get_records(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PowerLineRecord).offset(skip).limit(limit).all()


@router.get("/records/{record_id}", response_model=Record)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(PowerLineRecord).filter(PowerLineRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.post("/records", response_model=Record, status_code=201)
def create_record(
    record: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_record = PowerLineRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.put("/records/{record_id}", response_model=Record)
def update_record(
    record_id: int,
    record: RecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_record = db.query(PowerLineRecord).filter(PowerLineRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    for key, value in record.model_dump(exclude_unset=True).items():
        setattr(db_record, key, value)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete("/records/{record_id}")
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_record = db.query(PowerLineRecord).filter(PowerLineRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(db_record)
    db.commit()
    return {"ok": True}


# ===================== آپلود فایل اکسل =====================
@router.post("/upload-excel")
def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            tmp.write(file.file.read())
            tmp_path = tmp.name
        records = parse_excel(tmp_path)
        os.unlink(tmp_path)

        count = 0
        for rec in records:
            db_record = PowerLineRecord(**rec)
            db.add(db_record)
            count += 1
        db.commit()
        return {"message": f"{count} records imported successfully", "count": count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===================== فیلترها =====================
_ALLOWED_FIELDS = {
    "program_type", "code", "voltage_level", "location",
    "supervisor", "line_name", "work_description",
}


@router.post("/records/filter", response_model=List[Record])
def filter_records(
    skip: int = 0,
    limit: int = 500,
    program_type: Optional[str] = None,
    code: Optional[str] = None,
    voltage_level: Optional[str] = None,
    location: Optional[str] = None,
    supervisor: Optional[str] = None,
    line_names: Optional[List[str]] = Query(None),
    work_descriptions: Optional[List[str]] = Query(None),
    date_from_year: Optional[int] = None,
    date_from_month: Optional[int] = None,
    date_from_day: Optional[int] = None,
    date_to_year: Optional[int] = None,
    date_to_month: Optional[int] = None,
    date_to_day: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PowerLineRecord)

    if program_type:
        query = query.filter(PowerLineRecord.program_type == program_type)
    if code:
        query = query.filter(PowerLineRecord.code == code)
    if voltage_level:
        query = query.filter(PowerLineRecord.voltage_level == voltage_level)
    if location:
        query = query.filter(PowerLineRecord.location == location)
    if supervisor:
        query = query.filter(PowerLineRecord.supervisor == supervisor)
    if line_names:
        query = query.filter(PowerLineRecord.line_name.in_(line_names))
    if work_descriptions:
        query = query.filter(PowerLineRecord.work_description.in_(work_descriptions))

    records = query.all()
    filtered = []
    for rec in records:
        if rec.execution_date:
            parts = rec.execution_date.split('/')
            if len(parts) == 3:
                try:
                    y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
                except ValueError:
                    continue
                if date_from_year and y < date_from_year:
                    continue
                if date_from_year and y == date_from_year:
                    if date_from_month and m < date_from_month:
                        continue
                    if date_from_month and m == date_from_month and date_from_day and d < date_from_day:
                        continue
                if date_to_year and y > date_to_year:
                    continue
                if date_to_year and y == date_to_year:
                    if date_to_month and m > date_to_month:
                        continue
                    if date_to_month and m == date_to_month and date_to_day and d > date_to_day:
                        continue
            else:
                continue
        filtered.append(rec)

    return filtered[skip: skip + limit]


# ===================== گزینه‌های فیلتر =====================
@router.get("/filter-options", response_model=FilterOptions)
def get_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(PowerLineRecord).all()
    return FilterOptions(
        program_types=sorted(list(set(r.program_type for r in records if r.program_type))),
        codes=sorted(list(set(r.code for r in records if r.code))),
        voltage_levels=sorted(list(set(r.voltage_level for r in records if r.voltage_level))),
        locations=sorted(list(set(r.location for r in records if r.location))),
        supervisors=sorted(list(set(r.supervisor for r in records if r.supervisor))),
        line_names=sorted(list(set(r.line_name for r in records if r.line_name))),
        work_descriptions=sorted(list(set(r.work_description for r in records if r.work_description))),
    )


# ===================== آمار =====================
@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(PowerLineRecord).all()
    total = len(records)
    cold = sum(1 for r in records if r.program_type == "سرد")
    hot = total - cold
    avg_team = sum(r.team_count for r in records if r.team_count) / (total if total else 1)
    avg_personnel = sum(r.personnel_count for r in records if r.personnel_count) / (total if total else 1)
    return {
        "total": total,
        "cold": cold,
        "hot": hot,
        "avg_team": round(avg_team, 2),
        "avg_personnel": round(avg_personnel, 2),
    }


@router.get("/quick-stats")
def quick_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "total": db.query(PowerLineRecord).count(),
        "cold": db.query(PowerLineRecord).filter(PowerLineRecord.program_type == "سرد").count(),
        "hot": db.query(PowerLineRecord).filter(PowerLineRecord.program_type == "گرم").count(),
    }


# ===================== خروجی JSON =====================
@router.get("/export/json")
def export_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PowerLineRecord).all()


@router.post("/export/filtered-json")
def export_filtered_json(
    filters: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PowerLineRecord)
    for field, value in filters.items():
        if field not in _ALLOWED_FIELDS:
            raise HTTPException(status_code=400, detail=f"فیلد نامعتبر: {field}")
        if value is not None:
            query = query.filter(getattr(PowerLineRecord, field) == value)
    return query.all()
