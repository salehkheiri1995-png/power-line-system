import React, { useState } from 'react';

function FilterPanel({ options, onFilter, onClear, records }) {
  const [filters, setFilters] = useState({
    program_type:'', code:'', voltage_level:'', location:'', supervisor:'',
    dateFromYear:'', dateFromMonth:'', dateFromDay:'',
    dateToYear:'',   dateToMonth:'',   dateToDay:'',
  });
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedDescs, setSelectedDescs] = useState([]);
  const [lineSearch,    setLineSearch]    = useState('');
  const [descSearch,    setDescSearch]    = useState('');
  const [open, setOpen] = useState(true);

  if (!options) return (
    <div className="fp-root">
      <div className="fp-loading">⌛ در حال بارگذاری فیلترها...</div>
    </div>
  );

  const years = Array.from(new Set(
    (records||[]).flatMap(r => r.execution_date ? [parseInt(r.execution_date.split('/')[0])] : [])
  )).sort((a,b) => b-a);

  const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const DAYS  = Array.from({length:31}, (_,i) => i+1);

  const filteredLines = (options.line_names||[]).filter(l => l.includes(lineSearch));
  const filteredDescs = (options.work_descriptions||[]).filter(d => d.includes(descSearch));

  const toggle = (arr, set, val) =>
    set(prev => prev.includes(val) ? prev.filter(x=>x!==val) : [...prev, val]);

  const apply = () => onFilter({ ...filters, line_names:selectedLines, work_descriptions:selectedDescs });

  const clearAll = () => {
    setFilters({ program_type:'',code:'',voltage_level:'',location:'',supervisor:'',
                 dateFromYear:'',dateFromMonth:'',dateFromDay:'',
                 dateToYear:'',  dateToMonth:'',  dateToDay:'' });
    setSelectedLines([]); setSelectedDescs([]);
    setLineSearch('');    setDescSearch('');
    onClear?.();
  };

  const hasActive = selectedLines.length || selectedDescs.length ||
    Object.values(filters).some(v => v !== '');

  return (
    <div className="fp-root">

      {/* ─── header bar ─── */}
      <div className="fp-header" onClick={() => setOpen(o=>!o)}>
        <div className="fp-header-left">
          <span className="fp-header-icon">🔍</span>
          <span className="fp-header-title">فیلترهای پیشرفته</span>
          {hasActive && <span className="fp-badge">{selectedLines.length + selectedDescs.length + Object.values(filters).filter(v=>v!=='').length}</span>}
        </div>
        <button className="fp-toggle-btn" aria-label="باز/بسته">
          <span className={`fp-chevron${open?' fp-chevron-up':''}`}>▾</span>
        </button>
      </div>

      {open && (
        <div className="fp-body">

          {/* ─── ردیف ۱: سلکت‌های اصلی ─── */}
          <div className="fp-row fp-row-5">
            {[
              {label:'نوع برنامه', key:'program_type',  opts: options.program_types  ||[]},
              {label:'کد',          key:'code',          opts: options.codes          ||[]},
              {label:'سطح ولتاژ',  key:'voltage_level', opts: options.voltage_levels ||[]},
              {label:'موقعیت',      key:'location',      opts: options.locations      ||[]},
              {label:'سرپرست',      key:'supervisor',    opts: options.supervisors    ||[]},
            ].map(({label,key,opts}) => (
              <div key={key} className="fp-field">
                <label className="fp-label">{label}</label>
                <select
                  className="fp-select"
                  value={filters[key]}
                  onChange={e => setFilters({...filters,[key]:e.target.value})}
                >
                  <option value="">— همه —</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* ─── ردیف ۲: تاریخ ─── */}
          <div className="fp-row fp-row-2">
            {[{label:'📅 از تاریخ', pre:'dateFrom'}, {label:'📅 تا تاریخ', pre:'dateTo'}].map(({label,pre}) => (
              <div key={pre} className="fp-field">
                <label className="fp-label">{label}</label>
                <div className="fp-date-row">
                  <select className="fp-select" value={filters[pre+'Year']}  onChange={e=>setFilters({...filters,[pre+'Year']:e.target.value})}>
                    <option value="">سال</option>
                    {years.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                  <select className="fp-select" value={filters[pre+'Month']} onChange={e=>setFilters({...filters,[pre+'Month']:e.target.value})}>
                    <option value="">ماه</option>
                    {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <select className="fp-select" value={filters[pre+'Day']}   onChange={e=>setFilters({...filters,[pre+'Day']:e.target.value})}>
                    <option value="">روز</option>
                    {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* ─── ردیف ۳: checklistها ─── */}
          <div className="fp-row fp-row-2">

            {/* نام خطوط */}
            <div className="fp-field">
              <label className="fp-label">🔌 نام خطوط
                {selectedLines.length > 0 &&
                  <span className="fp-badge fp-badge-sm">{selectedLines.length}</span>}
              </label>
              <input className="fp-input" placeholder="جستجو..."
                value={lineSearch} onChange={e=>setLineSearch(e.target.value)} />
              <div className="fp-checklist">
                {filteredLines.length === 0
                  ? <div className="fp-empty">موردی یافت نشد</div>
                  : filteredLines.map(line => (
                    <label key={line} className={`fp-check-item${selectedLines.includes(line)?' fp-check-item--active':''}` }>
                      <input type="checkbox" className="fp-checkbox"
                        checked={selectedLines.includes(line)}
                        onChange={()=>toggle(selectedLines,setSelectedLines,line)} />
                      <span>{line}</span>
                    </label>
                  ))}
              </div>
              <div className="fp-checklist-actions">
                <button className="fp-action-btn fp-action-btn--primary"
                  onClick={()=>setSelectedLines(options.line_names||[])}>✓ همه</button>
                <button className="fp-action-btn"
                  onClick={()=>setSelectedLines([])}>× حذف</button>
              </div>
            </div>

            {/* شرح کارها */}
            <div className="fp-field">
              <label className="fp-label">🔧 شرح کارها
                {selectedDescs.length > 0 &&
                  <span className="fp-badge fp-badge-sm">{selectedDescs.length}</span>}
              </label>
              <input className="fp-input" placeholder="جستجو..."
                value={descSearch} onChange={e=>setDescSearch(e.target.value)} />
              <div className="fp-checklist">
                {filteredDescs.length === 0
                  ? <div className="fp-empty">موردی یافت نشد</div>
                  : filteredDescs.map(desc => (
                    <label key={desc} className={`fp-check-item${selectedDescs.includes(desc)?' fp-check-item--active':''}`}>
                      <input type="checkbox" className="fp-checkbox"
                        checked={selectedDescs.includes(desc)}
                        onChange={()=>toggle(selectedDescs,setSelectedDescs,desc)} />
                      <span>{desc}</span>
                    </label>
                  ))}
              </div>
              <div className="fp-checklist-actions">
                <button className="fp-action-btn fp-action-btn--primary"
                  onClick={()=>setSelectedDescs(options.work_descriptions||[])}>✓ همه</button>
                <button className="fp-action-btn"
                  onClick={()=>setSelectedDescs([])}>× حذف</button>
              </div>
            </div>
          </div>

          {/* ─── دکمه‌ها ─── */}
          <div className="fp-actions">
            <button className="fp-btn fp-btn--primary" onClick={apply}>
              <span>🚀</span> اعمال فیلتر
            </button>
            {hasActive && (
              <button className="fp-btn fp-btn--ghost" onClick={clearAll}>
                <span>🗑️</span> پاک کردن
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
