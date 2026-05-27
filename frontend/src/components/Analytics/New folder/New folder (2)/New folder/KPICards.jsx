import React from 'react';

function KPICards({ stats }) {
  const cards = [
    { label: 'کل عملیات', value: stats.total, color: '#00f0ff' },
    { label: 'عملیات سرد', value: stats.cold, color: '#00e676' },
    { label: 'عملیات گرم', value: stats.warm, color: '#ff4d4d' },
    { label: 'کل دکل‌ها', value: stats.totalTowers, color: '#ffaa00' },
    { label: 'میانگین دکل', value: stats.avgTowers, color: '#b366ff' },
    { label: 'تعداد واحدها', value: Object.keys(stats.unitQuantities).length, color: '#40c4ff' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 30 }}>
      {cards.map(card => (
        <div key={card.label} className="glass-card" style={{ padding: 20, textAlign: 'center', borderLeft: `4px solid ${card.color}` }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{card.label}</div>
          <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8, color: card.color }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}

export default KPICards;