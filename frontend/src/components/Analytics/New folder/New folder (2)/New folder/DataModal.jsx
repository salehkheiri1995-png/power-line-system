import React from 'react';

function DataModal({ title, selectedLabel, filteredData, allData, onClose }) {
  if (!filteredData || filteredData.length === 0) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div className="glass-card" style={emptyModalStyle} onClick={(e) => e.stopPropagation()}>
          <p>داده‌ای برای این بخش موجود نیست.</p>
          <button className="btn-glow" onClick={onClose}>بستن</button>
        </div>
      </div>
    );
  }

  // شمارش شرح کارها
  const workCounts = {};
  filteredData.forEach(r => {
    const w = r.work_description || 'نامشخص';
    workCounts[w] = (workCounts[w] || 0) + 1;
  });
  const sortedWorks = Object.entries(workCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        className="glass-card"
        style={modalContentStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
          <h3 style={{ color: 'var(--accent-cyan)', margin: 0 }}>📊 داده‌های: {selectedLabel}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff4d4d',
              fontSize: 28,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          {title} — تعداد کل: {filteredData.length} عملیات
        </p>

        {/* جدول شرح کارها */}
        <h4 style={{ color: 'var(--accent-cyan)', margin: '20px 0 12px' }}>🔝 شرح کارهای انجام شده</h4>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="space-table" style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th>رتبه</th>
                <th>شرح کار</th>
                <th>تعداد</th>
                <th>درصد</th>
              </tr>
            </thead>
            <tbody>
              {sortedWorks.map(([work, count], idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td style={{ fontSize: 12 }}>{work}</td>
                  <td>{count}</td>
                  <td>{((count / filteredData.length) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* جدول تمام رکوردها */}
        <h4 style={{ color: 'var(--accent-cyan)', margin: '20px 0 12px' }}>📋 تمام رکوردها</h4>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="space-table" style={{ width: '100%', fontSize: 11 }}>
            <thead>
              <tr>
                <th>نوع</th>
                <th>خط</th>
                <th>ولتاژ</th>
                <th>کار</th>
                <th>مقدار</th>
                <th>موقعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr key={i}>
                  <td>{row.program_type}</td>
                  <td>{row.line_name}</td>
                  <td>{row.voltage_level}</td>
                  <td style={{ fontSize: 10 }}>{row.work_description}</td>
                  <td>{row.quantity} {row.unit}</td>
                  <td>{row.location}</td>
                  <td>{row.execution_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="btn-glow" style={{ marginTop: 20, width: '100%' }} onClick={onClose}>
          بستن
        </button>
      </div>
    </div>
  );
}

// استایل‌های inline برای overlay و modal
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const modalContentStyle = {
  width: '90%',
  maxWidth: '900px',
  maxHeight: '85vh',
  overflowY: 'auto',
  padding: '25px',
  borderRadius: '16px',
  border: '1px solid rgba(0, 240, 255, 0.3)',
  boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)',
};

const emptyModalStyle = {
  padding: 20,
  textAlign: 'center',
};

export default DataModal;