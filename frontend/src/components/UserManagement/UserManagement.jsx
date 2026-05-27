import React, { useState, useEffect } from 'react';
import { getUsers, createUserAdmin, updateUserAdmin, deleteUserAdmin } from '../../api';

const PERMISSION_OPTIONS = [
  { key: 'dashboard', label: 'داشبورد' },
  { key: 'data', label: 'داده‌ها' },
  { key: 'add', label: 'ورود اطلاعات' },
  { key: 'analytics', label: 'تحلیل' },
  { key: 'report', label: 'گزارش' },
  { key: 'towers', label: 'مدیریت خطوط' },
  { key: 'users', label: 'مدیریت کاربران' },
];

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'user', permissions: 'dashboard,data' });

  const loadUsers = async () => {
    const res = await getUsers();
    setUsers(res.data);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSave = async () => {
    if (!form.username) return alert('نام کاربری الزامی است');
    try {
      if (editingUser) {
        await updateUserAdmin(editingUser.id, form);
      } else {
        if (!form.password) return alert('رمز عبور الزامی است');
        await createUserAdmin(form);
      }
      setShowModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      alert('خطا');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('حذف شود؟')) {
      await deleteUserAdmin(id);
      loadUsers();
    }
  };

  const togglePerm = (key) => {
    setForm(prev => {
      const perms = prev.permissions.split(',').filter(Boolean);
      if (perms.includes(key)) return { ...prev, permissions: perms.filter(p => p !== key).join(',') };
      else return { ...prev, permissions: [...perms, key].join(',') };
    });
  };

  return (
    <div className="glass-card" style={{ padding: 25 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ color: 'var(--accent-cyan)' }}>👥 مدیریت کاربران</h3>
        <button className="btn-glow" onClick={() => { setEditingUser(null); setForm({ username: '', password: '', role: 'user', permissions: 'dashboard,data' }); setShowModal(true); }}>
          ➕ افزودن کاربر
        </button>
      </div>

      <table className="space-table" style={{ width: '100%' }}>
        <thead><tr><th>نام کاربری</th><th>نقش</th><th>دسترسی‌ها</th><th>عملیات</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td style={{ fontSize: '0.8rem' }}>{u.permissions}</td>
              <td>
                <button className="btn-glow" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => { setEditingUser(u); setForm({ username: u.username, password: '', role: u.role, permissions: u.permissions }); setShowModal(true); }}>✏️</button>
                <button className="btn-glow" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#ef4444', marginLeft: 5 }} onClick={() => handleDelete(u.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div className="glass-card" style={modalStyle} onClick={e => e.stopPropagation()}>
            <h4>{editingUser ? 'ویرایش کاربر' : 'افزودن کاربر'}</h4>
            <input placeholder="نام کاربری" value={form.username} onChange={e => setForm({...form, username: e.target.value})} style={inputStyle} />
            <input placeholder="رمز عبور" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={inputStyle} />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={inputStyle}>
              <option value="user">کاربر</option>
              <option value="manager">مدیر</option>
              <option value="admin">ادمین</option>
            </select>
            <h5 style={{ color: 'var(--text-secondary)', margin: '10px 0' }}>دسترسی‌ها</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PERMISSION_OPTIONS.map(p => (
                <label key={p.key} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="checkbox" checked={form.permissions.split(',').includes(p.key)} onChange={() => togglePerm(p.key)} />
                  <span style={{ color: '#e2e8f0', fontSize: 13 }}>{p.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button className="btn-glow" onClick={handleSave}>ذخیره</button>
              <button className="btn-glow" style={{ background: '#475569' }} onClick={() => setShowModal(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
const modalStyle = { padding: 25, width: '90%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto' };
const inputStyle = { width: '100%', padding: '10px 12px', background: 'rgba(10,15,25,0.8)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '8px', color: '#e0f0ff', fontSize: '0.9rem', outline: 'none', marginBottom: 10 };

export default UserManagement;