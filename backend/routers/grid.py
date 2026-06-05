from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from database import SessionLocal
from models import (
    Line,
    Tower,
    Insulator,
    Conductor,
    HardwareFitting,
    TowerGrounding,
    Span,
    Inspection,
    MaintenanceRecord,
    PlannedTask,
    User,
)
from schemas import (
    Line as LineSchema,
    LineCreate,
    LineUpdate,
    Tower as TowerSchema,
    TowerCreate,
    TowerUpdate,
    Insulator as InsulatorSchema,
    InsulatorCreate,
    InsulatorUpdate,
    Conductor as ConductorSchema,
    ConductorCreate,
    ConductorUpdate,
    HardwareFitting as HardwareFittingSchema,
    HardwareFittingCreate,
    HardwareFittingUpdate,
    TowerGrounding as TowerGroundingSchema,
    TowerGroundingCreate,
    TowerGroundingUpdate,
    Span as SpanSchema,
    SpanCreate,
    SpanUpdate,
    Inspection as InspectionSchema,
    InspectionCreate,
    InspectionUpdate,
)
from auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/api/grid", tags=["grid"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ======================== Business helpers ========================

def ensure_tower_number_unique(db: Session, line_id: str, number: int, tower_id: Optional[str] = None):
    q = db.query(Tower).filter(Tower.line_id == line_id, Tower.number == number)
    if tower_id:
        q = q.filter(Tower.id != tower_id)
    if q.first():
        raise HTTPException(status_code=400, detail="TowerNumber must be unique within a line")


def validate_grounding_resistance(value: Optional[float]):
    if value is not None and value > 5.0:
        raise HTTPException(status_code=400, detail="Grounding resistance must not exceed 5 Ohm")


def validate_inspection_scope(tower_id: Optional[str], line_id: Optional[str]):
    if (tower_id is None and line_id is None) or (tower_id is not None and line_id is not None):
        raise HTTPException(status_code=400, detail="Exactly one of tower_id or line_id must be set")


def check_tower_last_inspection(tower: Tower):
    if tower.last_inspection_date is not None:
        delta = date.today() - tower.last_inspection_date
        if delta.days > 365 * 2:
            # این فقط هشدار منطقی است، مانع ذخیره نمی‌شود
            return {
                "warning": "LastInspectionDate for this tower is older than 2 years",
                "days_since_last_inspection": delta.days,
            }
    return None


# ======================== Line endpoints ========================

@router.get("/lines", response_model=List[LineSchema])
def list_lines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Line).all()


