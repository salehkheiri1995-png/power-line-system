import React from 'react';

function StatsCards({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 30 }}>
      <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>کل عملیات</div>
        <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{stats.total}</div>
      </div>
      <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>کل دکل‌ها</div>
        <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{stats.totalTowers}</div>
      </div>
      <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>میانگین دکل/عملیات</div>
        <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{stats.avgTowers.toFixed(2)}</div>
      </div>
      <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>تعداد واحدها</div>
        <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{Object.keys(stats.unitQuantities).length}</div>
      </div>
    </div>
  );
}

export default StatsCards;
