import React, { useMemo } from 'react';

const FIELD_LABELS = {
  program_type:    'نوع برنامه',
  voltage_level:   'سطح ولتاژ',
  code:            'کد',
  supervisor:      'سرپرست',
  work_description:'شرح کار',
  line_name:       'نام خط',
  location:        'موقعیت',
};

function DashboardModal({ field, label, rows, onClose }) {
  /* شرح کارهای انجام شده */
  const workCounts = useMemo(() => {
    const m = {};
    rows.forEach(r => { const w=r.work_description||'نامشخص'; m[w]=(m[w]||0)+1; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  }, [rows]);

  /* خلاصه آماری */
  const totalPers  = rows.reduce((s,r)=>s+(+r.personnel_count||0),0);
  const totalTeams = rows.reduce((s,r)=>s+(+r.team_count||0),0);
  const uniqueLines= [...new Set(rows.map(r=>r.line_name).filter(Boolean))].length;

  if (!rows || rows.length === 0) return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-box" onClick={e=>e.stopPropagation()}>
        <div className="dm-header">
          <span className="dm-title">داده‌ای یافت نشد</span>
          <button className="dm-close" onClick={onClose}>×</button>
        </div>
        <p className="dm-empty">رکوردی برای این بخش وجود ندارد.</p>
        <button className="dm-btn" onClick={onClose}>بستن</button>
      </div>
    </div>
  );

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-box" onClick={e=>e.stopPropagation()}>

        {/* header */}
        <div className="dm-header">
          <div className="dm-header-left">
            <span className="dm-tag">{FIELD_LABELS[field]||field}</span>
            <h3 className="dm-title">{label}</h3>
          </div>
          <button className="dm-close" onClick={onClose}>×</button>
        </div>

        {/* KPI mini */}
        <div className="dm-kpi-row">
          <div className="dm-kpi">
            <span className="dm-kpi-val">{rows.length.toLocaleString('fa-IR')}</span>
            <span className="dm-kpi-label">تعداد عملیات</span>
          </div>
          <div className="dm-kpi">
            <span className="dm-kpi-val">{totalPers.toLocaleString('fa-IR')}</span>
            <span className="dm-kpi-label">جمع نفرات</span>
          </div>
          <div className="dm-kpi">
            <span className="dm-kpi-val">{totalTeams.toLocaleString('fa-IR')}</span>
            <span className="dm-kpi-label">جمع اکیپ</span>
          </div>
          <div className="dm-kpi">
            <span className="dm-kpi-val">{uniqueLines.toLocaleString('fa-IR')}</span>
            <span className="dm-kpi-label">خط منحصربهفرد</span>
          </div>
        </div>

        {/* شرح کارها */}
        <h4 className="dm-section-title">🔝 شرح کارهای انجام شده</h4>
        <div className="dm-table-wrap">
          <table className="dm-table">
            <thead>
              <tr><th>رتبه</th><th>شرح کار</th><th>تعداد</th><th>درصد</th></tr>
            </thead>
            <tbody>
              {workCounts.map(([w,c],i)=>(
                <tr key={i}>
                  <td>{i+1}</td>
                  <td>{w}</td>
                  <td>{c}</td>
                  <td>
                    <div className="dm-bar-cell">
                      <div className="dm-bar-fill" style={{width:`${(c/rows.length*100).toFixed(0)}%`}} />
                      <span>{(c/rows.length*100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* رکوردها */}
        <h4 className="dm-section-title">📃 رکوردها ({rows.length})</h4>
        <div className="dm-table-wrap">
          <table className="dm-table dm-table-sm">
            <thead>
              <tr><th>نوع</th><th>خط</th><th>ولتاژ</th><th>شرح کار</th><th>نفر</th><th>اکیپ</th><th>موقعیت</th><th>تاریخ</th></tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}>
                  <td>{r.program_type}</td>
                  <td>{r.line_name}</td>
                  <td>{r.voltage_level}</td>
                  <td className="dm-td-sm">{r.work_description}</td>
                  <td>{r.personnel_count}</td>
                  <td>{r.team_count}</td>
                  <td>{r.location}</td>
                  <td>{r.execution_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dm-footer">
          <button className="dm-btn" onClick={onClose}>بستن</button>
        </div>
      </div>
    </div>
  );
}

export default DashboardModal;
