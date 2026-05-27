from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import SessionLocal
from models import PowerLineRecord

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/pareto")
def pareto(field: str = Query("work_description"), db: Session = Depends(get_db)):
    records = db.query(PowerLineRecord).all()
    counts = {}
    for r in records:
        val = getattr(r, field, None) or "نامشخص"
        counts[val] = counts.get(val, 0) + 1
    sorted_items = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    total = sum(counts.values())
    result, cumsum = [], 0
    for name, cnt in sorted_items:
        cumsum += cnt
        result.append({
            "label": name,
            "count": cnt,
            "percentage": round(cnt/total*100,2),
            "cumulative_percentage": round(cumsum/total*100,2)
        })
    return result

@router.get("/trend")
def trend(start_date: Optional[str]=None, end_date: Optional[str]=None, db: Session=Depends(get_db)):
    records = db.query(PowerLineRecord).all()
    monthly = {}
    for r in records:
        d = r.execution_date
        if d and len(d)>=7:
            key = d[:7]
            monthly[key] = monthly.get(key,0)+1
    sorted_months = sorted(monthly.items())
    return [{"month": m, "count": c} for m,c in sorted_months]

@router.get("/heatmap")
def heatmap(db: Session=Depends(get_db)):
    records = db.query(PowerLineRecord).all()
    lines = sorted({r.line_name for r in records if r.line_name})
    locations = sorted({r.location for r in records if r.location})
    mat = {l: {loc:0 for loc in locations} for l in lines}
    for r in records:
        if r.line_name in mat and r.location in mat[r.line_name]:
            mat[r.line_name][r.location] += 1
    return {"lines":lines, "locations":locations, "data":[[mat[l][loc] for loc in locations] for l in lines]}

@router.get("/correlation")
def correlation(db: Session=Depends(get_db)):
    records = db.query(PowerLineRecord).all()
    cold, warm = [], []
    for r in records:
        towers = len((r.tower_number or '').split('-')) if r.tower_number else 0
        qty = r.quantity or 0
        if r.program_type == 'سرد':
            cold.append({"towers":towers, "quantity":qty})
        else:
            warm.append({"towers":towers, "quantity":qty})
    return {"cold":cold, "warm":warm}