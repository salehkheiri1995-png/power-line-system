import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, createUserAdmin, updateUserAdmin, deleteUserAdmin } from '../../api';

const PERMISSION_OPTIONS = [
  { key: 'dashboard', label: '📊 داشبورد',       desc: 'مشاهده داشبورد اصلی' },
  { key: 'data',      label: '📋 کاوش داده',      desc: 'جستجو و فیلتر رکوردها' },
  { key: 'add',       label: '➕ ورود اطلاعات',   desc: 'ثبت رکورد جدید' },
  { key: 'analytics', label: '📈 تحلیل',          desc: 'نمودارها و گزارش آماری' },
  { key: 'report',    label: '📄 گزارش',          desc: 'خروجی و چاپ گزارش' },
  { key: 'towers',    label: '🗼 مدیریت خطوط',    desc: 'دکل‌ها و برنامه‌ریزی' },
  { key: 'users',     label: '👥 مدیریت کاربران', desc: 'افزودن و ویرایش کاربر' },
];

const ROLE_META = {
  admin:   { label: '👑 ادمین',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)'  },
  manager: { label: '🔑 مدیر',   color: '#818cf8', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.4)' },
  user:    { label: '👤 کاربر',  color: '#38bdf8', bg: 'rgba(56,189,248,0.15)',  border: 'rgba(56,189,248,0.4)'  },
};

const PRESET_PERMISSIONS = {
  admin:   PERMISSION_OPTIONS.map(p => p.key).join(','),
  manager: 'dashboard,data,add,analytics,report,towers',
  user:    'dashboard,data,add',
  viewer:  'dashboard,data',
  none:    '',
};

const inputSt = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(5,12,22,0.9)',
  border: '1px solid rgba(0,240,255,0.25)',
  borderRadius: 8, color: '#e0f0ff',
  fontSize: '0.9rem', outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .2s',
};

const miniBtn = {
  background: 'rgba(56,189,248,0.1)',
  border: '1px solid rgba(56,189,248,0.25)',
  color: '#38bdf8', padding: '3px 10px',
  borderRadius: 6, fontSize: '0.74rem', cursor: 'pointer',
};

