import React, { useState } from 'react';
import InfoDrawer from './InfoDrawer';

function TowerTree({ lines, towers, selectedLineId, selectedTowerId, onSelectLine, onSelectTower, filters = {} }) {
  const [drawer, setDrawer] = useState({ open: false, type: null, data: null, extra: null });

  const filteredTowers = towers.filter(t => {
    if (filters.lineName && t.line_id !== filters.lineName) return false;
    return true;
  });

  const openLineDrawer = (e, line) => {
    e.stopPropagation();
    const towerCount = filteredTowers.filter(t => t.line_id === line.id).length;
    setDrawer({ open: true, type: 'line', data: line, extra: { towerCount } });
  };

  const openTowerDrawer = (e, tower) => {
    e.stopPropagation();
    const line = lines.find(l => l.id === tower.line_id);
    setDrawer({ open: true, type: 'tower', data: tower, extra: { line } });
  };

  return (
    <>
      <InfoDrawer
        open={drawer.open}
        type={drawer.type}
        data={drawer.data}
        extra={drawer.extra}
        onClose={() => setDrawer(d => ({ ...d, open: false }))}
      />

      <div style={{ color: '#e2e8f0', fontSize: 13 }}>
        {lines.map(line => {
          const lineTowers = filteredTowers
            .filter(t => t.line_id === line.id)
            .sort((a, b) => a.number - b.number);
          const isLineSelected = selectedLineId === line.id;

          return (
            <div key={line.id} style={{ marginBottom: 6 }}>
              {/* ─── row خط ─── */}
              <div style={{
                display: 'flex', alignItems: 'center',
                borderRadius: 8,
                background: isLineSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                border: isLineSelected ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                transition: 'all .15s',
                overflow: 'hidden',
              }}>
                {/* نوار رنگ سمت راست */}
                <div style={{ width: 3, alignSelf: 'stretch', background: line.color_hex || '#3b82f6', flexShrink: 0 }} />

                {/* متن ردیف خط */}
                <div
                  onClick={() => onSelectLine(line.id)}
                  style={{ flex: 1, padding: '9px 10px', cursor: 'pointer', minWidth: 0 }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: isLineSelected ? '#60a5fa' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {line.name || line.id}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', gap: 6, marginTop: 2 }}>
                    {(line.voltage_level || line.voltage) && <span style={{ color: '#facc15' }}>{line.voltage_level || line.voltage} kV</span>}
                    <span>{lineTowers.length} دکل</span>
                  </div>
                </div>

                {/* دکمه دیدن مشخصات */}
                <button
                  onClick={(e) => openLineDrawer(e, line)}
                  title="مشخصات خط"
                  style={{
                    background: 'none', border: 'none',
                    color: '#64748b', cursor: 'pointer',
                    padding: '6px 10px', fontSize: 14,
                    flexShrink: 0,
                    transition: 'color .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  \ud83d\udc41
                </button>
              </div>

              {/* ─── دکل‌های خط ─── */}
              {isLineSelected && (
                <div style={{ paddingRight: 10, marginTop: 2 }}>
                  {lineTowers.map(t => {
                    const isTowerSelected = selectedTowerId === t.id;
                    const isUrgent = t.next_maintenance && (() => {
                      const d = t.next_maintenance.split('/');
                      if (d.length !== 3) return false;
                      const [y, m, dd] = d.map(Number);
                      const next = new Date(y + 621, m - 1, dd);
                      return (next - new Date()) / 86400000 <= 30;
                    })();
                    const overdue = !t.last_inspection_date ||
                      (Date.now() - new Date(t.last_inspection_date)) > 2 * 365 * 24 * 3600 * 1000;

                    return (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex', alignItems: 'center',
                          borderRadius: 6, marginBottom: 2,
                          background: isTowerSelected ? 'rgba(0,240,255,0.08)' : 'transparent',
                          border: isTowerSelected ? '1px solid rgba(0,240,255,0.2)' : '1px solid transparent',
                          transition: 'all .15s',
                        }}
                      >
                        <div
                          onClick={() => onSelectTower(t.id)}
                          style={{ flex: 1, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <span style={{ fontSize: 12 }}>🗼</span>
                          <span style={{ color: isTowerSelected ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: isTowerSelected ? 700 : 400 }}>
                            دکل {t.number}
                          </span>
                          {isUrgent && (
                            <span style={{ fontSize: 9, background: '#92400e', color: '#fde68a', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>ضروری</span>
                          )}
                          {overdue && (
                            <span style={{ fontSize: 9, background: '#991b1b', color: '#fca5a5', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>بازرسی</span>
                          )}
                        </div>

                        {/* دکمه دیدن مشخصات دکل */}
                        <button
                          onClick={(e) => openTowerDrawer(e, t)}
                          title="مشخصات دکل"
                          style={{
                            background: 'none', border: 'none',
                            color: '#64748b', cursor: 'pointer',
                            padding: '5px 8px', fontSize: 12,
                            flexShrink: 0, transition: 'color .15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
                          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                        >
                          \ud83d\udc41
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {lines.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', padding: '30px 0', fontSize: 13 }}>
            📭 خطی یافت نشد
          </div>
        )}
      </div>
    </>
  );
}

export default TowerTree;
