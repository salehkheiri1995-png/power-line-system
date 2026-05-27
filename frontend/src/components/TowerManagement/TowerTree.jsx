import React from 'react';

function TowerTree({ lines, towers, selectedLineId, selectedTowerId, onSelectLine, onSelectTower, filters = {} }) {
  // فیلتر دکل‌ها بر اساس viewMode و lineName
  const filteredTowers = towers.filter(t => {
    if (filters.lineName && t.line_id !== filters.lineName) return false;
    // سایر فیلترها بر اساس maintenanceRecords بعداً می‌تواند اضافه شود
    return true;
  });

  return (
    <div style={{ color: '#e2e8f0', fontSize: 14 }}>
      {lines.map(line => {
        const lineTowers = filteredTowers
          .filter(t => t.line_id === line.id)
          .sort((a, b) => a.number - b.number);
        return (
          <div key={line.id} style={{ marginBottom: 8 }}>
            <div
              onClick={() => onSelectLine(line.id)}
              style={{
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 'bold',
                background: selectedLineId === line.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: selectedLineId === line.id ? '#3b82f6' : '#e2e8f0',
              }}
            >
              {line.name} ({lineTowers.length})
            </div>
            {selectedLineId === line.id && lineTowers.map(t => (
              <div
                key={t.id}
                onClick={() => onSelectTower(t.id)}
                style={{
                  padding: '6px 20px', cursor: 'pointer', borderRadius: 4,
                  color: selectedTowerId === t.id ? '#fff' : '#94a3b8',
                  background: selectedTowerId === t.id ? 'rgba(0,240,255,0.1)' : 'transparent',
                }}
              >
                🗼 دکل {t.number}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default TowerTree;