import React, { useState } from 'react';

function TowerFilterPanel({ lines, onFilter }) {
  const [viewMode, setViewMode] = useState('all');
  const [programType, setProgramType] = useState('');
  const [lineName, setLineName] = useState('');
  const [voltage, setVoltage] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const apply = () => {
    onFilter({ viewMode, programType, lineName, voltage, location, dateFrom, dateTo });
  };

  const reset = () => {
    setViewMode('all');
    setProgramType('');
    setLineName('');
    setVoltage('');
    setLocation('');
    setDateFrom('');
    setDateTo('');
    onFilter({ viewMode: 'all', programType: '', lineName: '', voltage: '', location: '', dateFrom: '', dateTo: '' });
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'inherit',
  };

  return (
    <div style={{ background: '#162032', borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #334155' }}>
      <h4 style={{ color: '#94a3b8', margin: '0 0 10px', fontSize: 14 }}>🔍 فیلترها</h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ color: '#94a3b8', fontSize: 12 }}>حالت نمایش</label>
        <select style={inputStyle} value={viewMode} onChange={e => setViewMode(e.target.value)}>
          <option value="all">همه موارد</option>
          <option value="completed">فقط انجام‌شده‌ها</option>
          <option value="planned">فقط برنامه‌ریزی‌ها</option>
        </select>

        <label style={{ color: '#94a3b8', fontSize: 12 }}>نوع برنامه</label>
        <select style={inputStyle} value={programType} onChange={e => setProgramType(e.target.value)}>
          <option value="">همه</option>
          <option value="سرد">سرد</option>
          <option value="گرم">گرم</option>
          <option value="برنامه‌ریزی">برنامه‌ریزی</option>
        </select>

        <label style={{ color: '#94a3b8', fontSize: 12 }}>نام خط</label>
        <select style={inputStyle} value={lineName} onChange={e => setLineName(e.target.value)}>
          <option value="">همه</option>
          {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <label style={{ color: '#94a3b8', fontSize: 12 }}>سطح ولتاژ</label>
        <select style={inputStyle} value={voltage} onChange={e => setVoltage(e.target.value)}>
          <option value="">همه</option>
          {[...new Set(lines.map(l => l.voltage).filter(Boolean))].sort((a,b) => a-b).map(v => <option key={v} value={v}>{v} kV</option>)}
        </select>

        <label style={{ color: '#94a3b8', fontSize: 12 }}>موقعیت</label>
        <select style={inputStyle} value={location} onChange={e => setLocation(e.target.value)}>
          <option value="">همه</option>
          <option value="دشت">دشت</option>
          <option value="کوهستان">کوهستان</option>
          <option value="شهری">شهری</option>
        </select>

        <label style={{ color: '#94a3b8', fontSize: 12 }}>از تاریخ (شمسی)</label>
        <input style={inputStyle} placeholder="1404/01/01" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />

        <label style={{ color: '#94a3b8', fontSize: 12 }}>تا تاریخ (شمسی)</label>
        <input style={inputStyle} placeholder="1404/12/29" value={dateTo} onChange={e => setDateTo(e.target.value)} />

        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button className="btn-glow" style={{ flex: 1, fontSize: 12, padding: '6px 0' }} onClick={apply}>اعمال</button>
          <button className="btn-glow" style={{ flex: 1, fontSize: 12, padding: '6px 0', background: '#475569' }} onClick={reset}>پاک کردن</button>
        </div>
      </div>
    </div>
  );
}

export default TowerFilterPanel;