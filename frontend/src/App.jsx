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

// Theme initialisation — must run before React mounts to avoid flash
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
    try { return sessionStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (_) { return 'light'; }
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
      console.error('\u062e\u0637\u0627 \u062f\u0631 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc:', err);
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
      alert('\u2705 \u062f\u0627\u062f\u0647\u200c\u0647\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0634\u062f\u0646\u062f');
    } catch {
      alert('\u274c \u062e\u0637\u0627 \u062f\u0631 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0641\u0627\u06cc\u0644');
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
      </div>
    );
  }

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  const alwaysVisibleTabs = ['add', 'users', 'towers'];
  const showAlwaysVisible = alwaysVisibleTabs.includes(activeTab);

  return (
    <div className="app-root">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? '\u062d\u0627\u0644\u062a \u0631\u0648\u0634\u0646' : '\u062d\u0627\u0644\u062a \u062a\u0627\u0631\u06cc\u06a9'}
        title={theme === 'dark' ? '\u062d\u0627\u0644\u062a \u0631\u0648\u0634\u0646' : '\u062d\u0627\u0644\u062a \u062a\u0627\u0631\u06cc\u06a9'}
        style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 300 }}
      >
        {theme === 'dark' ? '\u2600\ufe0f' : '\ud83c\udf19'}
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
