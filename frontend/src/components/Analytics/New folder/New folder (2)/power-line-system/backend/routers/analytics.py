from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import SessionLocal
from models import PowerLineRecord
import datetime

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/pareto")
def pareto_analysis(field: str = Query("work_description"), db: Session = Depends(get_db)):
    """
    تحلیل پارتو: بر اساس فیلد انتخابی (work_description, line_name, location, supervisor)
    تعداد وقوع را محاسبه و درصد تجمعی برمی‌گرداند.
    """
    records = db.query(PowerLineRecord).all()
    counts = {}
    for r in records:
        val = getattr(r, field, None) or "نامشخص"
        counts[val] = counts.get(val, 0) + 1
    sorted_items = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    total = sum(counts.values())
    result = []
    cumsum = 0
    for name, cnt in sorted_items:
        cumsum += cnt
        result.append({
            "label": name,
            "count": cnt,
            "percentage": round(cnt / total * 100, 2),
            "cumulative_percentage": round(cumsum / total * 100, 2)
        })
    return result

@router.get("/trend")
def trend_analysis(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    روند زمانی (ماهانه) تعداد عملیات
    در صورت ارائه start/end می‌تواند فیلتر کند.
    """
    records = db.query(PowerLineRecord).all()
    monthly = {}
    for r in records:
        date_str = r.execution_date
        if not date_str or len(date_str) < 7:
            continue
        month_key = date_str[:7]  # e.g. 1403/01
        monthly[month_key] = monthly.get(month_key, 0) + 1
    sorted_months = sorted(monthly.items())
    return [{"month": m, "count": c} for m, c in sorted_months]

@router.get("/heatmap")
def heatmap_data(db: Session = Depends(get_db)):
    """
    ماتریس متقاطع خط × موقعیت برای تحلیل تمرکز عملیات
    """
    records = db.query(PowerLineRecord).all()
    lines = sorted(list(set(r.line_name for r in records if r.line_name)))
    locations = sorted(list(set(r.location for r in records if r.location)))
    matrix = {line: {loc: 0 for loc in locations} for line in lines}
    for r in records:
        if r.line_name and r.location:
            matrix[r.line_name][r.location] += 1
    return {
        "lines": lines,
        "locations": locations,
        "data": [[matrix[line][loc] for loc in locations] for line in lines]
    }

@router.get("/correlation")
def correlation(db: Session = Depends(get_db)):
    """
    همبستگی بین تعداد دکل‌ها و مقدار کار (quantity) به تفکیک نوع برنامه
    """
    records = db.query(PowerLineRecord).all()
    cold, warm = [], []
    for r in records:
        towers = len((r.tower_number or '').split('-')) if r.tower_number else 0
        qty = r.quantity or 0
        if r.program_type == 'سرد':
            cold.append((towers, qty))
        else:
            warm.append((towers, qty))
    return {
        "cold": [{"towers": t, "quantity": q} for t, q in cold],
        "warm": [{"towers": t, "quantity": q} for t, q in warm]
    }
