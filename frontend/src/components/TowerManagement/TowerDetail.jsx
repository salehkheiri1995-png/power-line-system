import React, { useMemo } from 'react';

function TowerDetail({
  selectedLineId,
  selectedTowerId,
  lines,
  towers,
  maintenanceRecords,
  plannedTasks,
  onAddTower,
}) {
  const line = lines.find((l) => l.id === selectedLineId);
  const tower = towers.find((t) => t.id === selectedTowerId);

  if (!selectedLineId && !selectedTowerId) {
    return (
      <div className="tower-detail-empty">
        یک خط یا دکل را انتخاب کنید
      </div>
    );
  }

  if (selectedTowerId && tower) {
    const completedRecords = maintenanceRecords
      .filter((r) => r.tower_id === selectedTowerId)
      .sort((a, b) =>
        (a.gregorian_date || '') < (b.gregorian_date || '') ? 1 : -1
      );

    const openPlans = plannedTasks.filter(
      (p) => p.tower_id === selectedTowerId && p.status === 'planned'
    );

    const recentDuplicates = useMemo(() => {
      const now = new Date();
      const counts = {};
      completedRecords.forEach((rec) => {
        if (rec.gregorian_date) {
          const diffDays =
            (now - new Date(rec.gregorian_date)) / (1000 * 60 * 60 * 24);
          if (diffDays <= 30) {
            const key = rec.type || rec.description || 'نامشخص';
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      });
      return counts;
    }, [completedRecords]);

    return (
      <div className="tower-detail-body">
        <h4 className="tower-detail-title">
          🗼 دکل {tower.number} – {line?.name}
        </h4>

        <div className="tower-info-row">
          <span>آخرین تعمیر:</span>
          <span>{tower.last_maintenance || '—'}</span>
        </div>
        <div className="tower-info-row">
          <span>موعد بعدی:</span>
          <span>{tower.next_maintenance || '—'}</span>
        </div>

        {Object.keys(recentDuplicates).length > 0 && (
          <div className="tower-duplicate-warning">
            <strong>⚠️ در ۳۰ روز گذشته:</strong>
            {Object.entries(recentDuplicates).map(([type, count]) => (
              <div key={type}>
                {type}: {count} بار
              </div>
            ))}
          </div>
        )}

        {openPlans.length > 0 && (
          <div className="tower-open-plans">
            <h5>📅 برنامه‌های باز</h5>
            {openPlans.map((plan) => (
              <div key={plan.id} className="tower-plan-card">
                <strong>{plan.date}</strong> – {plan.description || plan.type}
                <br />
                <small>شناسه: {plan.id}</small>
              </div>
            ))}
          </div>
        )}

        <h5 className="tower-history-title">📜 تاریخچه تعمیرات</h5>
        {completedRecords.length === 0 ? (
          <p className="tower-detail-empty">موردی یافت نشد</p>
        ) : (
          completedRecords.map((rec) => (
            <div key={rec.id} className="tower-history-card">
              <strong>{rec.date}</strong> – {rec.type || 'تعمیر'}
              <br />
              <small>{rec.description}</small>
              <br />
              <small>
                سرپرست: {rec.supervisor || '—'} | اکیپ: {rec.crew || '—'} | نفرات:{' '}
                {rec.personnel || '—'}
              </small>
              {rec.planned_task_id && (
                <div className="tower-history-planned-ref">
                  🎯 مرتبط با برنامه #{rec.planned_task_id}
                </div>
              )}
              <div className="tower-history-id">شناسه رکورد: {rec.id}</div>
            </div>
          ))
        )}

        <button
          className="btn-glow tower-add-btn"
          onClick={() => onAddTower(line.id)}
        >
          ➕ افزودن دکل جدید
        </button>
      </div>
    );
  }

  if (selectedLineId && line) {
    const lineTowers = towers.filter((t) => t.line_id === selectedLineId);
    return (
      <div className="tower-detail-body">
        <h4 className="tower-detail-line-title">
          📋 خط: {line.name}
        </h4>
        <div className="tower-info-row">
          <span>ولتاژ:</span>
          <span>{line.voltage} kV</span>
        </div>
        <div className="tower-info-row">
          <span>تعداد دکل‌ها:</span>
          <span>{lineTowers.length}</span>
        </div>
        <button
          className="btn-glow tower-add-btn"
          onClick={() => onAddTower(line.id)}
        >
          ➕ افزودن دکل
        </button>
      </div>
    );
  }

  return null;
}

export default TowerDetail;
