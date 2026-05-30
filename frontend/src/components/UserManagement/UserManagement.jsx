import React, { useState, useEffect } from 'react';
import { getUsers, createUserAdmin, updateUserAdmin, deleteUserAdmin } from '../../api';

const PERMISSION_OPTIONS = [
  { key: 'dashboard', label: '📊 داشبورد' },
  { key: 'data',      label: '📋 کاوش داده‌ها' },
  { key: 'add',       label: '➕ ورود اطلاعات' },
  { key: 'analytics', label: '📈 تحلیل' },
  { key: 'report',    label: '📄 گزارش' },
  { key: 'towers',    label: '🗼 مدیریت خطوط' },
  { key: 'users',     label: '👥 مدیریت کاربران' },
];

const ROLE_MAP = { admin: '👑 ادمین', manager: '🔑 مدیر', user: '👤 کاربر' };
const ROLE_COLOR = { admin: '#f59e0b', manager: '#818cf8', user: '#38bdf8' };

function UserManagement() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id of user to delete
  const [toast, setToast]             = useState(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'user',
    permissions: 'dashboard,data',
    is_active: true,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      showToast('خطا در بارگذاری کاربران', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', role: 'user', permissions: 'dashboard,data', is_active: true });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ username: u.username, password: '', role: u.role, permissions: u.permissions || '', is_active: u.is_active });
    setShowModal(true);
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
        showToast('کاربر با موفقیت ویرایش شد');
      } else {
        await createUserAdmin({
          username: form.username,
          password: form.password,
          role: form.role,
          permissions: form.permissions,
        });
        showToast('کاربر جدید ساخته شد');
      }
      setShowModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      const detail = err?.response?.data?.detail || 'خطا در ذخیره‌سازی';
      showToast(detail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => setDeleteConfirm(id);

  const handleDelete = async () => {
    try {
      await deleteUserAdmin(deleteConfirm);
      showToast('کاربر حذف شد');
      setDeleteConfirm(null);
      loadUsers();
    } catch {
      showToast('خطا در حذف کاربر', 'error');
      setDeleteConfirm(null);
    }
  };

  const togglePerm = (key) => {
    setForm(prev => {
      const perms = prev.permissions.split(',').filter(Boolean);
      if (perms.includes(key)) return { ...prev, permissions: perms.filter(p => p !== key).join(',') };
      return { ...prev, permissions: [...perms, key].join(',') };
    });
  };

  const setAllPerms = () => setForm(prev => ({ ...prev, permissions: PERMISSION_OPTIONS.map(p => p.key).join(',') }));
  const clearAllPerms = () => setForm(prev => ({ ...prev, permissions: '' }));

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
          color: '#fff', padding: '12px 28px', borderRadius: 12,
          fontWeight: 700, fontSize: '1rem', zIndex: 9999,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          animation: 'fadeIn .2s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '1.4rem' }}>👥 مدیریت کاربران</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.88rem' }}>
            {users.length} کاربر ثبت‌شده
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 جستجوی نام کاربری یا نقش..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'rgba(10,15,25,0.8)', border: '1px solid rgba(0,240,255,0.3)',
              borderRadius: 8, color: '#e0f0ff', padding: '8px 14px',
              fontSize: '0.88rem', outline: 'none', width: 240,
            }}
          />
          <button className="btn-glow" onClick={openCreate} style={{ padding: '8px 20px' }}>
            ➕ کاربر جدید
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[{label:'همه کاربران', val: users.length, color:'#38bdf8'},
          {label:'ادمین‌ها', val: users.filter(u=>u.role==='admin').length, color:'#f59e0b'},
          {label:'مدیران', val: users.filter(u=>u.role==='manager').length, color:'#818cf8'},
          {label:'کاربران عادی', val: users.filter(u=>u.role==='user').length, color:'#34d399'},
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '14px 18px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>⏳ در حال بارگذاری...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👤</div>
            {searchTerm ? 'کاربری با این مشخصات یافت نشد' : 'هنوز کاربری ثبت نشده'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
              <thead>
                <tr style={{ background: 'rgba(0,240,255,0.07)', borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
                  {['#','نام کاربری','نقش','دسترسی‌ها','وضعیت','عملیات'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', color: '#7dd3fc', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(0,240,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.82rem' }}>{idx+1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#e2e8f0' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `${ROLE_COLOR[u.role] || '#38bdf8'}22`,
                          border: `2px solid ${ROLE_COLOR[u.role] || '#38bdf8'}55`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', flexShrink: 0
                        }}>
                          {u.role === 'admin' ? '👑' : u.role === 'manager' ? '🔑' : '👤'}
                        </span>
                        {u.username}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: `${ROLE_COLOR[u.role] || '#38bdf8'}22`,
                        color: ROLE_COLOR[u.role] || '#38bdf8',
                        border: `1px solid ${ROLE_COLOR[u.role] || '#38bdf8'}44`,
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600
                      }}>
                        {ROLE_MAP[u.role] || u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(u.permissions || '').split(',').filter(Boolean).map(p => {
                          const opt = PERMISSION_OPTIONS.find(o => o.key === p);
                          return (
                            <span key={p} style={{
                              background: 'rgba(56,189,248,0.12)', color: '#7dd3fc',
                              border: '1px solid rgba(56,189,248,0.25)',
                              padding: '2px 8px', borderRadius: 12, fontSize: '0.73rem'
                            }}>
                              {opt ? opt.label : p}
                            </span>
                          );
                        })}
                        {!(u.permissions || '') && <span style={{ color: '#475569', fontSize: '0.8rem' }}>بدون دسترسی</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: u.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.12)',
                        color: u.is_active ? '#34d399' : '#f87171',
                        border: `1px solid ${u.is_active ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.25)'}`,
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600
                      }}>
                        {u.is_active ? '✅ فعال' : '⛔ غیرفعال'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-glow btn-sm"
                          style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                          onClick={() => openEdit(u)}
                          title="ویرایش"
                        >✏️ ویرایش</button>
                        <button
                          className="btn-glow btn-sm"
                          style={{ padding: '5px 12px', fontSize: '0.8rem', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}
                          onClick={() => confirmDelete(u.id)}
                          title="حذف"
                        >🗑️ حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ساخت / ویرایش */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: 500, padding: 28, direction: 'rtl', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--accent-cyan)', margin: 0 }}>
                {editingUser ? '✏️ ویرایش کاربر' : '➕ افزودن کاربر جدید'}
              </h3>
              <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.3rem', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* نام کاربری */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.83rem', marginBottom: 5 }}>👤 نام کاربری *</label>
              <input
                placeholder="نام کاربری را وارد کنید"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={inputSt}
              />
            </div>

            {/* رمز عبور */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.83rem', marginBottom: 5 }}>
                🔒 رمز عبور {editingUser && <span style={{ color: '#64748b' }}>(خالی = بدون تغییر)</span>}
                {!editingUser && ' *'}
              </label>
              <input
                placeholder={editingUser ? 'برای تغییر رمز وارد کنید...' : 'رمز عبور جدید'}
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={inputSt}
              />
            </div>

            {/* نقش */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.83rem', marginBottom: 5 }}>🎭 نقش کاربر</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{v:'user',l:'👤 کاربر'},{v:'manager',l:'🔑 مدیر'},{v:'admin',l:'👑 ادمین'}].map(r => (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.v })}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                      border: form.role === r.v ? `2px solid ${ROLE_COLOR[r.v]}` : '1px solid rgba(255,255,255,0.1)',
                      background: form.role === r.v ? `${ROLE_COLOR[r.v]}22` : 'rgba(15,25,40,0.8)',
                      color: form.role === r.v ? ROLE_COLOR[r.v] : '#94a3b8',
                      fontWeight: form.role === r.v ? 700 : 400,
                      fontSize: '0.83rem', transition: 'all .15s'
                    }}
                  >{r.l}</button>
                ))}
              </div>
            </div>

            {/* دسترسی‌ها */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.83rem' }}>🔐 دسترسی‌ها</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" style={miniBtn} onClick={setAllPerms}>انتخاب همه</button>
                  <button type="button" style={{...miniBtn, color:'#f87171', borderColor:'rgba(239,68,68,0.3)'}} onClick={clearAllPerms}>پاک کردن</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PERMISSION_OPTIONS.map(p => {
                  const active = form.permissions.split(',').includes(p.key);
                  return (
                    <label
                      key={p.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        padding: '8px 12px', borderRadius: 8,
                        background: active ? 'rgba(56,189,248,0.12)' : 'rgba(15,25,40,0.6)',
                        border: active ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.06)',
                        transition: 'all .15s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => togglePerm(p.key)}
                        style={{ accentColor: '#38bdf8', width: 15, height: 15 }}
                      />
                      <span style={{ fontSize: '0.82rem', color: active ? '#7dd3fc' : '#64748b' }}>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* دکمه‌ها */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-glow"
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem' }}
              >
                {saving ? '⏳ در حال ذخیره...' : (editingUser ? '💾 ذخیره تغییرات' : '✅ ساخت کاربر')}
              </button>
              <button
                className="btn-glow"
                onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal تایید حذف */}
      {deleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="glass-card"
            style={{ padding: 28, maxWidth: 360, width: '90%', textAlign: 'center', direction: 'rtl' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h4 style={{ color: '#fbbf24', marginBottom: 8 }}>حذف کاربر</h4>
            <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: '0.9rem' }}>
              آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟ این عمل برگشت‌پذیر نیست.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn-glow"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171', padding: '8px 24px' }}
                onClick={handleDelete}
              >🗑️ بله، حذف کن</button>
              <button
                className="btn-glow"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', padding: '8px 24px' }}
                onClick={() => setDeleteConfirm(null)}
              >انصراف</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const inputSt = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(10,15,25,0.8)',
  border: '1px solid rgba(0,240,255,0.3)',
  borderRadius: 8, color: '#e0f0ff',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
};

const miniBtn = {
  background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
  color: '#38bdf8', padding: '3px 10px', borderRadius: 6,
  fontSize: '0.75rem', cursor: 'pointer',
};

export default UserManagement;
