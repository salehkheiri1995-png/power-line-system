import React, { useState } from 'react';

const ALL_TABS = [
  { id: 'dashboard', label: 'داشبورد',         icon: '📊' },
  { id: 'data',      label: 'کاوش داده‌ها',     icon: '📋' },
  { id: 'add',       label: 'ورود اطلاعات',     icon: '➕' },
  { id: 'analytics', label: 'تحلیل',            icon: '📈' },
  { id: 'report',    label: 'گزارش',             icon: '📄' },
  { id: 'towers',    label: 'مدیریت خطوط',      icon: '🗼' },
  { id: 'users',     label: 'مدیریت کاربران',   icon: '👥' },
];

function Sidebar({ activeTab, onTabChange, role, onLogout }) {
  const [collapsed, setCollapsed] = useState(true);

  const permissions = role === 'admin'
    ? 'dashboard,data,add,analytics,report,towers,users'
    : (localStorage.getItem('permissions') || 'dashboard,data');
  const allowedPermissions = permissions.split(',');
  const tabs = ALL_TABS.filter(tab => allowedPermissions.includes(tab.id));

  return (
    <>
      {/* data-open attribute برای مدیریت موقعیت toggle از طریق CSS */}
      <button
        className="sb-toggle"
        data-open={String(!collapsed)}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'باز کردن منو' : 'بستن منو'}
        title={collapsed ? 'باز کردن منو' : 'بستن منو'}
      >
        {collapsed ? '☰' : '✕'}
      </button>

      <aside className={`sb-panel${collapsed ? ' closed' : ''}`} aria-label="منوی اصلی">
        <div className="sb-logo-section">
          <h2 className="sb-logo-title">⚡ سامانه برق</h2>
          <div className="sb-logo-sub">Power Line System</div>
        </div>

        <nav className="sb-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sb-nav-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
            >
              <span className="sb-icon">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && <span className="sb-active-bar" />}
            </button>
          ))}
        </nav>

        <div className="sb-footer">
          <div className="sb-user-info">
            <div className={`sb-avatar ${role === 'admin' ? 'role-badge-admin' : 'role-badge-user'}`}>
              {role === 'admin' ? '👑' : '👤'}
            </div>
            <div>
              <div className="sb-role-name">
                {role === 'admin' ? 'مدیر سیستم' : 'کاربر'}
              </div>
              <div className="sb-welcome">خوش آمدید</div>
            </div>
          </div>
          <button className="sb-logout-btn" onClick={onLogout}>
            <span>🚪</span>
            خروج از حساب
          </button>
        </div>
      </aside>

      {collapsed && (
        <div className="sb-float-btns">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sb-float-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              aria-label={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default Sidebar;
