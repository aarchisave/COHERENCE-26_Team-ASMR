import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5005',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchBudget = () => api.get('/api/budget');
export const fetchUtilization = () => api.get('/api/analytics/utilization');
export const fetchAnomalies = () => api.get('/api/analytics/anomalies');
export const fetchPrediction = () => api.get('/api/prediction/fund-lapse');
export const fetchReallocation = () => api.get('/api/recommendation/reallocate');

export default api;
