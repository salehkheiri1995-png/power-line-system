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

  // اگر چیزی انتخاب نشده باشد
  if (!selectedLineId && !selectedTowerId) {
    return (
      <div style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>
        یک خط یا دکل را انتخاب کنید
      </div>
    );
  }

  // ---- نمایش جزئیات دکل ----
  if (selectedTowerId && tower) {
    // تاریخچه تعمیرات انجام‌شده (همه رکوردها)
    const completedRecords = maintenanceRecords
      .filter((r) => r.tower_id === selectedTowerId)
      .sort((a, b) =>
        (a.gregorian_date || '') < (b.gregorian_date || '') ? 1 : -1
      );

    // برنامه‌های باز (هنوز تکمیل نشده)
    const openPlans = plannedTasks.filter(
      (p) => p.tower_id === selectedTowerId && p.status === 'planned'
    );

    // محاسبه تعداد کارهای مشابه در 30 روز گذشته (اختیاری)
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
      <div style={{ color: '#e2e8f0', fontSize: 14 }}>
        <h4 style={{ color: '#3b82f6', margin: '0 0 10px' }}>
          🗼 دکل {tower.number} – {line?.name}
        </h4>

        <div style={infoRow}>
          <span>آخرین تعمیر:</span>
          <span style={{ fontWeight: 600 }}>
            {tower.last_maintenance || '—'}
          </span>
        </div>
        <div style={infoRow}>
          <span>موعد بعدی:</span>
          <span style={{ fontWeight: 600 }}>
            {tower.next_maintenance || '—'}
          </span>
        </div>

        {/* هشدار ثبت‌های تکراری */}
        {Object.keys(recentDuplicates).length > 0 && (
          <div style={{ margin: '10px 0', padding: 8, background: '#332020', borderRadius: 6, fontSize: 12 }}>
            <strong>⚠️ در ۳۰ روز گذشته:</strong>
            {Object.entries(recentDuplicates).map(([type, count]) => (
              <div key={type}>
                {type}: {count} بار
              </div>
            ))}
          </div>
        )}

        {/* برنامه‌های باز */}
        {openPlans.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <h5 style={{ color: '#8b5cf6', marginBottom: 5 }}>📅 برنامه‌های باز</h5>
            {openPlans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: '#2a1f3d',
                  padding: 6,
                  borderRadius: 6,
                  marginBottom: 4,
                  borderRight: '3px solid #8b5cf6',
                  fontSize: 12,
                }}
              >
                <strong>{plan.date}</strong> – {plan.description || plan.type}
                <br />
                <small>شناسه: {plan.id}</small>
              </div>
            ))}
          </div>
        )}

        {/* تاریخچه انجام‌شده */}
        <h5 style={{ marginTop: 15, color: '#10b981' }}>📜 تاریخچه تعمیرات</h5>
        {completedRecords.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>موردی یافت نشد</p>
        ) : (
          completedRecords.map((rec) => (
            <div
              key={rec.id}
              style={{
                background: '#1e293b',
                padding: 8,
                margin: '4px 0',
                borderRadius: 6,
                borderRight: '3px solid #10b981',
                fontSize: 13,
              }}
            >
              <strong>{rec.date}</strong> – {rec.type || 'تعمیر'}
              <br />
              <small>{rec.description}</small>
              <br />
              <small>
                سرپرست: {rec.supervisor || '—'} | اکیپ: {rec.crew || '—'} | نفرات:{' '}
                {rec.personnel || '—'}
              </small>
              {rec.planned_task_id && (
                <div style={{ marginTop: 4, color: '#8b5cf6', fontSize: 11 }}>
                  🎯 مرتبط با برنامه #{rec.planned_task_id}
                </div>
              )}
              <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>
                شناسه رکورد: {rec.id}
              </div>
            </div>
          ))
        )}

        <button
          className="btn-glow"
          style={{ marginTop: 12, background: '#10b981' }}
          onClick={() => onAddTower(line.id)}
        >
          ➕ افزودن دکل جدید
        </button>
      </div>
    );
  }

  // ---- نمایش جزئیات خط ----
  if (selectedLineId && line) {
    const lineTowers = towers.filter((t) => t.line_id === selectedLineId);
    return (
      <div style={{ color: '#e2e8f0', fontSize: 14 }}>
        <h4 style={{ color: '#3b82f6', margin: '0 0 10px' }}>
          📋 خط: {line.name}
        </h4>
        <div style={infoRow}>
          <span>ولتاژ:</span>
          <span>{line.voltage} kV</span>
        </div>
        <div style={infoRow}>
          <span>تعداد دکل‌ها:</span>
          <span>{lineTowers.length}</span>
        </div>
        <button
          className="btn-glow"
          style={{ marginTop: 12, background: '#10b981' }}
          onClick={() => onAddTower(line.id)}
        >
          ➕ افزودن دکل
        </button>
      </div>
    );
  }

  return null;
}

const infoRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: 13,
};

export default TowerDetail;