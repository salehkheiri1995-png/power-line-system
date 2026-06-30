from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import PowerLineRecord, User
from auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

_ALLOWED_PARETO_FIELDS = {
    "work_description", "line_name", "voltage_level",
    "location", "supervisor", "program_type", "code",
}


@router.get("/pareto")
def pareto(
    field: str = Query("work_description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if field not in _ALLOWED_PARETO_FIELDS:
        raise HTTPException(
            status_code=400,
            detail=f"فیلد '{field}' مجاز نیست. فیلدهای مجاز: {', '.join(_ALLOWED_PARETO_FIELDS)}"
        )
    records = db.query(PowerLineRecord).all()
    counts: dict = {}
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
            "percentage": round(cnt / total * 100, 2),
            "cumulative_percentage": round(cumsum / total * 100, 2),
        })
    return result


@router.get("/trend")
def trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(PowerLineRecord).all()
    monthly: dict = {}
    for r in records:
        d = r.execution_date
        if d and len(d) >= 7:
            key = d[:7]
            monthly[key] = monthly.get(key, 0) + 1
    sorted_months = sorted(monthly.items())
    if start_date:
        sorted_months = [(m, c) for m, c in sorted_months if m >= start_date[:7]]
    if end_date:
        sorted_months = [(m, c) for m, c in sorted_months if m <= end_date[:7]]
    return [{"month": m, "count": c} for m, c in sorted_months]


@router.get("/heatmap")
def heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(PowerLineRecord).all()
    lines = sorted({r.line_name for r in records if r.line_name})
    locations = sorted({r.location for r in records if r.location})
    mat = {line: {loc: 0 for loc in locations} for line in lines}
    for r in records:
        if r.line_name in mat and r.location in mat[r.line_name]:
            mat[r.line_name][r.location] += 1
    return {
        "lines": lines,
        "locations": locations,
        "data": [[mat[line][loc] for loc in locations] for line in lines],
    }


@router.get("/correlation")
def correlation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(PowerLineRecord).all()
    cold, warm = [], []
    for r in records:
        towers = len((r.tower_number or "").split("-")) if r.tower_number else 0
        qty = r.quantity or 0
        entry = {"towers": towers, "quantity": qty}
        if r.program_type == "سرد":
            cold.append(entry)
        else:
            warm.append(entry)
    return {"cold": cold, "warm": warm}
