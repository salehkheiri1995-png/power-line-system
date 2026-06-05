import React, { useMemo, useState } from 'react';
import api from '../../api';

function GpsEditor({ tower, onSaved }) {
  const [lat, setLat] = useState(tower.latitude ?? '');
  const [lng, setLng] = useState(tower.longitude ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const hasGps = tower.latitude && tower.longitude && tower.latitude !== 0;

  const handleSave = async () => {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (isNaN(latN) || isNaN(lngN)) {
      setMsg({ type: 'err', text: 'مقادیر وارد شده عدد نیستند' });
      return;
    }
    setSaving(true);
    try {
      await api.put(`/lines-towers/towers/${tower.id}/gps`, {
        latitude: latN,
        longitude: lngN,
      });
      setMsg({ type: 'ok', text: 'GPS ذخیره شد — نقشه به‌روز می‌شود' });
      onSaved();
    } catch (e) {
      setMsg({ type: 'err', text: 'خطا در ذخیره‌سازی' });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await api.put(`/lines-towers/towers/${tower.id}/gps`, {
        latitude: 0,
        longitude: 0,
      });
      setLat('');
      setLng('');
      setMsg({ type: 'ok', text: 'GPS پاک شد' });
      onSaved();
    } catch {
      setMsg({ type: 'err', text: 'خطا' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(74,222,128,0.06)',
      border: '1px solid rgba(74,222,128,0.2)',
      borderRadius: 8,
      padding: '10px 12px',
      marginTop: 10,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
        📍 موقعیت GPS دکل
        {hasGps && (
          <span style={{
            marginRight: 8, fontSize: 10,
            background: '#166534', color: '#86efac',
            borderRadius: 4, padding: '1px 6px',
          }}>✓ GPS فعال</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          type="number"
          step="0.00001"
          placeholder="عرض جغرافیایی (Latitude)"
          value={lat}
          onChange={e => setLat(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          step="0.00001"
          placeholder="طول جغرافیایی (Longitude)"
          value={lng}
          onChange={e => setLng(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: '#16a34a', color: '#fff',
            border: 'none', borderRadius: 6,
            padding: '5px 14px', fontSize: 12,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '...' : '💾 ذخیره'}
        </button>

        {hasGps && (
          <button
            onClick={handleClear}
            disabled={saving}
            style={{
              background: 'transparent',
              color: '#f87171', border: '1px solid #f87171',
              borderRadius: 6, padding: '4px 10px',
              fontSize: 11, cursor: 'pointer',
            }}
          >
            🗑 پاک کردن GPS
          </button>
        )}

        {msg && (
          <span style={{ fontSize: 11, color: msg.type === 'ok' ? '#4ade80' : '#f87171' }}>
            {msg.text}
          </span>
        )}
      </div>

      {hasGps && (
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
          مختصات فعلی: {Number(tower.latitude).toFixed(6)}, {Number(tower.longitude).toFixed(6)}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  flex: 1,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  color: '#e2e8f0',
  padding: '5px 8px',
  fontSize: 12,
  outline: 'none',
  direction: 'ltr',
};

function TowerDetail({
  selectedLineId,
  selectedTowerId,
  lines,
  towers,
  maintenanceRecords,
  plannedTasks,
  onAddTower,
  onDataChanged,
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

        {/* ویرایشگر GPS */}
        <GpsEditor tower={tower} onSaved={onDataChanged} />

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
