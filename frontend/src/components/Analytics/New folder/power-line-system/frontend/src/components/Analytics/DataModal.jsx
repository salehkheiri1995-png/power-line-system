import React from 'react';

function DataModal({ title, selectedLabel, filteredData, allData, onClose }) {
  if (!filteredData || filteredData.length === 0) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div className="glass-card" style={{ padding: 20, textAlign: 'center' }} onClick={e=>e.stopPropagation()}>
          <p>داده‌ای برای این بخش موجود نیست.</p>
          <button className="btn-glow" onClick={onClose}>بستن</button>
        </div>
      </div>
    );
  }

  const workCounts = {};
  filteredData.forEach(r => {
    const w = r.work_description || 'نامشخص';
    workCounts[w] = (workCounts[w] || 0) + 1;
  });
  const sortedWorks = Object.entries(workCounts).sort((a,b)=>b[1]-a[1]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="glass-card" style={modalStyle} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:15 }}>
          <h3 style={{ color:'var(--accent-cyan)' }}>📊 داده‌های: {selectedLabel}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#ff4d4d', fontSize:28, cursor:'pointer' }}>✕</button>
        </div>
        <p style={{ color:'var(--text-secondary)' }}>{title} — تعداد کل: {filteredData.length} عملیات</p>

        <h4 style={{ color:'var(--accent-cyan)', marginTop:20 }}>🔝 شرح کارهای انجام شده</h4>
        <div style={{ maxHeight:300, overflowY:'auto' }}>
          <table className="space-table" style={{ width:'100%', fontSize:13 }}>
            <thead><tr><th>رتبه</th><th>شرح کار</th><th>تعداد</th><th>درصد</th></tr></thead>
            <tbody>
              {sortedWorks.map(([w,c], i)=>(
                <tr key={i}><td>{i+1}</td><td>{w}</td><td>{c}</td><td>{((c/filteredData.length)*100).toFixed(1)}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 style={{ color:'var(--accent-cyan)', marginTop:20 }}>📋 تمام رکوردها</h4>
        <div style={{ maxHeight:300, overflowY:'auto' }}>
          <table className="space-table" style={{ width:'100%', fontSize:11 }}>
            <thead><tr><th>نوع</th><th>خط</th><th>ولتاژ</th><th>کار</th><th>مقدار</th><th>موقعیت</th><th>تاریخ</th></tr></thead>
            <tbody>
              {filteredData.map((r,i)=>(
                <tr key={i}><td>{r.program_type}</td><td>{r.line_name}</td><td>{r.voltage_level}</td><td style={{fontSize:10}}>{r.work_description}</td><td>{r.quantity} {r.unit}</td><td>{r.location}</td><td>{r.execution_date}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-glow" style={{ marginTop:20, width:'100%' }} onClick={onClose}>بستن</button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
  backgroundColor:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)',
  display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999
};

const modalStyle = {
  width:'90%', maxWidth:'900px', maxHeight:'85vh', overflowY:'auto',
  padding:25, borderRadius:16, border:'1px solid rgba(0,240,255,0.3)',
  boxShadow:'0 0 40px rgba(0,240,255,0.2)'
};

export default DataModal;
