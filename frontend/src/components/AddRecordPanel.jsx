import React, { useState, useEffect } from 'react';
import api, { createRecord, getFilterOptions, completePlans } from '../api';

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

function AddRecordPanel({ onSuccess }) {
  // ----- state های اصلی فرم -----
  const [form, setForm] = useState({
    program_type: '', code: '', line_name: '', voltage_level: '',
    work_description: '', tower_number: '', location: '',
    pm_date: '', execution_date: '', team_count: '', personnel_count: '',
    supervisor: '', quantity: '', unit: ''
  });

  const [dateYear, setDateYear] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');
  const [pmDateText, setPmDateText] = useState('');

  const [lineOptions, setLineOptions] = useState([]);
  const [descOptions, setDescOptions] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [filteredLines, setFilteredLines] = useState([]);
  const [filteredDescs, setFilteredDescs] = useState([]);

  // ----- برنامه‌های باز -----
  const [openPlans, setOpenPlans] = useState([]);
  const [selectedTowerIdsByPlan, setSelectedTowerIdsByPlan] = useState({}); // { planId: [towerId] }
  const [plansLoading, setPlansLoading] = useState(false);
  const [allTowers, setAllTowers] = useState([]); // برای نگاشت tower_id → number
  const [message, setMessage] = useState(null);

  // بارگذاری گزینه‌ها و همه دکل‌ها
  useEffect(() => {
    getFilterOptions().then(res => {
      setLineOptions(res.data.line_names || []);
      setDescOptions(res.data.work_descriptions || []);
      setSupervisorOptions(res.data.supervisors || []);
    });
    api.get('/lines-towers/towers').then(res => setAllTowers(res.data || []));
  }, []);

  // تاریخ امروز
  useEffect(() => {
    const today = new Date();
    const jToday = toJalali(today);
    setDateYear(jToday.year.toString());
    setDateMonth(jToday.month.toString());
    setDateDay(jToday.day.toString());
    setPmDateText(`${jToday.year}/${String(jToday.month).padStart(2, '0')}/${String(jToday.day).padStart(2, '0')}`);
  }, []);

  // ----- جستجوی خط و دریافت برنامه‌های باز -----
  const handleLineSearch = (value) => {
    setForm({ ...form, line_name: value });
    if (value.trim()) {
      setFilteredLines(lineOptions.filter(l => l.includes(value)));
      fetchOpenPlans(value);
    } else {
      setFilteredLines([]);
      setOpenPlans([]);
    }
  };

  const fetchOpenPlans = async (lineName) => {
    setPlansLoading(true);
    try {
      const res = await api.get(`/lines-towers/planned-tasks/line/${encodeURIComponent(lineName)}/open`);
      setOpenPlans(res.data || []);
      setSelectedTowerIdsByPlan({});
    } catch (err) {
      console.error('خطا در بارگذاری برنامه‌ها:', err);
      setOpenPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const selectLine = (name) => {
    setForm({ ...form, line_name: name });
    setFilteredLines([]);
    fetchOpenPlans(name);
  };

  // ----- جستجوی شرح کار -----
  const handleDescSearch = (value) => {
    setForm({ ...form, work_description: value });
    if (value.trim()) {
      setFilteredDescs(descOptions.filter(d => d.includes(value)));
    } else {
      setFilteredDescs([]);
    }
  };

  const selectDesc = (name) => {
    setForm({ ...form, work_description: name });
    setFilteredDescs([]);
  };

  // ----- ثبت فرم -----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.program_type || !form.line_name || !form.voltage_level || !form.work_description || !form.tower_number || !form.location) {
      setMessage({ type: 'error', text: 'لطفاً فیلدهای الزامی را پر کنید.' });
      return;
    }

    const executionDate = `${dateYear}/${String(dateMonth).padStart(2, '0')}/${String(dateDay).padStart(2, '0')}`;
    const recordData = {
      ...form,
      pm_date: pmDateText || executionDate,
      execution_date: executionDate,
    };

    // استخراج شناسه‌های برنامه‌هایی که حداقل یک دکلشان تیک خورده
    const completePlanIds = Object.keys(selectedTowerIdsByPlan).filter(
      planId => selectedTowerIdsByPlan[planId]?.length > 0
    );

    try {
      await createRecord(recordData, completePlanIds);
      if (completePlanIds.length > 0) {
        await completePlans(completePlanIds);
      }
      // پیام موفقیت واضح‌تر بعد از ثبت رکورد
      setMessage({
        type: 'success',
        text: `✅ رکورد جدید با موفقیت ثبت شد${completePlanIds.length > 0 ? ' و برنامه‌های انتخاب‌شده تکمیل شدند.' : '.'}`,
      });
      if (onSuccess) onSuccess();

      // بعد از چند ثانیه پیام را مخفی کن
      setTimeout(() => setMessage(null), 4000);

      // ریست فرم
      setForm({
        program_type: '', code: '', line_name: '', voltage_level: '', work_description: '',
        tower_number: '', location: '', team_count: '', personnel_count: '',
        supervisor: '', quantity: '', unit: ''
      });
      setOpenPlans([]);
      setSelectedTowerIdsByPlan({});
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: '❌ خطا در ثبت رکورد.' });
      // خطا هم بعد از چند ثانیه جمع شود
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // ----- تبدیل میلادی به شمسی -----
  const toJalali = (date) => {
    const d = new Date(date);
    const gy = d.getFullYear();
    const gm = d.getMonth() + 1;
    const gd = d.getDate();
    const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const g_days = gdm[gm - 1] + gd + (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 1 : 0);
    const jy = gy - 621;
    let jDay = g_days - 79;
    if (jDay <= 186) {
      const jm = Math.ceil(jDay / 31);
      const jd = jDay - (jm - 1) * 31;
      return { year: jy, month: jm, day: jd };
    } else {
      jDay -= 186;
      const jm = Math.ceil(jDay / 30) + 6;
      const jd = jDay - (jm - 7) * 30;
      return { year: jy, month: jm, day: jd };
    }
  };

  // ----- استایل‌ها -----
  const inputStyle = {
    width: '100%', padding: '10px 12px', background: 'rgba(10,15,25,0.8)',
    border: '1px solid rgba(0,240,255,0.3)', borderRadius: '8px',
    color: '#e0f0ff', fontSize: '0.9rem', outline: 'none',
  };

  const suggestionsStyle = {
    position: 'absolute', top: '100%', left: 0, right: 0,
    background: 'rgba(15,25,35,0.95)', border: '1px solid var(--accent-cyan)',
    borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 100,
  };

  return (
    <div className="glass-card" style={{ padding: '30px' }}>
      <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '20px' }}>➕ ثبت رکورد جدید</h3>

      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '15px' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {/* فیلدهای فرم (همان قبلی، بدون تغییر) */}
          <div>
            <label>🌡️ نوع برنامه *</label>
            <select value={form.program_type} onChange={e => setForm({...form, program_type: e.target.value})} required style={inputStyle}>
              <option value="">انتخاب کنید</option>
              <option value="سرد">سرد</option>
              <option value="گرم">گرم</option>
            </select>
          </div>
          <div>
            <label>🔢 کد</label>
            <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="مثال: 1" style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label>📍 نام خط *</label>
            <div style={{ position: 'relative' }}>
              <input type="text" value={form.line_name} onChange={e => handleLineSearch(e.target.value)} placeholder="جستجو یا انتخاب نام خط..." required style={inputStyle} />
              {filteredLines.length > 0 && (
                <div style={suggestionsStyle}>
                  {filteredLines.slice(0, 10).map((line, i) => (
                    <div key={i} className="suggestion-item" onClick={() => selectLine(line)}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label>⚡ سطح ولتاژ *</label>
            <select value={form.voltage_level} onChange={e => setForm({...form, voltage_level: e.target.value})} required style={inputStyle}>
              <option value="">انتخاب کنید</option>
              <option value="63">63 کیلوولت</option>
              <option value="110">110 کیلوولت</option>
              <option value="132">132 کیلوولت</option>
              <option value="230">230 کیلوولت</option>
              <option value="400">400 کیلوولت</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label>📄 شرح انجام کار *</label>
            <div style={{ position: 'relative' }}>
              <textarea value={form.work_description} onChange={e => handleDescSearch(e.target.value)} placeholder="جستجو یا انتخاب شرح کار..." required style={{ ...inputStyle, minHeight: '80px' }} />
              {filteredDescs.length > 0 && (
                <div style={suggestionsStyle}>
                  {filteredDescs.slice(0, 10).map((desc, i) => (
                    <div key={i} className="suggestion-item" onClick={() => selectDesc(desc)}>{desc}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label>🏗️ شماره دکل *</label>
            <input type="text" value={form.tower_number} onChange={e => setForm({...form, tower_number: e.target.value})} required style={inputStyle} />
          </div>
          <div>
            <label>🗻 موقعیت *</label>
            <select value={form.location} onChange={e => setForm({...form, location: e.target.value})} required style={inputStyle}>
              <option value="">انتخاب کنید</option>
              <option value="کوهستان">کوهستان</option>
              <option value="دشت">دشت</option>
              <option value="شهری">شهری</option>
            </select>
          </div>
          <div>
            <label>📅 تاریخ انجام *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={dateYear} onChange={e => setDateYear(e.target.value)} style={inputStyle}>
                <option value="">سال</option>
                {Array.from({length:11}, (_,i) => i+1400).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={dateMonth} onChange={e => setDateMonth(e.target.value)} style={inputStyle}>
                <option value="">ماه</option>
                {PERSIAN_MONTHS.map((m,i) => <option key={i+1} value={i+1}>{i+1}-{m}</option>)}
              </select>
              <select value={dateDay} onChange={e => setDateDay(e.target.value)} style={inputStyle}>
                <option value="">روز</option>
                {Array.from({length:31}, (_,i) => i+1).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label>📅 تاریخ ثبت گزارش</label>
            <input type="text" value={pmDateText} onChange={e => setPmDateText(e.target.value)} placeholder="YYYY/MM/DD" style={inputStyle} />
          </div>
          <div>
            <label>👥 تعداد اکیپ</label>
            <select value={form.team_count} onChange={e => setForm({...form, team_count: e.target.value})} style={inputStyle}>
              <option value="">انتخاب</option>
              {[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>
          <div>
            <label>👨 تعداد نفرات</label>
            <select value={form.personnel_count} onChange={e => setForm({...form, personnel_count: e.target.value})} style={inputStyle}>
              <option value="">انتخاب</option>
              {[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>
          <div>
            <label>👔 نام سرپرست</label>
            <select value={form.supervisor} onChange={e => setForm({...form, supervisor: e.target.value})} style={inputStyle}>
              <option value="">انتخاب کنید</option>
              {supervisorOptions.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>📏 واحد</label>
            <input type="text" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="مثلاً کیلوگرم" style={inputStyle} />
          </div>
          <div>
            <label>📊 مقدار</label>
            <input type="number" step="0.1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} style={inputStyle} />
          </div>
        </div>

        {/* ----- بخش برنامه‌های باز (اصلاح‌شده) ----- */}
        {form.line_name && (
          <div style={{ marginTop: '25px' }}>
            {plansLoading ? (
              <p style={{ color: 'var(--text-secondary)' }}>⏳ در حال بارگذاری برنامه‌ها...</p>
            ) : openPlans.length > 0 ? (
              <div className="glass-card" style={{ padding: '15px', background: 'rgba(30,41,59,0.9)' }}>
                <h4 style={{ color: '#8b5cf6', marginBottom: '12px' }}>📅 برنامه‌های باز این خط</h4>
                {openPlans.map((plan, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#e2e8f0' }}>{plan.type}</strong>
                        <span style={{ color: '#94a3b8', marginLeft: 10 }}>{plan.description}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-glow"
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        onClick={() => {
                          // جمع‌آوری شماره دکل‌های تیک‌خورده
                          const selectedTowerIds = Object.values(selectedTowerIdsByPlan).flat();
                          const numbers = selectedTowerIds
                            .map(tid => allTowers.find(t => t.id === tid)?.number)
                            .filter(Boolean)
                            .join('-');
                          setForm(prev => ({
                            ...prev,
                            work_description: `${plan.type} - ${plan.description}`,
                            tower_number: numbers || prev.tower_number,
                          }));
                        }}
                      >
                        📋 انتخاب برنامه
                      </button>
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      {plan.towers.map(tower => (
                        <label key={tower.tower_id} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="checkbox"
                            checked={(selectedTowerIdsByPlan[tower.plan_id] || []).includes(tower.tower_id)}
                            onChange={(e) => {
                              setSelectedTowerIdsByPlan(prev => {
                                const current = prev[tower.plan_id] || [];
                                if (e.target.checked) {
                                  return { ...prev, [tower.plan_id]: [...current, tower.tower_id] };
                                } else {
                                  return { ...prev, [tower.plan_id]: current.filter(id => id !== tower.tower_id) };
                                }
                              });
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>🗼 {tower.number}</span>
                        </label>
                      ))}
                      <button
                        type="button"
                        className="btn-glow"
                        style={{ padding: '2px 8px', fontSize: '0.7rem', background: '#475569' }}
                        onClick={() => {
                          setSelectedTowerIdsByPlan(prev => {
                            const newState = { ...prev };
                            plan.towers.forEach(tower => {
                              newState[tower.plan_id] = [tower.tower_id];
                            });
                            return newState;
                          });
                        }}
                      >
                        انتخاب همه
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ℹ️ هیچ برنامه‌ی باز برای این خط وجود ندارد.</p>
            )}
          </div>
        )}

        <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn-glow">✅ ثبت رکورد و تکمیل برنامه‌ها</button>
          <button type="button" className="btn-glow"
            style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)' }}
            onClick={() => {
              setForm({ program_type: '', code: '', line_name: '', voltage_level: '', work_description: '', tower_number: '', location: '', team_count: '', personnel_count: '', supervisor: '', quantity: '', unit: '' });
              setOpenPlans([]);
              setSelectedTowerIdsByPlan({});
              setMessage(null);
            }}>
            🗑️ پاک کردن فرم
          </button>
        </div>
      </form>

      <style>{`
        .suggestion-item {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .suggestion-item:hover {
          background-color: var(--accent-cyan);
          color: black;
        }
        .message.success {
          background: rgba(34,197,94,0.15);
          border: 1px solid #22c55e;
          color: #bbf7d0;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .message.error {
          background: rgba(248,113,113,0.12);
          border: 1px solid #f97373;
          color: #fecaca;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

export default AddRecordPanel;
