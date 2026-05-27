import React, { useState } from 'react';

function FilterPanel({ options, onFilter, onClear, records }) {
  // State اصلی فیلترها
  const [filters, setFilters] = useState({
    program_type: '', code: '', voltage_level: '', location: '', supervisor: '',
    dateFromYear: '', dateFromMonth: '', dateFromDay: '',
    dateToYear: '', dateToMonth: '', dateToDay: ''
  });
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedDescs, setSelectedDescs] = useState([]);
  const [lineSearch, setLineSearch] = useState('');
  const [descSearch, setDescSearch] = useState('');

  if (!options) return <div className="glass-card" style={{ padding: '20px' }}>🛰️ در حال بارگذاری فیلترها...</div>;

  // سال‌های موجود در داده‌ها
  const years = Array.from(new Set(
    (records || []).flatMap(r => r.execution_date ? [parseInt(r.execution_date.split('/')[0])] : [])
  )).sort((a, b) => b - a);

  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

  // هندلرهای انتخاب
  const handleLineToggle = (line) => {
    setSelectedLines(prev => prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]);
  };
  const handleDescToggle = (desc) => {
    setSelectedDescs(prev => prev.includes(desc) ? prev.filter(d => d !== desc) : [...prev, desc]);
  };

  // فیلترشونده‌ها با جستجو
  const filteredLines = (options.line_names || []).filter(l => l.includes(lineSearch));
  const filteredDescs = (options.work_descriptions || []).filter(d => d.includes(descSearch));

  const apply = () => {
    onFilter({
      ...filters,
      line_names: selectedLines,
      work_descriptions: selectedDescs,
    });
  };

  const clearAll = () => {
    setFilters({
      program_type: '', code: '', voltage_level: '', location: '', supervisor: '',
      dateFromYear: '', dateFromMonth: '', dateFromDay: '',
      dateToYear: '', dateToMonth: '', dateToDay: ''
    });
    setSelectedLines([]);
    setSelectedDescs([]);
    setLineSearch('');
    setDescSearch('');
    if (onClear) onClear();
  };

  // --- استایل‌های inline برای المان‌های تیره (در کنار CSS) ---
  const selectStyle = {
    background: 'rgba(10, 15, 25, 0.8)',
    color: '#e0f0ff',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    borderRadius: '8px',
    padding: '8px 12px',
    backdropFilter: 'blur(4px)',
    transition: 'all 0.2s',
    outline: 'none',
  };
  const inputStyle = {
    ...selectStyle,
    width: '100%',
  };

  return (
    <div className="glass-card" style={{ padding: '25px', marginBottom: '25px' }}>
      <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🔍</span> فیلترهای پیشرفته
      </h4>

      {/* ردیف اول: فیلترهای اصلی */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>نوع برنامه</label>
          <select style={selectStyle} value={filters.program_type} onChange={e => setFilters({...filters, program_type: e.target.value})}>
            <option value="">همه</option>
            {(options.program_types || []).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>کد</label>
          <select style={selectStyle} value={filters.code} onChange={e => setFilters({...filters, code: e.target.value})}>
            <option value="">همه</option>
            {(options.codes || []).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>سطح ولتاژ</label>
          <select style={selectStyle} value={filters.voltage_level} onChange={e => setFilters({...filters, voltage_level: e.target.value})}>
            <option value="">همه</option>
            {(options.voltage_levels || []).map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>موقعیت</label>
          <select style={selectStyle} value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})}>
            <option value="">همه</option>
            {(options.locations || []).map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>سرپرست</label>
          <select style={selectStyle} value={filters.supervisor} onChange={e => setFilters({...filters, supervisor: e.target.value})}>
            <option value="">همه</option>
            {(options.supervisors || []).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ردیف تاریخ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>📅 از تاریخ</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select style={{...selectStyle, flex:1}} value={filters.dateFromYear} onChange={e => setFilters({...filters, dateFromYear: e.target.value})}>
              <option value="">سال</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select style={{...selectStyle, flex:1}} value={filters.dateFromMonth} onChange={e => setFilters({...filters, dateFromMonth: e.target.value})}>
              <option value="">ماه</option>
              {months.map(m => <option key={m} value={m}>{persianMonths[m-1]}</option>)}
            </select>
            <select style={{...selectStyle, flex:1}} value={filters.dateFromDay} onChange={e => setFilters({...filters, dateFromDay: e.target.value})}>
              <option value="">روز</option>
              {Array.from({length:31}, (_,i)=>i+1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>📅 تا تاریخ</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select style={{...selectStyle, flex:1}} value={filters.dateToYear} onChange={e => setFilters({...filters, dateToYear: e.target.value})}>
              <option value="">سال</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select style={{...selectStyle, flex:1}} value={filters.dateToMonth} onChange={e => setFilters({...filters, dateToMonth: e.target.value})}>
              <option value="">ماه</option>
              {months.map(m => <option key={m} value={m}>{persianMonths[m-1]}</option>)}
            </select>
            <select style={{...selectStyle, flex:1}} value={filters.dateToDay} onChange={e => setFilters({...filters, dateToDay: e.target.value})}>
              <option value="">روز</option>
              {Array.from({length:31}, (_,i)=>i+1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ردیف نام خطوط و شرح کارها */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* نام خطوط */}
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>🔌 نام خطوط</label>
          <input
            style={inputStyle}
            placeholder="جستجوی نام خط..."
            value={lineSearch}
            onChange={e => setLineSearch(e.target.value)}
          />
          <div className="checklist-container" style={{
            background: 'rgba(10,15,25,0.8)',
            border: '1px solid rgba(0,240,255,0.3)',
            borderRadius: '8px',
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            marginTop: '8px',
            backdropFilter: 'blur(4px)',
          }}>
            {filteredLines.map(line => (
              <label key={line} className="checklist-item" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                cursor: 'pointer',
                color: '#e0f0ff',
              }}>
                <input
                  type="checkbox"
                  checked={selectedLines.includes(line)}
                  onChange={() => handleLineToggle(line)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                <span>{line}</span>
              </label>
            ))}
            {filteredLines.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '10px' }}>موردی یافت نشد</div>}
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button className="btn-glow" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => setSelectedLines(options.line_names || [])}>انتخاب همه</button>
            <button style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#e0f0ff',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '13px',
              cursor: 'pointer'
            }} onClick={() => setSelectedLines([])}>حذف همه</button>
          </div>
        </div>

        {/* شرح کارها */}
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '5px', display: 'block' }}>🔧 شرح کارها</label>
          <input
            style={inputStyle}
            placeholder="جستجوی شرح کار..."
            value={descSearch}
            onChange={e => setDescSearch(e.target.value)}
          />
          <div className="checklist-container" style={{
            background: 'rgba(10,15,25,0.8)',
            border: '1px solid rgba(0,240,255,0.3)',
            borderRadius: '8px',
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            marginTop: '8px',
            backdropFilter: 'blur(4px)',
          }}>
            {filteredDescs.map(desc => (
              <label key={desc} className="checklist-item" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                cursor: 'pointer',
                color: '#e0f0ff',
              }}>
                <input
                  type="checkbox"
                  checked={selectedDescs.includes(desc)}
                  onChange={() => handleDescToggle(desc)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                <span>{desc}</span>
              </label>
            ))}
            {filteredDescs.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '10px' }}>موردی یافت نشد</div>}
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button className="btn-glow" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => setSelectedDescs(options.work_descriptions || [])}>انتخاب همه</button>
            <button style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#e0f0ff',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '13px',
              cursor: 'pointer'
            }} onClick={() => setSelectedDescs([])}>حذف همه</button>
          </div>
        </div>
      </div>

      {/* دکمه‌های اعمال و پاک کردن */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button className="btn-glow" onClick={apply}>🚀 اعمال فیلتر</button>
        <button style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#e0f0ff',
          borderRadius: '30px',
          padding: '10px 24px',
          cursor: 'pointer',
          fontSize: '14px',
          backdropFilter: 'blur(4px)',
        }} onClick={clearAll}>🗑️ پاک کردن فیلترها</button>
      </div>
    </div>
  );
}

export default FilterPanel;