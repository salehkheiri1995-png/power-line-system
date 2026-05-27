import React from 'react';

function ChartSection({ title, children }) {
  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 25 }}>
      <h4 style={{ color: 'var(--accent-cyan)', marginBottom: 15 }}>{title}</h4>
      {children}
    </div>
  );
}

export default ChartSection;
