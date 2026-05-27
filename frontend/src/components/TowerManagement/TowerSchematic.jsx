import React from 'react';
// SVG schematic (simplified)
function TowerSchematic({ lines, towers, selectedLineId, selectedTowerId, onSelectLine, onSelectTower, onDeselect }) {
  return (
    <svg viewBox="0 0 900 550" style={{width:'100%',height:'100%'}} onClick={onDeselect}>
      <rect width="900" height="550" fill="#0a0f1a" />
      {lines.map(line => {
        const lineTowers = towers.filter(t => t.line_id === line.id).sort((a,b)=>a.number-b.number);
        if (lineTowers.length < 2) return null;
        const points = lineTowers.map(t => `${t.x},${t.y}`).join(' ');
        return (
          <polyline key={line.id} points={points} stroke={line.color_hex} strokeWidth="5" fill="none"
            onClick={(e) => {e.stopPropagation(); onSelectLine(line.id);}}
          />
        );
      })}
      {towers.map(t => (
        <circle key={t.id} cx={t.x} cy={t.y} r="7" fill="#10b981" stroke="#fff" strokeWidth="2"
          onClick={(e) => {e.stopPropagation(); onSelectTower(t.id);}}
        />
      ))}
    </svg>
  );
}
export default TowerSchematic;
