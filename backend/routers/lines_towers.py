from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Line, Tower, MaintenanceRecord, PlannedTask, PowerLineRecord, User
from auth import get_current_user, get_current_admin_user
from pydantic import BaseModel
from datetime import datetime, timedelta
from uuid import uuid4
import re

try:
    import jdatetime
    HAS_JDATETIME = True
except ImportError:
    HAS_JDATETIME = False

router = APIRouter(prefix="/api/lines-towers", tags=["lines-towers"])


# ========== Schemas ==========
class LineSchema(BaseModel):
    id: str
    name: str
    voltage: int = 0
    status: str = "active"
    color_class: str = "c1"
    color_hex: str = "#3b82f6"

    class Config:
        from_attributes = True


class TowerSchema(BaseModel):
    id: str
    line_id: str
    number: int
    x: float = 0
    y: float = 0
    type: str = "معلق"
    height: float = 40
    last_maintenance: Optional[str] = None
    next_maintenance: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class TowerGpsUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class MaintenanceRecordSchema(BaseModel):
    id: str
    tower_id: str
    planned_task_id: Optional[str] = None
    date: Optional[str] = None
    gregorian_date: Optional[datetime] = None
    type: Optional[str] = None
    program_type: Optional[str] = None
    description: Optional[str] = None
    supervisor: Optional[str] = None
    crew: Optional[str] = None
    personnel: Optional[str] = None
    location: Optional[str] = None
    status: str = "completed"

    class Config:
        from_attributes = True


class PlannedTaskSchema(BaseModel):
    id: str
    tower_id: str
    line_id: Optional[str] = None
    number: Optional[int] = None
    date: Optional[str] = None
    gregorian_date: Optional[datetime] = None
    type: Optional[str] = None
    description: Optional[str] = None
    supervisor: Optional[str] = None
    crew: Optional[str] = None
    personnel: Optional[str] = None
    status: str = "planned"

    class Config:
        from_attributes = True


# ========== توابع تبدیل تاریخ ==========

def normalize_date_str(s: str) -> Optional[str]:
    if not s:
        return None
    s = s.strip().replace('-', '/').replace('.', '/')
    parts = list(filter(None, re.split(r'[/\\\s]+', s)))
    if len(parts) != 3:
        return None
    try:
        y, m, d = map(int, parts)
        return f"{y}/{m:02d}/{d:02d}"
    except Exception:
        return None


