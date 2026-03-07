import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bfiq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getOverview    = (year) => api.get(`/analytics/overview?year=${year}`);
export const getAnomalies   = (year) => api.get(`/analytics/anomalies?year=${year}`);
export const getPredictions = (year) => api.get(`/analytics/predictions?year=${year}`);
export const getOptimizer   = (year) => api.get(`/analytics/optimizer?year=${year}`);
export const getReports     = ()     => api.get('/analytics/reports');
export const getBudget      = (year) => api.get(`/budget?year=${year}`);
export const getMeta        = ()     => api.get('/budget/meta');
export const uploadFile     = (fd)   => api.post('/ingestion/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

export default api;
