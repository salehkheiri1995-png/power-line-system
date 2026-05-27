import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../api';

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

function PlannedTasksTable({ plannedTasks, lines, towers, filters, onDataChanged }) {
  const mode = filters.viewMode || 'all';
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    lineSearch: '',
    lineId: '',
    towerNumbers: '',
    dateYear: '',
    dateMonth: '',
    dateDay: '',
    type: '',
    description: '',
    supervisor: '',
    crew: '1',
    personnel: '3',
    markCompleted: false,   // جدید: آیا این برنامه هم‌اکنون انجام شده؟
  });

  const [workDescriptions, setWorkDescriptions] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [descSearch, setDescSearch] = useState('');
  const [supSearch, setSupSearch] = useState('');
  const [lineSuggestions, setLineSuggestions] = useState([]);
  const [showLineDropdown, setShowLineDropdown] = useState(false);
  const lineInputRef = useRef(null);

  // دریافت گزینه‌های جستجو
  useEffect(() => {
    api.get('/filter-options').then(res => {
      setWorkDescriptions(res.data.work_descriptions || []);
      setSupervisors(res.data.supervisors || []);
    });
  }, []);

  // تنظیم تاریخ امروز هنگام باز شدن مودال
  useEffect(() => {
    if (showAddModal) {
      const now = new Date();
      const jNow = toJalali(now);
      setNewPlan(prev => ({
        ...prev,
        dateYear: jNow.year.toString(),
        dateMonth: jNow.month.toString(),
        dateDay: jNow.day.toString(),
        lineSearch: '',
        lineId: '',
        towerNumbers: '',
        type: '',
        description: '',
        supervisor: '',
        crew: '1',
        personnel: '3',
        markCompleted: false,
      }));
    }
  }, [showAddModal]);

  // فیلتر خطوط هنگام جستجو
  useEffect(() => {
    if (newPlan.lineSearch.trim()) {
      setLineSuggestions(lines.filter(l => l.name.includes(newPlan.lineSearch.trim())).slice(0, 10));
      setShowLineDropdown(true);
    } else {
      setLineSuggestions([]);
      setShowLineDropdown(false);
    }
  }, [newPlan.lineSearch, lines]);

  const selectLine = (line) => {
    setNewPlan(prev => ({ ...prev, lineId: line.id, lineSearch: line.name }));
    setShowLineDropdown(false);
  };

  // فیلتر برنامه‌ها
  const filteredTasks = useMemo(() => {
    if (mode === 'completed') return [];
    return plannedTasks.filter(p => {
      if (filters.lineName && p.line_id !== filters.lineName) return false;
      return true;
    });
  }, [plannedTasks, mode, filters.lineName]);

  // تابع کمکی برای ساخت شناسه یکتا
  const generateUniqueId = () => {
    const now = new Date();
    const ts = now.getTime();
    const rand = Math.random().toString(36).substr(2, 8);
    return `plan_${ts}_${rand}`;
  };

  // ثبت برنامه جدید
  const handleAddPlan = async () => {
    if (!newPlan.lineId || !newPlan.towerNumbers.trim()) return alert('خط و شماره دکل‌ها الزامی است');
    if (!newPlan.dateYear || !newPlan.dateMonth || !newPlan.dateDay) return alert('تاریخ را انتخاب کنید');

    const dateStr = `${newPlan.dateYear}/${String(newPlan.dateMonth).padStart(2, '0')}/${String(newPlan.dateDay).padStart(2, '0')}`;
    const gregDate = parseJalali(dateStr);
    if (!gregDate) return alert('تاریخ نامعتبر');

    const nums = newPlan.towerNumbers.split(/[-،,\s]+/).map(s => s.trim()).filter(s => s && !isNaN(parseInt(s))).map(Number);
    if (nums.length === 0) return alert('شماره دکل معتبر وارد کنید');

    try {
      for (const num of nums) {
        const towerId = `${newPlan.lineId}||${num}`;
        if (!towers.find(t => t.id === towerId)) {
          await api.post('/lines-towers/towers', { id: towerId, line_id: newPlan.lineId, number: num });
        }

        const planId = generateUniqueId();

        // اگر تیک "همین الان انجام شده" زده شده باشد
        if (newPlan.markCompleted) {
          // یکجا هم برنامه تعمیر و هم رکورد Maintenance ایجاد کن
          await api.post('/lines-towers/maintenance-records', {
            id: `rec_${planId}`,            // شناسه مشترک
            planned_task_id: planId,        // اشاره به برنامه (که وجود خارجی ندارد ولی برای یکپارچگی)
            tower_id: towerId,
            date: dateStr,
            gregorian_date: gregDate.toISOString(),
            type: newPlan.type,
            program_type: "برنامه‌ریزی",
            description: newPlan.description,
            supervisor: newPlan.supervisor,
            crew: newPlan.crew,
            personnel: newPlan.personnel,
            status: "completed"
          });
        } else {
          // فقط برنامه را ثبت کن
          await api.post('/lines-towers/planned-tasks', {
            id: planId,
            tower_id: towerId,
            line_id: newPlan.lineId,
            number: num,
            date: dateStr,
            gregorian_date: gregDate.toISOString(),
            type: newPlan.type,
            description: newPlan.description,
            supervisor: newPlan.supervisor,
            crew: newPlan.crew,
            personnel: newPlan.personnel,
            status: 'planned'
          });
        }
      }
      setShowAddModal(false);
      onDataChanged();
      alert(`✅ عملیات برای ${nums.length} دکل ثبت شد ${newPlan.markCompleted ? '(انجام شده)' : '(برنامه‌ریزی)'}`);
    } catch (err) {
      console.error(err);
      alert('خطا در ثبت برنامه');
    }
  };

  const markCompleted = async (taskId) => {
    try {
      await api.put(`/lines-towers/planned-tasks/${taskId}/complete`);
      onDataChanged();
    } catch { alert('خطا'); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('حذف شود؟')) return;
    try {
      await api.delete(`/lines-towers/planned-tasks/${taskId}`);
      onDataChanged();
    } catch { alert('خطا'); }
  };

  // توابع تاریخ
  const parseJalali = (str) => {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    return new Date(y + 621, m - 1, d);
  };

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

  const cellStyle = { padding: '6px 8px', borderBottom: '1px solid #1e293b', fontSize: 13 };
  const inputStyle = { padding: 10, background: 'rgba(10,15,25,0.8)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 8, color: '#e0f0ff', width: '100%' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1520', padding: '8px 14px', flexShrink: 0 }}>
        <h4 style={{ margin: 0, color: '#8b5cf6', fontSize: 14 }}>📅 برنامه‌ریزی شده</h4>
        <button className="btn-glow" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowAddModal(true)}>➕ افزودن</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ background: '#111b28', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={cellStyle}>شناسه</th>
              <th style={cellStyle}>دکل</th>
              <th style={cellStyle}>تاریخ</th>
              <th style={cellStyle}>شرح</th>
              <th style={cellStyle}>سرپرست</th>
              <th style={cellStyle}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(p => {
              const line = lines.find(l => l.id === p.line_id);
              return (
                <tr key={p.id}>
                  <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: 11 }}>{p.id}</td>
                  <td style={cellStyle}>{p.number} ({line?.name})</td>
                  <td style={cellStyle}>{p.date}</td>
                  <td style={cellStyle}>{p.description || p.type}</td>
                  <td style={cellStyle}>{p.supervisor}</td>
                  <td style={cellStyle}>
                    <button className="btn-glow" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => markCompleted(p.id)}>✅</button>
                    <button className="btn-glow" style={{ padding: '2px 8px', fontSize: 11, background: '#ef4444', marginLeft: 4 }} onClick={() => deleteTask(p.id)}>🗑️</button>
                  </td>
                </tr>
              );
            })}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: '#64748b' }}>
                  {mode === 'completed' ? 'حالت نمایش: فقط انجام‌شده' : 'برنامه‌ای ثبت نشده است.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* مودال افزودن برنامه جدید */}
      {showAddModal && (
        <div style={overlayStyle} onClick={() => setShowAddModal(false)}>
          <div className="glass-card" style={modalStyle} onClick={e => e.stopPropagation()}>
            <h4 style={{ color: 'var(--accent-cyan)', marginTop: 0 }}>📅 افزودن برنامه تعمیر</h4>

            <label>خط</label>
            <div style={{ position: 'relative' }} ref={lineInputRef}>
              <input
                placeholder="جستجوی خط..."
                value={newPlan.lineSearch}
                onChange={e => setNewPlan({...newPlan, lineSearch: e.target.value})}
                style={inputStyle}
              />
              {showLineDropdown && lineSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, maxHeight: 150, overflowY: 'auto', zIndex: 10 }}>
                  {lineSuggestions.map(l => (
                    <div key={l.id} style={{ padding: '8px 12px', cursor: 'pointer', color: '#e2e8f0' }} onClick={() => selectLine(l)}>
                      {l.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label>شماره دکل‌ها (با خط تیره جدا کنید)</label>
            <input placeholder="مثلاً 5-12-20" value={newPlan.towerNumbers} onChange={e => setNewPlan({...newPlan, towerNumbers: e.target.value})} style={inputStyle} />

            <label>تاریخ برنامه‌ریزی</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={newPlan.dateYear} onChange={e => setNewPlan({...newPlan, dateYear: e.target.value})} style={inputStyle}><option value="">سال</option>{Array.from({length: 11}, (_, i) => 1400 + i).map(y => <option key={y} value={y}>{y}</option>)}</select>
              <select value={newPlan.dateMonth} onChange={e => setNewPlan({...newPlan, dateMonth: e.target.value})} style={inputStyle}><option value="">ماه</option>{persianMonths.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}</select>
              <select value={newPlan.dateDay} onChange={e => setNewPlan({...newPlan, dateDay: e.target.value})} style={inputStyle}><option value="">روز</option>{Array.from({length: 31}, (_, i) => i+1).map(d => <option key={d} value={d}>{d}</option>)}</select>
            </div>

            <label>نوع تعمیر (شرح کار)</label>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="جستجو یا انتخاب..."
                value={newPlan.type}
                onChange={e => { setNewPlan({...newPlan, type: e.target.value}); setDescSearch(e.target.value); }}
                style={inputStyle}
              />
              {descSearch && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, maxHeight: 150, overflowY: 'auto', zIndex: 10 }}>
                  {workDescriptions.filter(d => d.includes(descSearch)).slice(0, 10).map((d, i) => (
                    <div key={i} style={{ padding: '6px 10px', cursor: 'pointer', color: '#e2e8f0' }} onClick={() => { setNewPlan({...newPlan, type: d}); setDescSearch(''); }}>
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label>شرح کار اضافی</label>
            <input value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} style={inputStyle} />

            <label>سرپرست</label>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="جستجو یا انتخاب سرپرست..."
                value={newPlan.supervisor}
                onChange={e => { setNewPlan({...newPlan, supervisor: e.target.value}); setSupSearch(e.target.value); }}
                style={inputStyle}
              />
              {supSearch && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, maxHeight: 150, overflowY: 'auto', zIndex: 10 }}>
                  {supervisors.filter(s => s.includes(supSearch)).slice(0, 10).map((s, i) => (
                    <div key={i} style={{ padding: '6px 10px', cursor: 'pointer', color: '#e2e8f0' }} onClick={() => { setNewPlan({...newPlan, supervisor: s}); setSupSearch(''); }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><label>تعداد اکیپ</label><input type="number" value={newPlan.crew} onChange={e => setNewPlan({...newPlan, crew: e.target.value})} style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label>تعداد نفرات</label><input type="number" value={newPlan.personnel} onChange={e => setNewPlan({...newPlan, personnel: e.target.value})} style={inputStyle} /></div>
            </div>

            {/* ---- گزینه جدید: همین الان انجام شده ---- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <input
                type="checkbox"
                id="markCompletedCheck"
                checked={newPlan.markCompleted}
                onChange={e => setNewPlan({...newPlan, markCompleted: e.target.checked})}
                style={{ width: 20, height: 20, accentColor: '#00f0ff' }}
              />
              <label htmlFor="markCompletedCheck" style={{ color: '#e0f0ff', cursor: 'pointer' }}>
                همین الان انجام شده است (نیاز به برنامه‌ریزی ندارد)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button className="btn-glow" onClick={handleAddPlan}>ذخیره</button>
              <button className="btn-glow" style={{ background: '#475569' }} onClick={() => setShowAddModal(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
};
const modalStyle = {
  padding: 25, borderRadius: 16, width: '90%', maxWidth: 550, maxHeight: '85vh', overflowY: 'auto',
  display: 'flex', flexDirection: 'column', gap: 12,
};

export default PlannedTasksTable;