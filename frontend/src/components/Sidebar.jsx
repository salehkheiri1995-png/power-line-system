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
      <style>{`
        .sb-toggle {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 200;
          background: rgba(10, 15, 25, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-hover);
          border-radius: var(--radius-md);
          color: var(--accent-cyan);
          font-size: 1.25rem;
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-cyan);
        }
        .sb-toggle:hover {
          box-shadow: var(--shadow-cyan-strong);
          border-color: var(--accent-cyan);
        }
        .sb-panel {
          width: 260px;
          height: 100vh;
          position: fixed;
          top: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          z-index: 150;
          background: linear-gradient(180deg, rgba(8,12,24,0.94) 0%, rgba(12,16,30,0.9) 100%);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-left: 1px solid var(--border-cyan);
          box-shadow: -4px 0 40px rgba(0, 240, 255, 0.08);
          transition: transform var(--transition-smooth), opacity var(--transition-smooth);
        }
        .sb-panel.closed {
          transform: translateX(100%);
          opacity: 0;
          pointer-events: none;
        }
        .sb-logo-section {
          padding: 80px var(--space-5) var(--space-5);
          border-bottom: 1px solid var(--border-default);
          text-align: center;
        }
        .sb-logo-title {
          font-size: var(--text-xl);
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.5px;
          margin: 0;
        }
        .sb-logo-sub {
          color: var(--text-secondary);
          font-size: var(--text-xs);
          margin-top: var(--space-1);
          letter-spacing: 0.5px;
        }
        .sb-nav {
          flex: 1;
          padding: var(--space-3) 0;
          overflow-y: auto;
        }
        .sb-nav-btn {
          display: flex;
          align-items: center;
          width: calc(100% - var(--space-5));
          padding: 13px var(--space-5);
          margin: 2px var(--space-3) 2px auto;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: rgba(224, 240, 255, 0.65);
          cursor: pointer;
          transition: all var(--transition-base);
          text-align: right;
          font-size: var(--text-sm);
          font-weight: 400;
          font-family: inherit;
          white-space: nowrap;
          position: relative;
          gap: var(--space-3);
        }
        .sb-nav-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .sb-nav-btn.active {
          background: var(--bg-active);
          color: var(--accent-cyan);
          font-weight: 600;
        }
        .sb-nav-btn.active .sb-icon {
          filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.5));
        }
        .sb-active-bar {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--accent-cyan);
          border-radius: var(--radius-xs);
          box-shadow: 0 0 8px var(--accent-cyan);
        }
        .sb-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .sb-footer {
          padding: var(--space-5);
          border-top: 1px solid var(--border-default);
        }
        .sb-user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
          padding: var(--space-2) var(--space-3);
          background: rgba(0, 240, 255, 0.05);
          border-radius: var(--radius-md);
        }
        .sb-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .sb-role-name {
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: 500;
        }
        .sb-welcome {
          color: var(--text-secondary);
          font-size: var(--text-xs);
        }
        .sb-logout-btn {
          width: 100%;
          padding: 10px;
          background: rgba(255, 77, 77, 0.08);
          border: 1px solid rgba(255, 77, 77, 0.25);
          color: var(--accent-red);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-sm);
          font-weight: 500;
          font-family: inherit;
          transition: all var(--transition-base);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }
        .sb-logout-btn:hover {
          background: rgba(255, 77, 77, 0.18);
          border-color: var(--accent-red);
          box-shadow: 0 0 12px rgba(255, 77, 77, 0.25);
        }
        /* دکمه‌های شناور وقتی sidebar بسته است */
        .sb-float-btns {
          position: fixed;
          right: 20px;
          top: 82px;
          z-index: 140;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .sb-float-btn {
          width: 46px;
          height: 46px;
          border-radius: var(--radius-md);
          background: rgba(10, 15, 25, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-cyan);
          color: rgba(224, 240, 255, 0.65);
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-sm);
        }
        .sb-float-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          box-shadow: var(--shadow-cyan);
        }
        .sb-float-btn.active {
          background: rgba(0, 240, 255, 0.18);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          box-shadow: var(--shadow-cyan);
        }
      `}</style>

      {/* دکمه باز/بستن منو */}
      <button
        className="sb-toggle"
        style={{ right: collapsed ? '18px' : '270px' }}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'باز کردن منو' : 'بستن منو'}
        title={collapsed ? 'باز کردن منو' : 'بستن منو'}
      >
        {collapsed ? '☰' : '✕'}
      </button>

      {/* نوار کناری */}
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

      {/* آیکون‌های شناور وقتی sidebar بسته است */}
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
