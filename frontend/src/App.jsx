import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import api, { getRecords, getFilterOptions } from './api';
import ExcelUploader from './components/ExcelUploader';
import Login from './components/Login';
import AddModal from './components/AddModal';
import AddRecordPanel from './components/AddRecordPanel';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import TowerManagement from './components/TowerManagement/TowerManagement';
import UserManagement from './components/UserManagement/UserManagement';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./components/Dashboard'));
const DataTable  = lazy(() => import('./components/DataTable'));
const Report     = lazy(() => import('./components/Report'));

function App() {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const role = localStorage.getItem('role') || 'user';

  const [activeTab, setActiveTab]         = useState('dashboard');
  const [records, setRecords]             = useState([]);
  const [filterOptions, setFilterOptions] = useState(null);
  const [quickStats, setQuickStats]       = useState({ total: 0, cold: 0, hot: 0 });
  const [isLoading, setIsLoading]         = useState(false);
  const [dataLoaded, setDataLoaded]       = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({});

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
      } catch {
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

  useEffect(() => {
    const handleAuthError = () => {
      setIsLoggedIn(false);
      setDataLoaded(false);
      setRecords([]);
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const qsRes  = await api.get('/quick-stats').then(r => r.data);
      setQuickStats(qsRes);
      const recRes = await getRecords(0, 10000);
      setRecords(recRes.data);
      // dataLoaded را true می‌گذاریم حتی اگر هیچ رکوردی نباشد (بعد از اولین لود)
      setDataLoaded(true);
      const optRes = await getFilterOptions();
      setFilterOptions(optRes.data);
    } catch (err) {
      console.error('خطا در بارگذاری:', err);
      // حتی در صورت خطا، dataLoaded را true کن تا فرم‌ها نمایش داده شوند
      setDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadInitialData();
  }, [isLoggedIn, loadInitialData]);

  const handleUpload = async (file) => {
    setIsLoading(true);
    try {
      const { uploadExcel } = await import('./api');
      await uploadExcel(file);
      await loadInitialData();
      alert('✅ داده‌ها با موفقیت بارگذاری شدند');
    } catch {
      alert('❌ خطا در بارگذاری فایل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin  = () => { setIsLoggedIn(true); setAuthChecked(true); };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    setIsLoggedIn(false);
    setDataLoaded(false);
    setRecords([]);
  };

  const fieldsForAdd = records.length > 0
    ? Object.keys(records[0]).filter(k => k !== 'id')
    : [];

  useEffect(() => {
    const canvas = document.getElementById('space-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 160 }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      r:       Math.random() * 1.8,
      speed:   Math.random() * 0.45 + 0.15,
      opacity: Math.random() * 0.75 + 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  // تب‌هایی که نیازی به dataLoaded ندارند و همیشه باید نمایش داده شوند
  const alwaysVisibleTabs = ['add', 'users', 'towers'];
  const showAlwaysVisible = alwaysVisibleTabs.includes(activeTab);

  return (
    <div className="app-root">
      <canvas id="space-canvas" />

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={role}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {/* نمایش آپلودر فقط اگر داده‌ای نیست و روی تب داده‌محور هستیم */}
        {!dataLoaded && !isLoading && !showAlwaysVisible && (
          <ExcelUploader onUpload={handleUpload} />
        )}

        {isLoading && (
          <div className="app-loading-stacks">
            <div className="skeleton" style={{ height: '52px', width: '100%', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ height: '320px', width: '100%', borderRadius: 'var(--radius-lg)' }} />
          </div>
        )}

        {/* تب‌هایی که همیشه نمایش داده می‌شوند صرف نظر از dataLoaded */}
        {!isLoading && (
          <Suspense fallback={<div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />}>
            {activeTab === 'add'   && <AddRecordPanel onSuccess={loadInitialData} />}
            {activeTab === 'towers' && <TowerManagement />}
            {activeTab === 'users'  && <UserManagement />}
          </Suspense>
        )}

        {/* تب‌هایی که به داده نیاز دارند */}
        {dataLoaded && !isLoading && (
          <Suspense fallback={<div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />}>
            {activeTab === 'dashboard' && <Dashboard records={records} filterOptions={filterOptions} />}
            {activeTab === 'data'      && <DataTable records={records} onDataChange={loadInitialData} />}
            {activeTab === 'report'    && <Report records={records} />}
            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                records={records}
                filterOptions={filterOptions}
                analyticsFilters={analyticsFilters}
                onAnalyticsFilterChange={setAnalyticsFilters}
              />
            )}
          </Suspense>
        )}
      </main>

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
