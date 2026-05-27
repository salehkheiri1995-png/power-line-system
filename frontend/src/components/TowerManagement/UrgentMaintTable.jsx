import React, { useMemo } from 'react';
import api from '../../api';

/**
 * تبدیل تاریخ شمسی (YYYY/MM/DD) به Date میلادی (الگوریتم بک‌اند)
 */
function jalaliToGregorian(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [jy, jm, jd] = parts.map(Number);
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
  const pastYears = jy - 1;
  let days = pastYears * 365 + Math.floor(pastYears / 4);
  if (jm <= 7) days += (jm - 1) * 31;
  else days += 186 + (jm - 7) * 30;
  days += jd - 1;
  const start = new Date(622, 2, 19);
  start.setDate(start.getDate() + days);
  return start;
}

function UrgentMaintTable({ towers, lines, plannedTasks, viewMode, onDataChanged }) {
  const urgentItems = useMemo(() => {
    if (viewMode === 'planned') return [];
    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const items = [];

    // ۱. دکل‌هایی که next_maintenance دارند و موعدشان نزدیک/گذشته است
    towers.forEach(tower => {
      if (tower.next_maintenance) {
        const nextDate = jalaliToGregorian(tower.next_maintenance);
        if (nextDate && (nextDate.getTime() - now.getTime()) <= thirtyDaysMs) {
          items.push({
            type: 'tower',
            id: tower.id,
            displayId: `دکل ${tower.number}`,
            towerNumber: tower.number,
            lineName: lines.find(l => l.id === tower.line_id)?.name || '—',
            lastMaintenance: tower.last_maintenance || '—',
            nextMaintenance: tower.next_maintenance,
            isOverdue: nextDate < now,
            description: null,
          });
        }
      }
    });

    // ۲. برنامه‌های زمان‌بندی‌شده که تاریخشان ≤ ۳۰ روز است (یا گذشته)
    plannedTasks.forEach(task => {
      if (task.date) {
        const taskDate = jalaliToGregorian(task.date);
        if (taskDate && (taskDate.getTime() - now.getTime()) <= thirtyDaysMs) {
          items.push({
            type: 'planned',
            id: task.id,
            displayId: `برنامه #${task.id.slice(-6)}`,
            towerId: task.tower_id,
            towerNumber: task.number,
            lineName: lines.find(l => l.id === task.line_id)?.name || '—',
            lastMaintenance: '—',
            nextMaintenance: task.date,
            isOverdue: taskDate < now,
            description: task.description || task.type,
          });
        }
      }
    });

    // مرتب‌سازی بر اساس تاریخ (نزدیک‌ترین اول)
    return items.sort((a, b) => {
      const da = jalaliToGregorian(a.nextMaintenance);
      const db = jalaliToGregorian(b.nextMaintenance);
      return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
    });
  }, [towers, lines, plannedTasks, viewMode]);

  const handleMarkCompleted = async (item) => {
    try {
      if (item.type === 'tower') {
        await api.post(`/lines-towers/towers/${item.id}/mark-completed`);
      } else if (item.type === 'planned') {
        await api.put(`/lines-towers/planned-tasks/${item.id}/complete`);
      }
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert('خطا در ثبت انجام شد');
    }
  };

  const cellStyle = {
    padding: '6px 8px',
    borderBottom: '1px solid #1e293b',
    fontSize: 13,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ flex: 1, borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h4 style={{ margin: 0, padding: '8px 14px', background: '#0d1520', color: '#f59e0b', fontSize: 14, flexShrink: 0 }}>
        ⚠️ تعمیرات ضروری
      </h4>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ background: '#111b28', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={cellStyle}>شناسه</th>
              <th style={cellStyle}>دکل</th>
              <th style={cellStyle}>خط</th>
              <th style={cellStyle}>آخرین تعمیر</th>
              <th style={cellStyle}>موعد / برنامه</th>
              <th style={cellStyle}>شرح</th>
              <th style={cellStyle}>وضعیت</th>
              <th style={cellStyle}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {urgentItems.map((item) => (
              <tr key={item.type + '-' + item.id} style={{ background: item.isOverdue ? 'rgba(239,68,68,0.1)' : 'transparent' }}>
                <td style={{ ...cellStyle, fontSize: 11 }}>{item.displayId}</td>
                <td style={cellStyle}>{item.towerNumber}</td>
                <td style={cellStyle}>{item.lineName}</td>
                <td style={cellStyle}>{item.lastMaintenance}</td>
                <td style={cellStyle}>
                  {item.nextMaintenance}
                  {item.type === 'planned' && <small style={{ color: '#8b5cf6' }}> (📅 برنامه)</small>}
                </td>
                <td style={{ ...cellStyle, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.description || '—'}
                </td>
                <td style={cellStyle}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    background: item.isOverdue ? '#7f1d1d' : '#78350f',
                    color: item.isOverdue ? '#fca5a5' : '#fcd34d',
                  }}>
                    {item.isOverdue ? '❌ عقب‌افتاده' : '🟡 نزدیک'}
                  </span>
                </td>
                <td style={cellStyle}>
                  <button
                    className="btn-glow"
                    style={{ padding: '2px 10px', fontSize: 12 }}
                    onClick={() => handleMarkCompleted(item)}
                  >
                    ✅ انجام شد
                  </button>
                </td>
              </tr>
            ))}
            {urgentItems.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...cellStyle, textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  {viewMode === 'planned' ? '📋 حالت نمایش: فقط برنامه‌ریزی' : '✅ تمام موارد به‌روز هستند'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UrgentMaintTable;