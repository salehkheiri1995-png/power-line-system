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
import GridManagement from './components/GridManagement';

const Dashboard = lazy(() => import('./components/Dashboard'));
const DataTable  = lazy(() => import('./components/DataTable'));
const Report     = lazy(() => import('./components/Report'));

// Theme init before React mounts — prevents flash
(function () {
  try {
    const stored = sessionStorage.getItem('theme');
    const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', stored || sys);
  } catch (_) {}
})();

function App() {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const role = localStorage.getItem('role') || 'user';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [filterOptions, setFilterOptions] = useState(null);
  const [quickStats, setQuickStats] = useState({ total: 0, cold: 0, hot: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({});

  const [theme, setTheme] = useState(() => {
    try {
      return sessionStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (_) { return 'light'; }
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { sessionStorage.setItem('theme', next); } catch (_) {}
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setIsLoggedIn(false); setAuthChecked(true); return; }
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

  const loadInitialData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const qsRes = await api.get('/quick-stats').then(r => r.data);
      setQuickStats(qsRes);
      const recRes = await getRecords(0, 10000);
      setRecords(recRes.data);
      setDataLoaded(true);
      const optRes = await getFilterOptions();
      setFilterOptions(optRes.data);
    } catch (err) {
      console.error('خطا در بارگذاری:', err);
      setDataLoaded(true);
    } finally {
      if (!silent) setIsLoading(false);
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

  const handleLogin = () => { setIsLoggedIn(true); setAuthChecked(true); };

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

  if (!authChecked) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>در حال بارگذاری...</p>
      </div>
    );
  }

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  const alwaysVisibleTabs = ['add', 'users', 'towers', 'grid'];
  const showAlwaysVisible = alwaysVisibleTabs.includes(activeTab);

  return (
    <div className="app-root">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
        title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 300,
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={role}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {!dataLoaded && !isLoading && !showAlwaysVisible && (
          <ExcelUploader onUpload={handleUpload} />
        )}

        {isLoading && !showAlwaysVisible && (
          <div className="app-loading-stacks">
            <div className="skeleton" style={{ height: '52px', width: '100%', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ height: '320px', width: '100%', borderRadius: 'var(--radius-lg)' }} />
          </div>
        )}

        <Suspense fallback={<div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />}>
          {activeTab === 'add' && (
            <AddRecordPanel onSuccess={() => loadInitialData({ silent: true })} />
          )}
          {activeTab === 'towers' && <TowerManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'grid' && <GridManagement />}
        </Suspense>

        {dataLoaded && !isLoading && (
          <Suspense fallback={<div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />}>
            {activeTab === 'dashboard' && (
              <Dashboard records={records} filterOptions={filterOptions} />
            )}
            {activeTab === 'data' && (
              <DataTable records={records} onDataChange={loadInitialData} />
            )}
            {activeTab === 'report' && <Report records={records} />}
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
