import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../api';

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

function TowerBottomTables({ towers, lines, maintenanceRecords, plannedTasks, filters, onDataChanged }) {
  const mode = filters.viewMode || 'all';
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
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
    personnel: '3'
  });

  const [workDescriptions, setWorkDescriptions] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [descriptionSearch, setDescriptionSearch] = useState('');
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [lineSuggestions, setLineSuggestions] = useState([]);
  const [showLineDropdown, setShowLineDropdown] = useState(false);
  const lineInputRef = useRef(null);

  useEffect(() => {
    api.get('/filter-options').then(res => {
      setWorkDescriptions(res.data.work_descriptions || []);
      setSupervisors(res.data.supervisors || []);
    });
  }, []);

  useEffect(() => {
    if (showAddPlanModal) {
      const today = new Date();
      const jToday = toJalali(today);
      setNewPlan(prev => ({
        ...prev,
        dateYear: jToday.year.toString(),
        dateMonth: jToday.month.toString(),
        dateDay: jToday.day.toString(),
        lineSearch: '',
        lineId: '',
        towerNumbers: '',
        type: '',
        description: '',
        supervisor: '',
        crew: '1',
        personnel: '3'
      }));
    }
  }, [showAddPlanModal]);

  useEffect(() => {
    if (newPlan.lineSearch.trim()) {
      setLineSuggestions(lines.filter(l => l.name.includes(newPlan.lineSearch.trim())).slice(0, 10));
      setShowLineDropdown(true);
    } else {
      setLineSuggestions([]);
      setShowLineDropdown(false);
    }
  }, [newPlan.lineSearch, lines]);

  const handleSelectLine = (line) => {
    setNewPlan(prev => ({ ...prev, lineId: line.id, lineSearch: line.name }));
    setShowLineDropdown(false);
  };

  // ---- جداول ----
  const urgentTowers = useMemo(() => {
    if (mode === 'planned') return [];
    return towers.filter(t => {
      if (!t.next_maintenance) return false;
      const parts = t.next_maintenance.split('/');
      if (parts.length !== 3) return false;
      const [y, m, d] = parts.map(Number);
      const nextDate = new Date(y + 621, m - 1, d);
      const now = new Date();
      const diffDays = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).sort((a, b) => {
      const [ay, am, ad] = (a.next_maintenance || '').split('/').map(Number);
      const [by, bm, bd] = (b.next_maintenance || '').split('/').map(Number);
      return new Date(ay + 621, am - 1, ad) - new Date(by + 621, bm - 1, bd);
    });
  }, [towers, mode]);

  // نمایش همه برنامه‌ها (نه فقط آینده) برای شفافیت
  const filteredTasks = useMemo(() => {
    if (mode === 'completed') return [];
    return plannedTasks.filter(p => {
      if (filters.lineName && p.line_id !== filters.lineName) return false;
      return true;
    });
  }, [plannedTasks, mode, filters.lineName]);

  // ---- ثبت برنامه جدید ----
  const handleAddPlan = async () => {
    if (!newPlan.lineId) return alert('لطفاً خط را انتخاب کنید');
    if (!newPlan.towerNumbers.trim()) return alert('لطفاً شماره دکل‌ها را وارد کنید');
    if (!newPlan.dateYear || !newPlan.dateMonth || !newPlan.dateDay) return alert('لطفاً تاریخ را انتخاب کنید');

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
        await api.post('/lines-towers/planned-tasks', {
          id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
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
      setShowAddPlanModal(false);
      onDataChanged();
    } catch (err) {
      alert('خطا در ثبت برنامه');
    }
  };

  // تبدیل انجام شده
  const markAsCompleted = async (taskId) => {
    try {
      await api.put(`/lines-towers/planned-tasks/${taskId}/complete`);
      onDataChanged();
    } catch (err) {
      alert('خطا');
    }
  };

  // حذف برنامه
  const deletePlanned = async (taskId) => {
    if (window.confirm('حذف شود؟')) {
      try {
        await api.delete(`/lines-towers/planned-tasks/${taskId}`);
        onDataChanged();
      } catch (err) {
        alert('خطا');
      }
    }
  };

  // توابع تاریخ
  const parseJalali = (str) => {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    return new Date(y + 621, m - 1, d);
  };

  function toJalali(date) {
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
  }

  const cellStyle = { padding: '6px 8px', borderBottom: '1px solid #1e293b', fontSize: 13 };
  const inputStyle = { padding: 10, background: 'rgba(10,15,25,0.8)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 8, color: '#e0f0ff', width: '100%' };

  return (
    <div style={{ display: 'flex', gap: 0, height: 220, borderTop: '2px solid #334155', marginTop: 10 }}>
      {/* ---- جدول ضروری ---- */}
      <div style={{ flex: 1, borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <h4 style={{ margin: 0, padding: '8px 14px', background: '#0d1520', color: '#f59e0b', fontSize: 14, flexShrink: 0 }}>
          ⚠️ تعمیرات ضروری
        </h4>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
            <thead>
              <tr style={{ background: '#111b28', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={cellStyle}>دکل</th><th style={cellStyle}>خط</th><th style={cellStyle}>آخرین تعمیر</th><th style={cellStyle}>موعد بعدی</th>
              </tr>
            </thead>
            <tbody>
              {urgentTowers.map(t => {
                const line = lines.find(l => l.id === t.line_id);
                return (
                  <tr key={t.id}>
                    <td style={cellStyle}>{t.number}</td>
                    <td style={cellStyle}>{line?.name}</td>
                    <td style={cellStyle}>{t.last_maintenance || '-'}</td>
                    <td style={cellStyle}>{t.next_maintenance || '-'}</td>
                  </tr>
                );
              })}
              {urgentTowers.length === 0 && (
                <tr><td colSpan={4} style={{ ...cellStyle, textAlign: 'center', color: '#64748b' }}>✅ تمام دکل‌ها به‌روز هستند.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- جدول برنامه‌ریزی ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1520', padding: '8px 14px', flexShrink: 0 }}>
          <h4 style={{ margin: 0, color: '#8b5cf6', fontSize: 14 }}>📅 برنامه‌ریزی شده</h4>
          <button className="btn-glow" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowAddPlanModal(true)}>➕ افزودن</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
            <thead>
              <tr style={{ background: '#111b28', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={cellStyle}>دکل</th><th style={cellStyle}>تاریخ</th><th style={cellStyle}>شرح</th><th style={cellStyle}>سرپرست</th><th style={cellStyle}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(p => {
                const line = lines.find(l => l.id === p.line_id);
                return (
                  <tr key={p.id}>
                    <td style={cellStyle}>{p.number} ({line?.name})</td>
                    <td style={cellStyle}>{p.date}</td>
                    <td style={cellStyle}>{p.description || p.type}</td>
                    <td style={cellStyle}>{p.supervisor}</td>
                    <td style={cellStyle}>
                      <button className="btn-glow" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => markAsCompleted(p.id)}>✅</button>
                      <button className="btn-glow" style={{ padding: '2px 8px', fontSize: 11, background: '#ef4444', marginLeft: 4 }} onClick={() => deletePlanned(p.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr><td colSpan={5} style={{ ...cellStyle, textAlign: 'center', color: '#64748b' }}>برنامه‌ای ثبت نشده است.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- مودال افزودن ---- */}
      {showAddPlanModal && (
        <div style={overlayStyle} onClick={() => setShowAddPlanModal(false)}>
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
                    <div key={l.id} style={{ padding: '8px 12px', cursor: 'pointer', color: '#e2e8f0' }} onClick={() => handleSelectLine(l)}>
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
              <select value={newPlan.dateYear} onChange={e => setNewPlan({...newPlan, dateYear: e.target.value})} style={inputStyle}>
                <option value="">سال</option>
                {Array.from({length: 11}, (_, i) => 1400 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={newPlan.dateMonth} onChange={e => setNewPlan({...newPlan, dateMonth: e.target.value})} style={inputStyle}>
                <option value="">ماه</option>
                {persianMonths.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={newPlan.dateDay} onChange={e => setNewPlan({...newPlan, dateDay: e.target.value})} style={inputStyle}>
                <option value="">روز</option>
                {Array.from({length: 31}, (_, i) => i+1).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <label>نوع تعمیر (شرح کار)</label>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="جستجو یا انتخاب..."
                value={newPlan.type}
                onChange={e => { setNewPlan({...newPlan, type: e.target.value}); setDescriptionSearch(e.target.value); }}
                style={inputStyle}
              />
              {descriptionSearch && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, maxHeight: 150, overflowY: 'auto', zIndex: 10 }}>
                  {workDescriptions.filter(d => d.includes(descriptionSearch)).slice(0, 10).map((d, i) => (
                    <div key={i} style={{ padding: '6px 10px', cursor: 'pointer', color: '#e2e8f0' }} onClick={() => { setNewPlan({...newPlan, type: d}); setDescriptionSearch(''); }}>
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
                onChange={e => { setNewPlan({...newPlan, supervisor: e.target.value}); setSupervisorSearch(e.target.value); }}
                style={inputStyle}
              />
              {supervisorSearch && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, maxHeight: 150, overflowY: 'auto', zIndex: 10 }}>
                  {supervisors.filter(s => s.includes(supervisorSearch)).slice(0, 10).map((s, i) => (
                    <div key={i} style={{ padding: '6px 10px', cursor: 'pointer', color: '#e2e8f0' }} onClick={() => { setNewPlan({...newPlan, supervisor: s}); setSupervisorSearch(''); }}>
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

            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button className="btn-glow" onClick={handleAddPlan}>ذخیره</button>
              <button className="btn-glow" style={{ background: '#475569' }} onClick={() => setShowAddPlanModal(false)}>انصراف</button>
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
  padding: 25, borderRadius: 16, width: '90%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto',
  display: 'flex', flexDirection: 'column', gap: 12,
};

export default TowerBottomTables;