function Badge({ children, color, bg, border }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border}`,
      padding: '2px 10px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Toast({ msg, type }) {
  const colors = { success: '#10b981', error: '#ef4444', info: '#38bdf8', warn: '#f59e0b' };
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      background: colors[type] || colors.info,
      color: '#fff', padding: '11px 28px', borderRadius: 12,
      fontWeight: 700, fontSize: '0.95rem', zIndex: 9999,
      boxShadow: '0 4px 28px rgba(0,0,0,0.5)',
      animation: 'slideDown .25s ease', direction: 'rtl',
    }}>
      {msg}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [form, setForm] = useState({
    username: '', password: '', role: 'user', permissions: 'dashboard,data,add',
  });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { const r = await getUsers(); setUsers(r.data); }
    catch { showToast('خطا در بارگذاری کاربران', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ---- modal helpers ----
  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', role: 'user', permissions: 'dashboard,data,add' });
    setShowModal(true);
  };
  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ username: u.username, password: '', role: u.role, permissions: u.permissions || '' });
    setShowModal(true);
  };

  // ---- quick inline toggle role ----
  const quickToggleRole = async (u, newRole) => {
    try {
      await updateUserAdmin(u.id, { role: newRole });
      showToast(`نقش ${u.username} به «${ROLE_META[newRole]?.label}» تغییر یافت`);
      loadUsers();
    } catch { showToast('خطا در تغییر نقش', 'error'); }
  };

  // ---- quick inline perm toggle (single) ----
  const quickTogglePerm = async (u, permKey) => {
    const perms = (u.permissions || '').split(',').filter(Boolean);
    const newPerms = perms.includes(permKey)
      ? perms.filter(p => p !== permKey)
      : [...perms, permKey];
    try {
      await updateUserAdmin(u.id, { permissions: newPerms.join(',') });
      showToast('دسترسی بروزرسانی شد');
      loadUsers();
    } catch { showToast('خطا در تغییر دسترسی', 'error'); }
  };

  const handleSave = async () => {
    if (!form.username.trim()) return showToast('نام کاربری الزامی است', 'error');
    if (!editingUser && !form.password.trim()) return showToast('رمز عبور الزامی است', 'error');
    setSaving(true);
    try {
      if (editingUser) {
        const payload = { username: form.username, role: form.role, permissions: form.permissions };
        if (form.password.trim()) payload.password = form.password;
        await updateUserAdmin(editingUser.id, payload);
        showToast('کاربر با موفقیت ویرایش شد ✅');
      } else {
        await createUserAdmin({ username: form.username, password: form.password, role: form.role, permissions: form.permissions });
        showToast('کاربر جدید ساخته شد 🎉');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      showToast(err?.response?.data?.detail || 'خطا در ذخیره‌سازی', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteUserAdmin(deleteConfirm);
      showToast('کاربر حذف شد 🗑️');
      setDeleteConfirm(null);
      loadUsers();
    } catch { showToast('خطا در حذف کاربر', 'error'); setDeleteConfirm(null); }
  };

  const togglePerm = (key) => {
    setForm(prev => {
      const arr = prev.permissions.split(',').filter(Boolean);
      return { ...prev, permissions: arr.includes(key) ? arr.filter(p => p !== key).join(',') : [...arr, key].join(',') };
    });
  };

  const applyPreset = (preset) => setForm(prev => ({ ...prev, permissions: PRESET_PERMISSIONS[preset] || '' }));

  // ---- filter ----
  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ---- stats ----
  const stats = [
    { label: 'همه',          val: users.length,                            color: '#38bdf8', role: 'all'     },
    { label: 'ادمین',        val: users.filter(u=>u.role==='admin').length,   color: '#f59e0b', role: 'admin'   },
    { label: 'مدیر',         val: users.filter(u=>u.role==='manager').length, color: '#818cf8', role: 'manager' },
    { label: 'کاربر عادی',  val: users.filter(u=>u.role==='user').length,    color: '#34d399', role: 'user'    },
  ];

  return (
    <div style={{ padding: '0 4px', direction: 'rtl' }}>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ===== Header ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '1.4rem' }}>👥 مدیریت کاربران</h2>
          <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: '0.84rem' }}>مدیریت نقش، دسترسی و اطلاعات کاربران سیستم</p>
        </div>
        <button className="btn-glow" onClick={openCreate} style={{ padding: '9px 22px', fontWeight: 700 }}>
          ➕ کاربر جدید
        </button>
      </div>

      {/* ===== Stats Cards (کلیک‌پذیر برای فیلتر) ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {stats.map(s => (
          <div
            key={s.role}
            className="glass-card"
            onClick={() => setFilterRole(s.role)}
            style={{
              padding: '14px 16px', cursor: 'pointer', transition: 'all .18s',
              borderTop: `3px solid ${s.color}`,
              outline: filterRole === s.role ? `2px solid ${s.color}` : '2px solid transparent',
              outlineOffset: 2,
            }}
          >
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ===== Search ===== */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 جستجوی نام کاربری..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputSt, maxWidth: 320, display: 'block' }}
        />
      </div>

      {/* ===== Table ===== */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>⏳ در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#475569' }}>
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>🔍</div>
            کاربری یافت نشد
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,240,255,0.06)', borderBottom: '1px solid rgba(0,240,255,0.12)' }}>
                  {['#', 'نام کاربری', 'نقش سریع', 'دسترسی‌های سریع', 'عملیات'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'right', color: '#7dd3fc', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const rm = ROLE_META[u.role] || ROLE_META.user;
                  const userPerms = (u.permissions || '').split(',').filter(Boolean);
                  return (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(0,240,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      {/* شماره */}
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: '0.8rem', width: 36 }}>{idx + 1}</td>

                      {/* نام کاربری */}
                      <td style={{ padding: '10px 14px', minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: rm.bg, border: `2px solid ${rm.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                          }}>
                            {u.role === 'admin' ? '👑' : u.role === 'manager' ? '🔑' : '👤'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{u.username}</div>
                            <Badge color={rm.color} bg={rm.bg} border={rm.border}>{rm.label}</Badge>
                          </div>
                        </div>
                      </td>

                      {/* تغییر نقش سریع */}
                      <td style={{ padding: '10px 14px', minWidth: 200 }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {Object.entries(ROLE_META).map(([rv, rmeta]) => (
                            <button
                              key={rv}
                              type="button"
                              title={`تغییر به ${rmeta.label}`}
                              onClick={() => u.role !== rv && quickToggleRole(u, rv)}
                              style={{
                                padding: '4px 9px', borderRadius: 7, fontSize: '0.73rem', cursor: u.role === rv ? 'default' : 'pointer',
                                background: u.role === rv ? rmeta.bg : 'rgba(15,25,35,0.7)',
                                border: u.role === rv ? `1.5px solid ${rmeta.border}` : '1px solid rgba(255,255,255,0.08)',
                                color: u.role === rv ? rmeta.color : '#475569',
                                fontWeight: u.role === rv ? 700 : 400,
                                transition: 'all .15s',
                              }}
                            >{rmeta.label}</button>
                          ))}
                        </div>
                      </td>

                      {/* تغییر دسترسی سریع */}
                      <td style={{ padding: '10px 14px', minWidth: 340 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {PERMISSION_OPTIONS.map(p => {
                            const active = userPerms.includes(p.key);
                            return (
                              <button
                                key={p.key}
                                type="button"
                                title={`${active ? 'حذف دسترسی' : 'افزودن دسترسی'}: ${p.desc}`}
                                onClick={() => quickTogglePerm(u, p.key)}
                                style={{
                                  padding: '3px 8px', borderRadius: 12, fontSize: '0.71rem', cursor: 'pointer',
                                  background: active ? 'rgba(56,189,248,0.15)' : 'rgba(15,25,35,0.6)',
                                  border: active ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                  color: active ? '#7dd3fc' : '#475569',
                                  transition: 'all .15s',
                                  opacity: active ? 1 : 0.7,
                                }}
                              >{p.label}</button>
                            );
                          })}
                        </div>
                      </td>

                      {/* عملیات */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-glow"
                            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                            onClick={() => openEdit(u)}
                          >✏️ ویرایش</button>
                          <button
                            className="btn-glow"
                            style={{ padding: '5px 12px', fontSize: '0.78rem', background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.38)', color: '#f87171' }}
                            onClick={() => setDeleteConfirm(u.id)}
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Modal ===== */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: 520, padding: '28px 28px 22px', direction: 'rtl', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(0,240,255,0.12)', paddingBottom: 14 }}>
              <h3 style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '1.15rem' }}>
                {editingUser ? `✏️ ویرایش کاربر «${editingUser.username}»` : '➕ افزودن کاربر جدید'}
              </h3>
              <button style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* نام کاربری */}
            <label style={labelSt}>👤 نام کاربری *</label>
            <input placeholder="نام کاربری" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={{ ...inputSt, marginBottom: 14 }} />

            {/* رمز */}
            <label style={labelSt}>
              🔒 رمز عبور {editingUser ? <span style={{ color: '#475569', fontWeight: 400 }}>(خالی = بدون تغییر)</span> : '*'}
            </label>
            <input
              type="password" placeholder={editingUser ? 'برای تغییر وارد کنید...' : 'رمز عبور'}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ ...inputSt, marginBottom: 18 }}
            />

            {/* نقش */}
            <label style={labelSt}>🎭 نقش کاربر</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {Object.entries(ROLE_META).map(([rv, rm]) => (
                <button key={rv} type="button" onClick={() => setForm({ ...form, role: rv })}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 9, cursor: 'pointer', transition: 'all .15s',
                    border: form.role === rv ? `2px solid ${rm.border}` : '1px solid rgba(255,255,255,0.08)',
                    background: form.role === rv ? rm.bg : 'rgba(5,12,22,0.8)',
                    color: form.role === rv ? rm.color : '#475569',
                    fontWeight: form.role === rv ? 700 : 400, fontSize: '0.84rem',
                  }}
                >{rm.label}</button>
              ))}
            </div>

            {/* پیش‌تنظیم دسترسی */}
            <label style={labelSt}>🔐 دسترسی‌ها</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'flex', alignItems: 'center' }}>پیش‌تنظیم:</span>
              {[['admin','همه دسترسی‌ها'],['manager','مدیر'],['user','کاربر'],['viewer','بیننده'],['none','بدون دسترسی']].map(([k, l]) => (
                <button key={k} type="button" style={miniBtn} onClick={() => applyPreset(k)}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 22 }}>
              {PERMISSION_OPTIONS.map(p => {
                const active = form.permissions.split(',').includes(p.key);
                return (
                  <label key={p.key} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                    padding: '9px 11px', borderRadius: 8, transition: 'all .15s',
                    background: active ? 'rgba(56,189,248,0.1)' : 'rgba(5,12,22,0.6)',
                    border: active ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <input type="checkbox" checked={active} onChange={() => togglePerm(p.key)}
                      style={{ accentColor: '#38bdf8', width: 15, height: 15, marginTop: 2, flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: '0.83rem', color: active ? '#7dd3fc' : '#475569', fontWeight: active ? 600 : 400 }}>{p.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#334155', marginTop: 1 }}>{p.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* دکمه‌ها */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-glow" onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem', fontWeight: 700 }}
              >{saving ? '⏳ ذخیره...' : (editingUser ? '💾 ذخیره تغییرات' : '✅ ساخت کاربر')}</button>
              <button className="btn-glow" onClick={() => setShowModal(false)}
                style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#64748b' }}
              >انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Confirm Delete ===== */}
      {deleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="glass-card"
            style={{ padding: 28, maxWidth: 340, width: '90%', textAlign: 'center', direction: 'rtl' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>⚠️</div>
            <h4 style={{ color: '#fbbf24', marginBottom: 8, fontSize: '1.1rem' }}>تأیید حذف کاربر</h4>
            <p style={{ color: '#64748b', marginBottom: 22, fontSize: '0.88rem', lineHeight: 1.7 }}>
              این کاربر به طور دائم حذف خواهد شد.<br />این عملیات قابل بازگشت نیست.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-glow"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171', padding: '9px 22px', fontWeight: 700 }}
                onClick={handleDelete}
              >🗑️ حذف کن</button>
              <button className="btn-glow"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#64748b', padding: '9px 22px' }}
                onClick={() => setDeleteConfirm(null)}
              >انصراف</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

const labelSt = {
  display: 'block', color: '#64748b', fontSize: '0.82rem', marginBottom: 5, fontWeight: 500
};
