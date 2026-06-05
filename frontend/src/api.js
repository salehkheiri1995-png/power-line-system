import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// افزودن توکن به هدر تمام درخواست‌ها
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// مدیریت خطای 401 (انقضای توکن) بدون رفرش صفحه
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
      // ارسال رویداد سفارشی به App برای نمایش صفحه ورود
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);

// ----- CRUD اصلی -----
export const getRecords = (skip = 0, limit = 100) =>
  api.get(`/records?skip=${skip}&limit=${limit}`);

export const getRecord = (id) => api.get(`/records/${id}`);

export const createRecord = (data) => api.post('/records', data);

export const updateRecord = (id, data) => api.put(`/records/${id}`, data);

export const deleteRecord = (id) => api.delete(`/records/${id}`);

// ----- آپلود فایل اکسل -----
export const uploadExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ----- فیلترها -----
export const getFilterOptions = () => api.get('/filter-options');

export const filterRecords = (params) =>
  api.post('/records/filter', null, { params });

// ----- آمار -----
export const getStats = () => api.get('/stats');

export const getQuickStats = () => api.get('/quick-stats');

// ----- احراز هویت -----
export const loginUser = (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/login', formData);
};

// ثبت‌نام کاربر عادی (از صفحه Login)
export const registerUser = (username, password) =>
  api.post('/register', {
    username,
    password,
    role: 'user',
    permissions: 'dashboard,data',
  });

export const getCurrentUser = () => api.get('/users/me');

// ----- آنالیز پیشرفته -----
export const getParetoData = (field) => api.get(`/analytics/pareto?field=${field}`);
export const getTrendData = () => api.get('/analytics/trend');
export const getHeatmapData = () => api.get('/analytics/heatmap');
export const getCorrelationData = () => api.get('/analytics/correlation');

// ----- مدیریت خطوط و دکل‌ها (قدیمی) -----
export const getLines = () => api.get('/lines-towers/lines');
export const getTowers = (lineId = '') =>
  api.get(`/lines-towers/towers${lineId ? `?line_id=${lineId}` : ''}`);
export const getMaintenanceRecords = (towerId = '') =>
  api.get(`/lines-towers/maintenance-records${towerId ? `?tower_id=${towerId}` : ''}`);
export const getPlannedTasks = (lineId = '') =>
  api.get(`/lines-towers/planned-tasks${lineId ? `?line_id=${lineId}` : ''}`);
export const getOpenPlansForLine = (lineId) =>
  api.get(`/lines-towers/planned-tasks/line/${encodeURIComponent(lineId)}/open`);
export const createLine = (data) => api.post('/lines-towers/lines', data);
export const createTower = (data) => api.post('/lines-towers/towers', data);
export const createPlannedTask = (data) => api.post('/lines-towers/planned-tasks', data);
export const completePlannedTask = (taskId) =>
  api.put(`/lines-towers/planned-tasks/${taskId}/complete`);
export const deletePlannedTask = (taskId) =>
  api.delete(`/lines-towers/planned-tasks/${taskId}`);
export const markTowerCompleted = (towerId) =>
  api.post(`/lines-towers/towers/${towerId}/mark-completed`);
export const updateAllTowerDates = () => api.post('/lines-towers/update-all-tower-dates');
export const importFromRecords = () => api.post('/lines-towers/import-from-records');
export const completePlans = (planIds) => api.post('/lines-towers/complete-plans', planIds);

// ----- مدیریت کاربران (فقط ادمین) -----
export const getUsers = () => api.get('/users');
export const createUserAdmin = (data) => api.post('/users', data);
export const updateUserAdmin = (id, data) => api.put(`/users/${id}`, data);
export const deleteUserAdmin = (id) => api.delete(`/users/${id}`);

// ----- سرویس‌های جدید Grid (خط، دکل، مقره، هادی، یراق، ارت، دهانه، بازرسی) -----
export const getGridLines = () => api.get('/grid/lines');
export const createGridLine = (data) => api.post('/grid/lines', data);
export const updateGridLine = (id, data) => api.put(`/grid/lines/${id}`, data);
export const deleteGridLine = (id) => api.delete(`/grid/lines/${id}`);

export const getGridTowers = (lineId = '') =>
  api.get(`/grid/towers${lineId ? `?line_id=${lineId}` : ''}`);
export const createGridTower = (data) => api.post('/grid/towers', data);
export const updateGridTower = (id, data) => api.put(`/grid/towers/${id}`, data);
export const deleteGridTower = (id) => api.delete(`/grid/towers/${id}`);

export const getInsulators = (towerId = '') =>
  api.get(`/grid/insulators${towerId ? `?tower_id=${towerId}` : ''}`);
export const createInsulator = (data) => api.post('/grid/insulators', data);
export const updateInsulator = (id, data) => api.put(`/grid/insulators/${id}`, data);
export const deleteInsulator = (id) => api.delete(`/grid/insulators/${id}`);

export const getConductors = (towerId = '') =>
  api.get(`/grid/conductors${towerId ? `?tower_id=${towerId}` : ''}`);
export const createConductor = (data) => api.post('/grid/conductors', data);
export const updateConductor = (id, data) => api.put(`/grid/conductors/${id}`, data);
export const deleteConductor = (id) => api.delete(`/grid/conductors/${id}`);

export const getFittings = (towerId = '') =>
  api.get(`/grid/fittings${towerId ? `?tower_id=${towerId}` : ''}`);
export const createFitting = (data) => api.post('/grid/fittings', data);
export const updateFitting = (id, data) => api.put(`/grid/fittings/${id}`, data);
export const deleteFitting = (id) => api.delete(`/grid/fittings/${id}`);

export const getGroundings = () => api.get('/grid/groundings');
export const createGrounding = (data) => api.post('/grid/groundings', data);
export const updateGrounding = (id, data) => api.put(`/grid/groundings/${id}`, data);
export const deleteGrounding = (id) => api.delete(`/grid/groundings/${id}`);

export const getSpans = (lineId = '') =>
  api.get(`/grid/spans${lineId ? `?line_id=${lineId}` : ''}`);
export const createSpan = (data) => api.post('/grid/spans', data);
export const updateSpan = (id, data) => api.put(`/grid/spans/${id}`, data);
export const deleteSpan = (id) => api.delete(`/grid/spans/${id}`);

export const getInspections = (lineId = '', towerId = '') => {
  const params = [];
  if (lineId) params.push(`line_id=${encodeURIComponent(lineId)}`);
  if (towerId) params.push(`tower_id=${encodeURIComponent(towerId)}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return api.get(`/grid/inspections${qs}`);
};
export const createInspection = (data) => api.post('/grid/inspections', data);
export const updateInspection = (id, data) => api.put(`/grid/inspections/${id}`, data);
export const deleteInspection = (id) => api.delete(`/grid/inspections/${id}`);

export { api };
export default api;