@router.post("/lines", response_model=LineSchema)
def create_line(
    line: LineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    db_line = Line(**line.model_dump())
    db.add(db_line)
    db.commit()
    db.refresh(db_line)
    return db_line


@router.put("/lines/{line_id}", response_model=LineSchema)
def update_line(
    line_id: str,
    payload: LineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    db_line = db.query(Line).filter(Line.id == line_id).first()
    if not db_line:
        raise HTTPException(status_code=404, detail="Line not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(db_line, k, v)
    db.commit()
    db.refresh(db_line)
    return db_line


@router.delete("/lines/{line_id}")
def delete_line(
    line_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    db_line = db.query(Line).filter(Line.id == line_id).first()
    if not db_line:
        raise HTTPException(status_code=404, detail="Line not found")
    db.delete(db_line)
    db.commit()
    return {"ok": True}


# ======================== Tower endpoints ========================

@router.get("/towers", response_model=List[TowerSchema])
def list_towers(
    line_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Tower)
    if line_id:
        q = q.filter(Tower.line_id == line_id)
    return q.all()


@router.post("/towers", response_model=TowerSchema)
def create_tower(
    tower: TowerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    ensure_tower_number_unique(db, tower.line_id, tower.number)
    tower_id = tower.id or f"{tower.line_id}||{tower.number}"
    data = tower.model_dump()
    data["id"] = tower_id
    db_tower = Tower(**data)
    validate_grounding_resistance(data.get("grounding_resistance_ohm"))
    db.add(db_tower)
    db.commit()
    db.refresh(db_tower)
    return db_tower


@router.put("/towers/{tower_id}", response_model=TowerSchema)
def update_tower(
    tower_id: str,
    payload: TowerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    db_tower = db.query(Tower).filter(Tower.id == tower_id).first()
    if not db_tower:
        raise HTTPException(status_code=404, detail="Tower not found")

    data = payload.model_dump(exclude_unset=True)
    if "number" in data or "line_id" in data:
        line_id = data.get("line_id", db_tower.line_id)
        number = data.get("number", db_tower.number)
        ensure_tower_number_unique(db, line_id, number, tower_id=db_tower.id)

    if "grounding_resistance_ohm" in data:
        validate_grounding_resistance(data["grounding_resistance_ohm"])

    for k, v in data.items():
        setattr(db_tower, k, v)
    db.commit()
    db.refresh(db_tower)

    warning = check_tower_last_inspection(db_tower)
    return {"tower": db_tower, "warning": warning}


@router.delete("/towers/{tower_id}")
def delete_tower(
    tower_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    db_tower = db.query(Tower).filter(Tower.id == tower_id).first()
    if not db_tower:
        raise HTTPException(status_code=404, detail="Tower not found")
    db.delete(db_tower)
    db.commit()
    return {"ok": True}


# ======================== Insulator endpoints ========================

@router.get("/insulators", response_model=List[InsulatorSchema])
def list_insulators(
    tower_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Insulator)
    if tower_id:
        q = q.filter(Insulator.tower_id == tower_id)
    return q.all()


@router.post("/insulators", response_model=InsulatorSchema)
def create_insulator(
    ins: InsulatorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_ins = Insulator(**ins.model_dump())
    db.add(db_ins)
    db.commit()
    db.refresh(db_ins)
    return db_ins


@router.put("/insulators/{insulator_id}", response_model=InsulatorSchema)
def update_insulator(
    insulator_id: int,
    payload: InsulatorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_ins = db.query(Insulator).filter(Insulator.id == insulator_id).first()
    if not db_ins:
        raise HTTPException(status_code=404, detail="Insulator not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(db_ins, k, v)
    db.commit()
    db.refresh(db_ins)
    return db_ins


@router.delete("/insulators/{insulator_id}")
def delete_insulator(
    insulator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_ins = db.query(Insulator).filter(Insulator.id == insulator_id).first()
    if not db_ins:
        raise HTTPException(status_code=404, detail="Insulator not found")
    db.delete(db_ins)
    db.commit()
    return {"ok": True}


# ======================== Conductor endpoints ========================

@router.get("/conductors", response_model=List[ConductorSchema])
def list_conductors(
    tower_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Conductor)
    if tower_id:
        q = q.filter(Conductor.tower_id == tower_id)
    return q.all()


@router.post("/conductors", response_model=ConductorSchema)
def create_conductor(
    cond: ConductorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_cond = Conductor(**cond.model_dump())
    db.add(db_cond)
    db.commit()
    db.refresh(db_cond)
    return db_cond


@router.put("/conductors/{conductor_id}", response_model=ConductorSchema)
def update_conductor(
    conductor_id: int,
    payload: ConductorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_cond = db.query(Conductor).filter(Conductor.id == conductor_id).first()
    if not db_cond:
        raise HTTPException(status_code=404, detail="Conductor not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(db_cond, k, v)
    db.commit()
    db.refresh(db_cond)
    return db_cond


@router.delete("/conductors/{conductor_id}")
def delete_conductor(
    conductor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_cond = db.query(Conductor).filter(Conductor.id == conductor_id).first()
    if not db_cond:
        raise HTTPException(status_code=404, detail="Conductor not found")
    db.delete(db_cond)
    db.commit()
    return {"ok": True}


# ======================== HardwareFitting endpoints ========================

@router.get("/fittings", response_model=List[HardwareFittingSchema])
def list_fittings(
    tower_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(HardwareFitting)
    if tower_id:
        q = q.filter(HardwareFitting.tower_id == tower_id)
    return q.all()


@router.post("/fittings", response_model=HardwareFittingSchema)
def create_fitting(
    fit: HardwareFittingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_fit = HardwareFitting(**fit.model_dump())
    db.add(db_fit)
    db.commit()
    db.refresh(db_fit)
    return db_fit


@router.put("/fittings/{fitting_id}", response_model=HardwareFittingSchema)
def update_fitting(
    fitting_id: int,
    payload: HardwareFittingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_fit = db.query(HardwareFitting).filter(HardwareFitting.id == fitting_id).first()
    if not db_fit:
        raise HTTPException(status_code=404, detail="Fitting not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(db_fit, k, v)
    db.commit()
    db.refresh(db_fit)
    return db_fit


@router.delete("/fittings/{fitting_id}")
def delete_fitting(
    fitting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_fit = db.query(HardwareFitting).filter(HardwareFitting.id == fitting_id).first()
    if not db_fit:
        raise HTTPException(status_code=404, detail="Fitting not found")
    db.delete(db_fit)
    db.commit()
    return {"ok": True}


# ======================== TowerGrounding endpoints ========================

@router.get("/groundings", response_model=List[TowerGroundingSchema])
def list_groundings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(TowerGrounding).all()


@router.post("/groundings", response_model=TowerGroundingSchema)
def create_grounding(
    g: TowerGroundingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_grounding_resistance(g.resistance_ohm)
    existing = db.query(TowerGrounding).filter(TowerGrounding.tower_id == g.tower_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Grounding already exists for this tower")
    db_g = TowerGrounding(**g.model_dump())
    db.add(db_g)
    db.commit()
    db.refresh(db_g)
    return db_g


@router.put("/groundings/{grounding_id}", response_model=TowerGroundingSchema)
def update_grounding(
    grounding_id: int,
    payload: TowerGroundingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_g = db.query(TowerGrounding).filter(TowerGrounding.id == grounding_id).first()
    if not db_g:
        raise HTTPException(status_code=404, detail="Grounding not found")
    data = payload.model_dump(exclude_unset=True)
    if "resistance_ohm" in data:
        validate_grounding_resistance(data["resistance_ohm"])
    for k, v in data.items():
        setattr(db_g, k, v)
    db.commit()
    db.refresh(db_g)
    return db_g


@router.delete("/groundings/{grounding_id}")
def delete_grounding(
    grounding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_g = db.query(TowerGrounding).filter(TowerGrounding.id == grounding_id).first()
    if not db_g:
        raise HTTPException(status_code=404, detail="Grounding not found")
    db.delete(db_g)
    db.commit()
    return {"ok": True}


# ======================== Span endpoints ========================

@router.get("/spans", response_model=List[SpanSchema])
def list_spans(
    line_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Span)
    if line_id:
        q = q.filter(Span.line_id == line_id)
    return q.all()


@router.post("/spans", response_model=SpanSchema)
def create_span(
    span: SpanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_span = Span(**span.model_dump())
    db.add(db_span)
    db.commit()
    db.refresh(db_span)
    return db_span


@router.put("/spans/{span_id}", response_model=SpanSchema)
def update_span(
    span_id: int,
    payload: SpanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_span = db.query(Span).filter(Span.id == span_id).first()
    if not db_span:
        raise HTTPException(status_code=404, detail="Span not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(db_span, k, v)
    db.commit()
    db.refresh(db_span)
    return db_span


@router.delete("/spans/{span_id}")
def delete_span(
    span_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_span = db.query(Span).filter(Span.id == span_id).first()
    if not db_span:
        raise HTTPException(status_code=404, detail="Span not found")
    db.delete(db_span)
    db.commit()
    return {"ok": True}


# ======================== Inspection endpoints ========================

@router.get("/inspections", response_model=List[InspectionSchema])
def list_inspections(
    line_id: Optional[str] = None,
    tower_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Inspection)
    if line_id:
        q = q.filter(Inspection.line_id == line_id)
    if tower_id:
        q = q.filter(Inspection.tower_id == tower_id)
    return q.all()


@router.post("/inspections", response_model=InspectionSchema)
def create_inspection(
    insp: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_inspection_scope(insp.tower_id, insp.line_id)
    db_insp = Inspection(**insp.model_dump())
    db.add(db_insp)

    # به‌روزرسانی تاریخ آخرین بازرسی خط/دکل
    if insp.tower_id:
        tower = db.query(Tower).filter(Tower.id == insp.tower_id).first()
        if tower and insp.inspection_date:
            tower.last_inspection_date = insp.inspection_date
    if insp.line_id:
        line = db.query(Line).filter(Line.id == insp.line_id).first()
        if line and insp.inspection_date:
            line.last_inspection_date = insp.inspection_date

    db.commit()
    db.refresh(db_insp)
    return db_insp


@router.put("/inspections/{inspection_id}", response_model=InspectionSchema)
def update_inspection(
    inspection_id: int,
    payload: InspectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not db_insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    data = payload.model_dump(exclude_unset=True)
    if "tower_id" in data or "line_id" in data:
        validate_inspection_scope(data.get("tower_id", db_insp.tower_id), data.get("line_id", db_insp.line_id))

    for k, v in data.items():
        setattr(db_insp, k, v)

    # بروزرسانی تاریخ آخرین بازرسی
    if db_insp.tower_id:
        tower = db.query(Tower).filter(Tower.id == db_insp.tower_id).first()
        if tower and db_insp.inspection_date:
            tower.last_inspection_date = db_insp.inspection_date
    if db_insp.line_id:
        line = db.query(Line).filter(Line.id == db_insp.line_id).first()
        if line and db_insp.inspection_date:
            line.last_inspection_date = db_insp.inspection_date

    db.commit()
    db.refresh(db_insp)
    return db_insp


@router.delete("/inspections/{inspection_id}")
def delete_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not db_insp:
        raise HTTPException(status_code=404, detail="Inspection not found")
    db.delete(db_insp)
    db.commit()
    return {"ok": True}
