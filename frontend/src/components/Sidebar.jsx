import React, { useState } from 'react';

// تعریف همه تب‌های ممکن
const ALL_TABS = [
  { id: 'dashboard', label: 'داشبورد', icon: '📊' },
  { id: 'data', label: 'کاوش داده‌ها', icon: '📋' },
  { id: 'add', label: 'ورود اطلاعات', icon: '➕' },
  { id: 'analytics', label: 'تحلیل', icon: '📈' },
  { id: 'report', label: 'گزارش', icon: '📄' },
  { id: 'towers', label: 'مدیریت خطوط', icon: '🗼' },
  { id: 'users', label: 'مدیریت کاربران', icon: '👥' },
];

function Sidebar({ activeTab, onTabChange, role, onLogout }) {
  const [collapsed, setCollapsed] = useState(true);

  // دریافت دسترسی‌های کاربر از localStorage (پیش‌فرض: همه بخش‌ها برای ادمین)
const permissions = role === 'admin'
  ? 'dashboard,data,add,analytics,report,towers,users'
  : (localStorage.getItem('permissions') || 'dashboard,data');
  const allowedPermissions = permissions.split(',');

  // فیلتر تب‌ها بر اساس دسترسی
  const tabs = ALL_TABS.filter(tab => allowedPermissions.includes(tab.id));

  return (
    <>
      {/* دکمه منو */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'fixed',
          top: '20px',
          right: collapsed ? '20px' : '270px',
          zIndex: 200,
          background: 'rgba(10,15,25,0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,240,255,0.4)',
          borderRadius: '16px',
          color: '#00f0ff',
          fontSize: '22px',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: collapsed ? '0 0 20px rgba(0,240,255,0.3)' : '0 0 10px rgba(0,240,255,0.1)',
        }}
        title={collapsed ? 'باز کردن منو' : 'بستن منو'}
      >
        {collapsed ? '☰' : '✕'}
      </button>

      {/* نوار کناری */}
      <div
        style={{
          width: collapsed ? '0px' : '260px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 150,
          background: 'linear-gradient(180deg, rgba(10,15,30,0.9) 0%, rgba(15,20,35,0.85) 100%)',
          backdropFilter: 'blur(30px)',
          borderLeft: '1px solid rgba(0,240,255,0.15)',
          boxShadow: collapsed ? 'none' : '0 0 40px rgba(0,240,255,0.1)',
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          opacity: collapsed ? 0 : 1,
          visibility: collapsed ? 'hidden' : 'visible',
        }}
      >
        {/* لوگو */}
        <div style={{ 
          padding: '30px 20px 20px', 
          borderBottom: '1px solid rgba(0,240,255,0.15)',
          marginTop: '60px',
          textAlign: 'center'
        }}>
          <h2 style={{
            color: 'var(--accent-cyan)',
            fontSize: '22px',
            fontWeight: '700',
            margin: 0,
            letterSpacing: '1px',
            background: 'linear-gradient(135deg, #00f0ff 0%, #b366ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(0,240,255,0.3)',
          }}>
            ⚡ کهکشان برق
          </h2>
          <div style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '11px', 
            marginTop: '6px',
            letterSpacing: '0.5px'
          }}>
            Power Line Analytics
          </div>
        </div>

        {/* منو */}
        <nav style={{ flex: 1, padding: '15px 0' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: 'calc(100% - 20px)',
                padding: '14px 20px',
                margin: '2px 10px',
                background: activeTab === tab.id 
                  ? 'linear-gradient(90deg, rgba(0,240,255,0.15) 0%, rgba(0,240,255,0.05) 100%)' 
                  : 'transparent',
                border: 'none',
                borderRadius: '12px',
                color: activeTab === tab.id ? '#00f0ff' : 'rgba(224,240,255,0.7)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(0,240,255,0.08)';
                  e.target.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'rgba(224,240,255,0.7)';
                }
              }}
            >
              <span style={{ fontSize: '18px', marginLeft: '12px', filter: activeTab === tab.id ? 'drop-shadow(0 0 8px rgba(0,240,255,0.5))' : 'none' }}>
                {tab.icon}
              </span>
              {tab.label}
              {activeTab === tab.id && (
                <span style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '20px',
                  background: '#00f0ff',
                  borderRadius: '2px',
                  boxShadow: '0 0 10px #00f0ff',
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* فوتر */}
        <div style={{ 
          padding: '20px', 
          borderTop: '1px solid rgba(0,240,255,0.15)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
            padding: '8px 12px',
            background: 'rgba(0,240,255,0.05)',
            borderRadius: '10px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: role === 'admin' ? 'linear-gradient(135deg, #ff4d4d, #ff4081)' : 'linear-gradient(135deg, #00f0ff, #b366ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              boxShadow: role === 'admin' ? '0 0 15px rgba(255,77,77,0.3)' : '0 0 15px rgba(0,240,255,0.3)',
            }}>
              {role === 'admin' ? '👑' : '👤'}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>
                {role === 'admin' ? 'مدیر سیستم' : 'کاربر'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                خوش آمدید
              </div>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255, 77, 77, 0.1)',
              border: '1px solid rgba(255, 77, 77, 0.3)',
              color: '#ff4d4d',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 77, 77, 0.2)';
              e.target.style.borderColor = '#ff4d4d';
              e.target.style.boxShadow = '0 0 15px rgba(255,77,77,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 77, 77, 0.1)';
              e.target.style.borderColor = 'rgba(255, 77, 77, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <span>🚪</span>
            خروج از حساب
          </button>
        </div>
      </div>

      {/* دکمه‌های شناور در حالت بسته */}
      {collapsed && (
        <div style={{
          position: 'fixed',
          right: '22px',
          top: '90px',
          zIndex: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '15px',
                background: activeTab === tab.id 
                  ? 'rgba(0, 240, 255, 0.2)' 
                  : 'rgba(10,15,25,0.7)',
                backdropFilter: 'blur(20px)',
                border: activeTab === tab.id 
                  ? '1px solid #00f0ff' 
                  : '1px solid rgba(0,240,255,0.3)',
                color: activeTab === tab.id ? '#00f0ff' : 'rgba(224,240,255,0.7)',
                fontSize: '22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab.id 
                  ? '0 0 20px rgba(0,240,255,0.4)' 
                  : '0 4px 15px rgba(0,0,0,0.3)',
                transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.borderColor = '#00f0ff';
                e.target.style.boxShadow = '0 0 25px rgba(0,240,255,0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = activeTab === tab.id ? 'scale(1.05)' : 'scale(1)';
                e.target.style.borderColor = activeTab === tab.id ? '#00f0ff' : 'rgba(0,240,255,0.3)';
                e.target.style.boxShadow = activeTab === tab.id ? '0 0 20px rgba(0,240,255,0.4)' : '0 4px 15px rgba(0,0,0,0.3)';
              }}
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