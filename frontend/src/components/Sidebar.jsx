import React, { useState, useEffect } from 'react';

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

  // وقتی sidebar باز/بسته می‌شه کلاس sidebar-open روی app-root تغییر کنه
  // تا main content شیفت بخوره و sidebar روش overlap نکنه
  useEffect(() => {
    const root = document.querySelector('.app-root');
    if (!root) return;
    if (!collapsed) {
      root.classList.add('sidebar-open');
    } else {
      root.classList.remove('sidebar-open');
    }
    return () => {
      // cleanup هنگام unmount
      root.classList.remove('sidebar-open');
    };
  }, [collapsed]);

  const handleClose = () => setCollapsed(true);
  const handleToggle = () => setCollapsed(prev => !prev);
  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    // در موبایل بعد از انتخاب تب، sidebar بسته شود
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  return (
    <>
      {/* دکمه باز/بستن */}
      <button
        className="sb-toggle"
        onClick={handleToggle}
        aria-label={collapsed ? 'باز کردن منو' : 'بستن منو'}
        title={collapsed ? 'باز کردن منو' : 'بستن منو'}
      >
        {collapsed ? '☰' : '✕'}
      </button>

      {/* پنل sidebar */}
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
              onClick={() => handleTabChange(tab.id)}
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

      {/* Overlay — برای بستن sidebar با کلیک بیرون */}
      {!collapsed && (
        <div
          className="sb-overlay"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* آیکون‌های شناور — فقط وقتی sidebar بسته است */}
      {collapsed && (
        <div className="sb-float-btns">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sb-float-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
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
