import React, { useState, useEffect } from 'react';
import api, { createRecord, getFilterOptions, completePlans } from '../api';
import './AddRecordPanel.css';

const YEARS  = Array.from({ length: 11 }, (_, i) => 1396 + i);
const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

const EMPTY_FORM = {
  program_type: '', code: '', line_name: '', voltage_level: '',
  work_description: '', tower_number: '', location: '', pm_date: '',
  execution_date: '', team_count: '', personnel_count: '',
  supervisor: '', quantity: '', unit: ''
};

function toJalali(date) {
  const d = new Date(date);
  const gy = d.getFullYear(), gm = d.getMonth() + 1, gd = d.getDate();
  const gdm = [0,31,59,90,120,151,181,212,243,273,304,334];
  const g_days = gdm[gm-1] + gd + (gm>2 && ((gy%4===0&&gy%100!==0)||(gy%400===0)) ? 1 : 0);
  const jy = gy - 621;
  let jDay = g_days - 79;
  if (jDay <= 186) {
    const jm = Math.ceil(jDay/31);
    return { year: jy, month: jm, day: jDay - (jm-1)*31 };
  }
  jDay -= 186;
  const jm = Math.ceil(jDay/30) + 6;
  return { year: jy, month: jm, day: jDay - (jm-7)*30 };
}

/** بخون خطا FastAPI را به رشته فارسی تبدیل کن */
function parseErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || 'خطا ناشناخته';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => {
      const loc = d.loc ? d.loc.slice(1).join(' ← ') : '';
      return `فیلد "${loc}": ${d.msg}`;
    }).join(' | ');
  }
  return JSON.stringify(detail);
}

