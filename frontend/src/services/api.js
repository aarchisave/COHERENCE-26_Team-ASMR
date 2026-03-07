import axios from 'axios';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api' 
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bfiq_token');
  console.log('🚀 API Request:', config.url, 'Token:', token ? 'Exists' : 'Missing', 'BaseURL:', config.baseURL);
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
export const askAI        = (data) => api.post('/ai/chat', data);
export const generateReport = (data) => api.post('/ai/report', data);
export const uploadFile     = (fd)   => api.post('/ingestion/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

export default api;
