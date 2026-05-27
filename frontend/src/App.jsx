import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import api, { getRecords, getFilterOptions } from './api';
import ExcelUploader from './components/ExcelUploader';
import Login from './components/Login';
import AddModal from './components/AddModal';
import AddRecordPanel from './components/AddRecordPanel';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import TowerManagement from './components/TowerManagement/TowerManagement';
import UserManagement from './components/UserManagement/UserManagement'; // ✅ جدید
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./components/Dashboard'));
const DataTable = lazy(() => import('./components/DataTable'));
const Report = lazy(() => import('./components/Report'));

function App() {
  // ----- احراز هویت -----
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const role = localStorage.getItem('role') || 'user';

  // ----- وضعیت داده‌ها -----
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [filterOptions, setFilterOptions] = useState(null);
  const [quickStats, setQuickStats] = useState({ total: 0, cold: 0, hot: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({});

  // ===================== ۱. بررسی اعتبار توکن =====================
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        setAuthChecked(true);
        return;
      }

      try {
        await api.get('/users/me');
        setIsLoggedIn(true);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('permissions');
        setIsLoggedIn(false);
      } finally {
        setAuthChecked(true);
      }
    };

    verifyToken();
  }, []);

  // ===================== ۲. گوش دادن به رویداد "auth-error" =====================
  useEffect(() => {
    const handleAuthError = () => {
      setIsLoggedIn(false);
      setDataLoaded(false);
      setRecords([]);
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  // ===================== ۳. بارگذاری داده‌ها =====================
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const qsRes = await fetch('/api/quick-stats').then(r => r.json());
      setQuickStats(qsRes);

      const recRes = await getRecords(0, 10000);
      setRecords(recRes.data);
      setDataLoaded(recRes.data.length > 0);

      const optRes = await getFilterOptions();
      setFilterOptions(optRes.data);
    } catch (err) {
      console.error('خطا در بارگذاری داده‌ها:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadInitialData();
    }
  }, [isLoggedIn, loadInitialData]);

  // ===================== ۴. هندلرهای عمومی =====================
  const handleUpload = async (file) => {
    setIsLoading(true);
    try {
      const { uploadExcel } = await import('./api');
      await uploadExcel(file);
      await loadInitialData();
      alert('✅ داده‌ها با موفقیت بارگذاری شدند');
    } catch (err) {
      alert('❌ خطا در بارگذاری فایل');
    }
    setIsLoading(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setAuthChecked(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions'); // ✅ پاک کردن دسترسی‌ها
    setIsLoggedIn(false);
    setDataLoaded(false);
    setRecords([]);
  };

  const fieldsForAdd = records.length > 0
    ? Object.keys(records[0]).filter(k => k !== 'id')
    : [];

  // ===================== ۵. Canvas پس‌زمینه =====================
  useEffect(() => {
    const canvas = document.getElementById('space-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      });
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // ===================== ۶. رندر اصلی =====================
  if (!authChecked) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0b10',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <canvas
        id="space-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          opacity: 0.6,
        }}
      />

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={role}
        onLogout={handleLogout}
      />

      <div style={{ padding: '20px 80px 20px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        {!dataLoaded && !isLoading && <ExcelUploader onUpload={handleUpload} />}

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton" style={{ height: '50px', width: '100%' }} />
            <div className="skeleton" style={{ height: '300px', width: '100%' }} />
          </div>
        )}

        {dataLoaded && (
          <Suspense fallback={<div className="skeleton" style={{ height: '400px' }} />}>
            {activeTab === 'add' && <AddRecordPanel onSuccess={loadInitialData} />}
            {activeTab === 'dashboard' && <Dashboard records={records} filterOptions={filterOptions} />}
            {activeTab === 'data' && <DataTable records={records} onDataChange={loadInitialData} />}
            {activeTab === 'report' && <Report records={records} />}
            {activeTab === 'towers' && <TowerManagement />}
            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                records={records}
                filterOptions={filterOptions}
                analyticsFilters={analyticsFilters}
                onAnalyticsFilterChange={setAnalyticsFilters}
              />
            )}
            {activeTab === 'users' && <UserManagement />}  {/* ✅ تب مدیریت کاربران */}
          </Suspense>
        )}
      </div>

      {showAddModal && (
        <AddModal
          fields={fieldsForAdd}
          onClose={() => setShowAddModal(false)}
          onSaved={loadInitialData}
        />
      )}
    </div>
  );
}

export default App;