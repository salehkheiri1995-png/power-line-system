import React, { useState, useEffect } from 'react';
import { getUsers, createUserAdmin, updateUserAdmin, deleteUserAdmin } from '../../api';

const PERMISSION_OPTIONS = [
  { key: 'dashboard', label: 'داشبورد' },
  { key: 'data',      label: 'داده‌ها' },
  { key: 'add',       label: 'ورود اطلاعات' },
  { key: 'analytics', label: 'تحلیل' },
  { key: 'report',    label: 'گزارش' },
  { key: 'towers',    label: 'مدیریت خطوط' },
  { key: 'users',     label: 'مدیریت کاربران' },
];

function UserManagement() {
  const [users, setUsers]           = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'user',
    permissions: 'dashboard,data'
  });

  const loadUsers = async () => {
    const res = await getUsers();
    setUsers(res.data);
  };

  useEffect(() => { loadUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', role: 'user', permissions: 'dashboard,data' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ username: u.username, password: '', role: u.role, permissions: u.permissions });
    setShowModal(true);
  };

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
    } catch {
      alert('خطا در ذخیره‌سازی');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('این کاربر حذف شود؟')) {
      await deleteUserAdmin(id);
      loadUsers();
    }
  };

  const togglePerm = (key) => {
    setForm(prev => {
      const perms = prev.permissions.split(',').filter(Boolean);
      if (perms.includes(key)) return { ...prev, permissions: perms.filter(p => p !== key).join(',') };
      return { ...prev, permissions: [...perms, key].join(',') };
    });
  };

  return (
    <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
      <div className="user-mgmt-header">
        <h3 className="user-mgmt-title">👥 مدیریت کاربران</h3>
        <button className="btn-glow" onClick={openCreate}>
          ➕ افزودن کاربر
        </button>
      </div>

      <div className="user-mgmt-table-wrap">
        <table className="space-table">
          <thead>
            <tr>
              <th>نام کاربری</th>
              <th>نقش</th>
              <th>دسترسی‌ها</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td className="user-cell-perms">{u.permissions}</td>
                <td>
                  <button
                    className="btn-glow btn-sm"
                    onClick={() => openEdit(u)}
                  >✏️</button>
                  <button
                    className="btn-glow btn-sm btn-red"
                    style={{ marginRight: 'var(--space-2)' }}
                    onClick={() => handleDelete(u.id)}
                  >🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal-box modal-box-sm glass-card modal-form"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="modal-title-sm">
              {editingUser ? '✏️ ویرایش کاربر' : '➕ افزودن کاربر'}
            </h4>

            <input
              className="input-field"
              placeholder="نام کاربری"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="رمز عبور"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <select
              className="input-field"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">کاربر</option>
              <option value="manager">مدیر</option>
              <option value="admin">ادمین</option>
            </select>

            <p className="user-modal-perms-title">دسترسی‌ها</p>
            <div className="user-modal-perms-grid">
              {PERMISSION_OPTIONS.map(p => (
                <label key={p.key} className="perm-label">
                  <input
                    type="checkbox"
                    checked={form.permissions.split(',').includes(p.key)}
                    onChange={() => togglePerm(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>

            <div className="user-modal-actions">
              <button className="btn-glow" onClick={handleSave}>ذخیره</button>
              <button className="btn-glow btn-slate" onClick={() => setShowModal(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