def jalali_to_gregorian(date_str: str) -> Optional[datetime]:
    """تبدیل تاریخ شمسی به میلادی با استفاده از jdatetime در صورت وجود"""
    date_str = normalize_date_str(date_str)
    if not date_str:
        return None
    try:
        y, m, d = map(int, date_str.split('/'))
    except Exception:
        return None

    if HAS_JDATETIME:
        try:
            jd = jdatetime.date(y, m, d)
            gd = jd.togregorian()
            return datetime(gd.year, gd.month, gd.day)
        except Exception:
            return None
    else:
        # الگوریتم تقریبی Borkowski برای زمانی که jdatetime نصب نیست
        jy = y - 979
        jm = m - 1
        jd_val = d - 1
        j_day_no = 365 * jy + (jy // 33) * 8 + (jy % 33 + 3) // 4
        for i in range(jm):
            j_day_no += [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29][i]
        j_day_no += jd_val
        g_day_no = j_day_no + 79
        gy = 1600 + 400 * (g_day_no // 146097)
        g_day_no = g_day_no % 146097
        leap = True
        if g_day_no >= 36525:
            g_day_no -= 1
            gy += 100 * (g_day_no // 36524)
            g_day_no = g_day_no % 36524
            leap = False if g_day_no >= 365 else True
            if g_day_no >= 365:
                g_day_no += 1
        gy += 4 * (g_day_no // 1461)
        g_day_no %= 1461
        if g_day_no >= 366:
            leap = False
            g_day_no -= 1
            gy += g_day_no // 365
            g_day_no = g_day_no % 365
        g_days_in_month = [31, 29 if leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        gmonth = 0
        for i, days in enumerate(g_days_in_month):
            if g_day_no < days:
                gmonth = i + 1
                break
            g_day_no -= days
        try:
            return datetime(gy, gmonth, g_day_no + 1)
        except Exception:
            return None


def gregorian_to_jalali(date: datetime) -> str:
    """تبدیل تاریخ میلادی به شمسی با استفاده از jdatetime در صورت وجود"""
    if HAS_JDATETIME:
        try:
            jd = jdatetime.date.fromgregorian(date=date.date())
            return f"{jd.year}/{jd.month:02d}/{jd.day:02d}"
        except Exception:
            pass
    # fallback الگوریتم تقریبی
    gy, gm, gd = date.year, date.month, date.day
    g_d_no = 365 * gy + (gy + 3) // 4 - (gy + 99) // 100 + (gy + 399) // 400
    for i in range(gm - 1):
        g_d_no += [31, 28 + (1 if (gy % 4 == 0 and gy % 100 != 0) or gy % 400 == 0 else 0),
                   31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i]
    g_d_no += gd - 1
    j_d_no = g_d_no - 79
    j_np = j_d_no // 12053
    j_d_no %= 12053
    jy = 979 + 33 * j_np + 4 * (j_d_no // 1461)
    j_d_no %= 1461
    if j_d_no >= 366:
        jy += (j_d_no - 1) // 365
        j_d_no = (j_d_no - 1) % 365
    for i, v in enumerate([31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]):
        if j_d_no >= v:
            j_d_no -= v
        else:
            return f"{jy}/{i + 1:02d}/{j_d_no + 1:02d}"
    return f"{jy}/12/29"


def make_record_id() -> str:
    """ساخت ID یکتا و امن برای رکورد تعمیر"""
    return 'rec_' + str(uuid4()).replace('-', '')[:16]


# ========== توابع کمکی ==========

def get_or_create_line(db, line_name, voltage=0):
    line = db.query(Line).filter(Line.id == line_name).first()
    if not line:
        colors = ["c1", "c2", "c3", "c4"]
        hexes = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981"]
        idx = db.query(Line).count() % 4
        line = Line(id=line_name, name=line_name, voltage=voltage,
                    color_class=colors[idx], color_hex=hexes[idx])
        db.add(line)
    return line


def get_or_create_tower(db, line_id, number):
    tid = f"{line_id}||{number}"
    tower = db.query(Tower).filter(Tower.id == tid).first()
    if not tower:
        tower = Tower(id=tid, line_id=line_id, number=number)
        db.add(tower)
    return tower


def update_tower_dates(db, tower):
    recs = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.tower_id == tower.id,
        MaintenanceRecord.status == "completed"
    ).order_by(MaintenanceRecord.gregorian_date.desc()).all()
    if recs:
        tower.last_maintenance = recs[0].date
        if recs[0].gregorian_date:
            tower.next_maintenance = gregorian_to_jalali(
                recs[0].gregorian_date + timedelta(days=365)
            )
    else:
        tower.last_maintenance = None
        tower.next_maintenance = None


# ========== Lines ==========
@router.get("/lines", response_model=List[LineSchema])
def get_lines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Line).all()


@router.post("/lines", response_model=LineSchema)
def create_line(
    line: LineSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    db_line = Line(**line.dict())
    db.add(db_line)
    db.commit()
    return db_line


# ========== Towers ==========
@router.get("/towers", response_model=List[TowerSchema])
def get_towers(
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
    tower: TowerSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    db_tower = Tower(**tower.dict())
    db.add(db_tower)
    db.commit()
    return db_tower


@router.put("/towers/{tower_id}/gps", response_model=TowerSchema)
def update_tower_gps(
    tower_id: str,
    gps: TowerGpsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tower = db.query(Tower).filter(Tower.id == tower_id).first()
    if not tower:
        raise HTTPException(status_code=404, detail="دکل یافت نشد")
    if gps.latitude is not None:
        tower.latitude = gps.latitude
    if gps.longitude is not None:
        tower.longitude = gps.longitude
    db.commit()
    db.refresh(tower)
    return tower


# ========== Maintenance Records ==========
@router.get("/maintenance-records", response_model=List[MaintenanceRecordSchema])
def get_maintenance_records(
    tower_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(MaintenanceRecord)
    if tower_id:
        q = q.filter(MaintenanceRecord.tower_id == tower_id)
    return q.all()


@router.post("/maintenance-records", response_model=MaintenanceRecordSchema)
def create_maintenance_record(
    rec: MaintenanceRecordSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_rec = MaintenanceRecord(**rec.dict())
    db.add(db_rec)
    db.commit()

    tower_id = rec.tower_id
    if tower_id:
        open_plans = db.query(PlannedTask).filter(
            PlannedTask.tower_id == tower_id,
            PlannedTask.status == "planned",
        ).all()
        for plan in open_plans:
            if plan.gregorian_date and abs(
                (plan.gregorian_date - (rec.gregorian_date or datetime.now())).days
            ) <= 30:
                completed_rec = MaintenanceRecord(
                    id=make_record_id(),
                    tower_id=plan.tower_id,
                    planned_task_id=plan.id,
                    date=plan.date,
                    gregorian_date=plan.gregorian_date,
                    type=plan.type,
                    program_type="برنامه‌ریزی",
                    description=plan.description,
                    supervisor=plan.supervisor,
                    crew=plan.crew,
                    personnel=plan.personnel,
                    status="completed",
                )
                db.add(completed_rec)
                db.delete(plan)
        db.commit()

    tower = db.query(Tower).filter(Tower.id == tower_id).first()
    if tower:
        update_tower_dates(db, tower)
        db.commit()

    return db_rec


# ========== Planned Tasks ==========
@router.get("/planned-tasks", response_model=List[PlannedTaskSchema])
def get_planned_tasks(
    line_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(PlannedTask)
    if line_id:
        q = q.filter(PlannedTask.line_id == line_id)
    return q.all()


@router.post("/planned-tasks", response_model=PlannedTaskSchema)
def create_planned_task(
    task: PlannedTaskSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_task = PlannedTask(**task.dict())
    db.add(db_task)
    db.commit()
    return db_task


@router.put("/planned-tasks/{task_id}/complete")
def complete_planned_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(PlannedTask).filter(PlannedTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404)
    rec = MaintenanceRecord(
        id=make_record_id(),
        tower_id=task.tower_id,
        planned_task_id=task.id,
        date=task.date,
        gregorian_date=task.gregorian_date,
        type=task.type,
        program_type="برنامه‌ریزی",
        description=task.description,
        supervisor=task.supervisor,
        crew=task.crew,
        personnel=task.personnel,
        status="completed",
    )
    db.add(rec)
    db.delete(task)
    db.commit()
    tower = db.query(Tower).filter(Tower.id == task.tower_id).first()
    if tower:
        update_tower_dates(db, tower)
        db.commit()
    return {"ok": True}


@router.delete("/planned-tasks/{task_id}")
def delete_planned_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(PlannedTask).filter(PlannedTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="برنامه یافت نشد")
    db.delete(task)
    db.commit()
    return {"ok": True}


# ========== Open Plans for Line ==========
@router.get("/planned-tasks/line/{line_id}/open")
def get_open_plans_for_line(
    line_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plans = db.query(PlannedTask).filter(
        PlannedTask.line_id == line_id,
        PlannedTask.status == "planned",
    ).all()

    grouped = {}
    for plan in plans:
        key = (
            plan.type or "",
            plan.description or "",
            plan.supervisor or "",
            plan.crew or "",
            plan.personnel or "",
        )
        if key not in grouped:
            grouped[key] = {
                "type": plan.type,
                "description": plan.description,
                "supervisor": plan.supervisor,
                "crew": plan.crew,
                "personnel": plan.personnel,
                "towers": [],
                "plan_ids": [],
            }
        tower_entry = {
            "tower_id": plan.tower_id,
            "number": plan.number,
            "plan_id": plan.id,
        }
        if not any(
            t["tower_id"] == plan.tower_id and t["plan_id"] == plan.id
            for t in grouped[key]["towers"]
        ):
            grouped[key]["towers"].append(tower_entry)
        if plan.id not in grouped[key]["plan_ids"]:
            grouped[key]["plan_ids"].append(plan.id)

    return list(grouped.values())


# ========== Import ==========
@router.post("/import-from-records")
def import_from_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    records = db.query(PowerLineRecord).all()
    added = 0
    for rec in records:
        if not rec.line_name:
            continue
        line = get_or_create_line(
            db, rec.line_name, int(rec.voltage_level) if rec.voltage_level else 0
        )
        tower_nums = set()
        for f in ['tower_number', 'tower_number2']:
            val = getattr(rec, f, None)
            if val:
                for part in str(val).replace(';', ',').replace('\u060c', ',').split(','):
                    part = part.strip()
                    if part.isdigit():
                        tower_nums.add(int(part))
        for num in tower_nums:
            tower = get_or_create_tower(db, line.id, num)
            if rec.execution_date:
                greg = jalali_to_gregorian(rec.execution_date)
                if greg:
                    mrec = MaintenanceRecord(
                        id=make_record_id(),
                        tower_id=tower.id,
                        date=rec.execution_date,
                        gregorian_date=greg,
                        type=rec.program_type or "",
                        program_type=rec.program_type or "",
                        description=rec.work_description or "",
                        supervisor=rec.supervisor or "",
                        crew=str(rec.team_count) if rec.team_count else "",
                        personnel=str(rec.personnel_count) if rec.personnel_count else "",
                        location=rec.location or "",
                        status="completed",
                    )
                    db.add(mrec)
                    added += 1
    db.commit()
    for t in db.query(Tower).all():
        update_tower_dates(db, t)
    layout_towers(db)
    db.commit()
    return {"message": f"{added} رکورد تعمیر اضافه شد"}


# ========== Complete Plans ==========
@router.post("/complete-plans")
def complete_plans(
    plan_ids: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for pid in plan_ids:
        task = db.query(PlannedTask).filter(PlannedTask.id == pid).first()
        if task:
            rec = MaintenanceRecord(
                id=make_record_id(),
                tower_id=task.tower_id,
                planned_task_id=task.id,
                date=task.date,
                gregorian_date=task.gregorian_date,
                type=task.type,
                program_type="برنامه‌ریزی",
                description=task.description,
                supervisor=task.supervisor,
                crew=task.crew,
                personnel=task.personnel,
                status="completed",
            )
            db.add(rec)
            db.delete(task)
    db.commit()
    return {"ok": True}


def layout_towers(db):
    """فقط دکل‌هایی که GPS ندارند را layout می‌کند"""
    lines = db.query(Line).all()
    paths = [
        [60, 60, 840, 490],
        [60, 490, 840, 60],
        [60, 275, 840, 275],
        [450, 60, 450, 490],
        [60, 160, 840, 390],
        [160, 60, 740, 490],
    ]
    for idx, line in enumerate(lines):
        towers = (
            db.query(Tower)
            .filter(Tower.line_id == line.id)
            .order_by(Tower.number)
            .all()
        )
        if not towers:
            continue
        path = paths[idx % len(paths)]
        for i, tower in enumerate(towers):
            if tower.latitude and tower.longitude and tower.latitude != 0:
                BOUNDS_LAT_MIN, BOUNDS_LAT_MAX = 36.5, 39.5
                BOUNDS_LNG_MIN, BOUNDS_LNG_MAX = 45.5, 48.5
                tower.x = round((tower.longitude - BOUNDS_LNG_MIN) / (BOUNDS_LNG_MAX - BOUNDS_LNG_MIN) * 900)
                tower.y = round((tower.latitude - BOUNDS_LAT_MIN) / (BOUNDS_LAT_MAX - BOUNDS_LAT_MIN) * 550)
            else:
                factor = i / (len(towers) - 1) if len(towers) > 1 else 0
                tower.x = round(path[0] + factor * (path[2] - path[0]))
                tower.y = round(path[1] + factor * (path[3] - path[1]))


# ========== Stats ==========
@router.get("/tower-stats")
def tower_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    towers = db.query(Tower).all()
    total = len(towers)
    with_next = sum(1 for t in towers if t.next_maintenance)
    urgent = sum(
        1
        for t in towers
        if t.next_maintenance
        and jalali_to_gregorian(t.next_maintenance)
        and (jalali_to_gregorian(t.next_maintenance) - datetime.now()).days <= 30
    )
    return {
        "total_towers": total,
        "have_next_maintenance": with_next,
        "urgent": urgent,
    }


@router.post("/update-all-tower-dates")
def update_all_tower_dates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    towers = db.query(Tower).all()
    for t in towers:
        update_tower_dates(db, t)
    db.commit()
    return {"message": f"تاریخ‌های {len(towers)} دکل بروزرسانی شد"}


@router.post("/towers/{tower_id}/mark-completed")
def mark_tower_completed(
    tower_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tower = db.query(Tower).filter(Tower.id == tower_id).first()
    if not tower:
        raise HTTPException(status_code=404, detail="دکل یافت نشد")
    now = datetime.now()
    today_shamsi = gregorian_to_jalali(now)

    open_plans = db.query(PlannedTask).filter(
        PlannedTask.tower_id == tower_id,
        PlannedTask.status == "planned",
    ).all()

    completed_plan_ids = []
    for plan in open_plans:
        plan_date = jalali_to_gregorian(plan.date)
        if plan_date and plan_date <= now + timedelta(days=30):
            rec = MaintenanceRecord(
                id=make_record_id(),
                tower_id=tower.id,
                planned_task_id=plan.id,
                date=plan.date,
                gregorian_date=plan.gregorian_date,
                type=plan.type,
                program_type="برنامه‌ریزی",
                description=plan.description,
                supervisor=plan.supervisor,
                crew=plan.crew,
                personnel=plan.personnel,
                status="completed",
            )
            db.add(rec)
            db.delete(plan)
            completed_plan_ids.append(plan.id)

    if not completed_plan_ids:
        rec = MaintenanceRecord(
            id=make_record_id(),
            tower_id=tower.id,
            date=today_shamsi,
            gregorian_date=now,
            type="رفع عیب",
            program_type="",
            description="تکمیل دستی از جدول تعمیرات ضروری",
            status="completed",
        )
        db.add(rec)

    db.commit()
    update_tower_dates(db, tower)
    db.commit()
    return {"message": "انجام شد", "completed_plans": completed_plan_ids}