function AddRecordPanel({ onSuccess }) {
  const [form, setForm]   = useState(EMPTY_FORM);
  const [dateYear,  setDateYear]  = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay,   setDateDay]   = useState('');
  const [pmDateText, setPmDateText] = useState('');

  const [lineOptions, setLineOptions]   = useState([]);
  const [descOptions, setDescOptions]   = useState([]);
  const [supOptions,  setSupOptions]    = useState([]);
  const [filteredLines, setFilteredLines] = useState([]);
  const [filteredDescs, setFilteredDescs] = useState([]);

  const [openPlans,  setOpenPlans]  = useState([]);
  const [selByPlan,  setSelByPlan]  = useState({});
  const [plansLoading, setPlansLoading] = useState(false);
  const [allTowers, setAllTowers]   = useState([]);
  const [message,   setMessage]     = useState(null);
  const [submitting, setSubmitting]  = useState(false);

  useEffect(() => {
    getFilterOptions().then(res => {
      setLineOptions(res.data.line_names       || []);
      setDescOptions(res.data.work_descriptions || []);
      setSupOptions( res.data.supervisors       || []);
    });
    api.get('/lines-towers/towers').then(res => setAllTowers(res.data || []));
  }, []);

  useEffect(() => {
    const t = toJalali(new Date());
    setDateYear(t.year.toString());
    setDateMonth(t.month.toString());
    setDateDay(t.day.toString());
    setPmDateText(`${t.year}/${String(t.month).padStart(2,'0')}/${String(t.day).padStart(2,'0')}`);
  }, []);

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLineSearch = (val) => {
    setF('line_name', val);
    if (val.trim()) { setFilteredLines(lineOptions.filter(l => l.includes(val))); fetchOpenPlans(val); }
    else { setFilteredLines([]); setOpenPlans([]); }
  };

  const fetchOpenPlans = async (lineName) => {
    setPlansLoading(true);
    try {
      const res = await api.get(`/lines-towers/planned-tasks/line/${encodeURIComponent(lineName)}/open`);
      setOpenPlans(res.data || []);
      setSelByPlan({});
    } catch { setOpenPlans([]); } finally { setPlansLoading(false); }
  };

  const selectLine = (name) => { setF('line_name', name); setFilteredLines([]); fetchOpenPlans(name); };
  const handleDescSearch = (val) => {
    setF('work_description', val);
    setFilteredDescs(val.trim() ? descOptions.filter(d => d.includes(val)) : []);
  };
  const selectDesc = (name) => { setF('work_description', name); setFilteredDescs([]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.program_type||!form.line_name||!form.voltage_level||
        !form.work_description||!form.tower_number||!form.location) {
      setMessage({ type:'error', text:'لطفاً فیلدهای الزامی را پر کنید (ستاره *)' }); return;
    }
    const executionDate = `${dateYear}/${String(dateMonth).padStart(2,'0')}/${String(dateDay).padStart(2,'0')}`;

    // تبدیل مقادیر عددی از string به float (برای جلوگیری از 422)
    const recordData = {
      ...form,
      pm_date: pmDateText || executionDate,
      execution_date: executionDate,
      team_count:       form.team_count       !== '' ? parseFloat(form.team_count)       : null,
      personnel_count:  form.personnel_count  !== '' ? parseFloat(form.personnel_count)  : null,
      quantity:         form.quantity         !== '' ? parseFloat(form.quantity)          : null,
    };

    const completePlanIds = Object.keys(selByPlan).filter(id => selByPlan[id]?.length > 0);

    setSubmitting(true);
    setMessage({ type:'info', text:'⏳ در حال ثبت اطلاعات...' });
    try {
      await createRecord(recordData);
      if (completePlanIds.length > 0) await completePlans(completePlanIds);
      setMessage({ type:'success', text:`✅ رکورد با موفقیت ثبت شد${completePlanIds.length>0?' و برنامه‌های انتخاب‌شده تکمیل شدند.':'.'}` });
      if (onSuccess) await onSuccess();
      clearForm();
    } catch (err) {
      const msg = parseErrorMessage(err);
      setMessage({ type:'error', text: `❌ ${msg}` });
    } finally { setSubmitting(false); }
  };

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setOpenPlans([]); setSelByPlan({});
    setFilteredLines([]); setFilteredDescs([]);
    setMessage(null);
  };

  return (
    <div className="arp-root">

      {/* ===== Header ===== */}
      <div className="arp-header">
        <div className="arp-header-icon">➕</div>
        <div>
          <h2 className="arp-header-title">ثبت رکورد جدید</h2>
          <p className="arp-header-sub">فیلدهای ستارهدار الزامی هستند</p>
        </div>
      </div>

      {/* ===== Alert ===== */}
      {message && (
        <div className={`arp-alert arp-alert--${message.type}`}>
          {message.text}
          <button className="arp-alert-close" onClick={()=>setMessage(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* ===== Section 1: اطلاعات پایه ===== */}
        <div className="arp-section">
          <div className="arp-section-title">
            <span className="arp-section-dot arp-dot--primary"></span>
            اطلاعات پایه
          </div>
          <div className="arp-grid">

            <div className="arp-field">
              <label className="arp-label">🌡️ نوع برنامه <span className="arp-req">*</span></label>
              <select className="arp-select" value={form.program_type} onChange={e=>setF('program_type',e.target.value)} required disabled={submitting}>
                <option value="">— انتخاب کنید —</option>
                <option value="سرد">❄️ سرد</option>
                <option value="گرم">🔥 گرم</option>
              </select>
            </div>

            <div className="arp-field">
              <label className="arp-label">🔢 کد</label>
              <input className="arp-input" type="text" value={form.code} onChange={e=>setF('code',e.target.value)} placeholder="مثال: A-101" disabled={submitting} />
            </div>

            <div className="arp-field arp-field--wide">
              <label className="arp-label">⚡ نام خط <span className="arp-req">*</span></label>
              <div className="arp-autocomplete">
                <input
                  className="arp-input"
                  type="text"
                  value={form.line_name}
                  onChange={e=>handleLineSearch(e.target.value)}
                  placeholder="جستجو یا انتخاب نام خط..."
                  required
                  disabled={submitting}
                  autoComplete="off"
                />
                {filteredLines.length > 0 && !submitting && (
                  <ul className="arp-dropdown">
                    {filteredLines.slice(0,10).map((l,i)=>(
                      <li key={i} className="arp-dropdown-item" onClick={()=>selectLine(l)}>
                        <span className="arp-dropdown-icon">⚡</span>{l}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="arp-field">
              <label className="arp-label">🔌 سطح ولتاژ <span className="arp-req">*</span></label>
              <select className="arp-select" value={form.voltage_level} onChange={e=>setF('voltage_level',e.target.value)} required disabled={submitting}>
                <option value="">— انتخاب کنید —</option>
                {['63','110','132','230','400'].map(v=><option key={v} value={v}>{v} کیلوولت</option>)}
              </select>
            </div>

            <div className="arp-field">
              <label className="arp-label">🗿 شماره دکل <span className="arp-req">*</span></label>
              <input className="arp-input" type="text" value={form.tower_number} onChange={e=>setF('tower_number',e.target.value)} required disabled={submitting} placeholder="مثال: 12" />
            </div>

            <div className="arp-field">
              <label className="arp-label">📍 موقعیت <span className="arp-req">*</span></label>
              <select className="arp-select" value={form.location} onChange={e=>setF('location',e.target.value)} required disabled={submitting}>
                <option value="">— انتخاب کنید —</option>
                {['کوهستان','دشت','شهری'].map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>

          </div>
        </div>

        {/* ===== Section 2: شرح کار ===== */}
        <div className="arp-section">
          <div className="arp-section-title">
            <span className="arp-section-dot arp-dot--teal"></span>
            شرح انجام کار
          </div>
          <div className="arp-field arp-field--full">
            <label className="arp-label">📄 شرح کار <span className="arp-req">*</span></label>
            <div className="arp-autocomplete">
              <textarea
                className="arp-textarea"
                value={form.work_description}
                onChange={e=>handleDescSearch(e.target.value)}
                placeholder="جستجو یا تایپ شرح کار..."
                required
                disabled={submitting}
                rows={3}
              />
              {filteredDescs.length > 0 && !submitting && (
                <ul className="arp-dropdown">
                  {filteredDescs.slice(0,10).map((d,i)=>(
                    <li key={i} className="arp-dropdown-item" onClick={()=>selectDesc(d)}>
                      <span className="arp-dropdown-icon">🔧</span>{d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ===== Section 3: تاریخ‌ها ===== */}
        <div className="arp-section">
          <div className="arp-section-title">
            <span className="arp-section-dot arp-dot--amber"></span>
            تاریخ‌ها
          </div>
          <div className="arp-grid">

            <div className="arp-field arp-field--wide">
              <label className="arp-label">📅 تاریخ انجام <span className="arp-req">*</span></label>
              <div className="arp-date-row">
                <select className="arp-select" value={dateYear} onChange={e=>setDateYear(e.target.value)} disabled={submitting}>
                  <option value="">سال</option>
                  {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <select className="arp-select" value={dateMonth} onChange={e=>setDateMonth(e.target.value)} disabled={submitting}>
                  <option value="">ماه</option>
                  {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{i+1} — {m}</option>)}
                </select>
                <select className="arp-select" value={dateDay} onChange={e=>setDateDay(e.target.value)} disabled={submitting}>
                  <option value="">روز</option>
                  {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="arp-field">
              <label className="arp-label">📅 تاریخ ثبت گزارش</label>
              <input
                className="arp-input"
                type="text"
                value={pmDateText}
                onChange={e=>setPmDateText(e.target.value)}
                placeholder="YYYY/MM/DD"
                disabled={submitting}
              />
              <span className="arp-hint">فرمت: 1402/06/15</span>
            </div>

          </div>
        </div>

        {/* ===== Section 4: نفرات و سرپرست ===== */}
        <div className="arp-section">
          <div className="arp-section-title">
            <span className="arp-section-dot arp-dot--violet"></span>
            نفرات و سرپرست
          </div>
          <div className="arp-grid">

            <div className="arp-field">
              <label className="arp-label">👥 تعداد اکیپ</label>
              <select className="arp-select" value={form.team_count} onChange={e=>setF('team_count',e.target.value)} disabled={submitting}>
                <option value="">— انتخاب —</option>
                {Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} اکیپ</option>)}
              </select>
            </div>

            <div className="arp-field">
              <label className="arp-label">👤 تعداد نفرات</label>
              <select className="arp-select" value={form.personnel_count} onChange={e=>setF('personnel_count',e.target.value)} disabled={submitting}>
                <option value="">— انتخاب —</option>
                {Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} نفر</option>)}
              </select>
            </div>

            <div className="arp-field">
              <label className="arp-label">👔 سرپرست اکیپ</label>
              <select className="arp-select" value={form.supervisor} onChange={e=>setF('supervisor',e.target.value)} disabled={submitting}>
                <option value="">— انتخاب کنید —</option>
                {supOptions.map((s,i)=><option key={i} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="arp-field">
              <label className="arp-label">📏 مقدار</label>
              <input className="arp-input" type="number" step="0.1" value={form.quantity} onChange={e=>setF('quantity',e.target.value)} placeholder="0" disabled={submitting} />
            </div>

            <div className="arp-field">
              <label className="arp-label">📦 واحد</label>
              <input className="arp-input" type="text" value={form.unit} onChange={e=>setF('unit',e.target.value)} placeholder="مثلاً کیلوگرم" disabled={submitting} />
            </div>

          </div>
        </div>

        {/* ===== Section 5: برنامه‌های باز ===== */}
        {form.line_name && (
          <div className="arp-section arp-section--plans">
            <div className="arp-section-title">
              <span className="arp-section-dot arp-dot--rose"></span>
              برنامه‌های باز خط &laquo;{form.line_name}&raquo;
            </div>

            {plansLoading ? (
              <div className="arp-plans-loading">
                <span className="arp-spinner"></span> در حال بارگذاری برنامه‌ها...
              </div>
            ) : openPlans.length === 0 ? (
              <div className="arp-plans-empty">
                ℹ️ هیچ برنامه‌ای باز برای این خط وجود ندارد.
              </div>
            ) : (
              <div className="arp-plans-list">
                {openPlans.map((plan, idx) => (
                  <div key={idx} className="arp-plan-card">
                    <div className="arp-plan-head">
                      <div className="arp-plan-info">
                        <span className="arp-plan-type">{plan.type}</span>
                        <span className="arp-plan-desc">{plan.description}</span>
                      </div>
                      <button
                        type="button"
                        className="arp-btn arp-btn--outline"
                        disabled={submitting}
                        onClick={() => {
                          const ids = Object.values(selByPlan).flat();
                          const nums = ids.map(tid=>allTowers.find(t=>t.id===tid)?.number).filter(Boolean).join('-');
                          setF('work_description', `${plan.type} - ${plan.description}`);
                          if (nums) setF('tower_number', nums);
                        }}
                      >
                        📋 انتخاب برنامه
                      </button>
                    </div>

                    <div className="arp-plan-towers">
                      {plan.towers.map(tower => (
                        <label key={tower.tower_id} className={`arp-tower-chip${(selByPlan[tower.plan_id]||[]).includes(tower.tower_id)?' arp-tower-chip--active':''}${submitting?' arp-tower-chip--disabled':''}` }>
                          <input
                            type="checkbox"
                            className="arp-tower-cb"
                            disabled={submitting}
                            checked={(selByPlan[tower.plan_id]||[]).includes(tower.tower_id)}
                            onChange={e => {
                              setSelByPlan(prev => {
                                const cur = prev[tower.plan_id]||[];
                                return { ...prev, [tower.plan_id]: e.target.checked ? [...cur, tower.tower_id] : cur.filter(id=>id!==tower.tower_id) };
                              });
                            }}
                          />
                          🗳️ {tower.number}
                        </label>
                      ))}
                      <button
                        type="button"
                        className="arp-btn arp-btn--xs"
                        disabled={submitting}
                        onClick={() => {
                          setSelByPlan(prev => {
                            const n = {...prev};
                            plan.towers.forEach(t => { n[t.plan_id]=[t.tower_id]; });
                            return n;
                          });
                        }}
                      >✓ همه</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Actions ===== */}
        <div className="arp-actions">
          <button type="submit" className="arp-btn arp-btn--primary" disabled={submitting}>
            {submitting
              ? <><span className="arp-spinner arp-spinner--sm"></span> در حال ثبت...،لطفاً صبر کنید</>
              : <>✅ ثبت رکورد</>}
          </button>
          <button type="button" className="arp-btn arp-btn--ghost" disabled={submitting} onClick={clearForm}>
            🗑️ پاک کردن فرم
          </button>
        </div>

      </form>
    </div>
  );
}

export default AddRecordPanel;
