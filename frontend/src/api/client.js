import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getOverview = () => api.get('/analytics/overview').then(r => r.data);
export const getSpendByCategory = () => api.get('/analytics/spend-by-category').then(r => r.data);
export const getSpendTrend = () => api.get('/analytics/spend-trend').then(r => r.data);
export const getTopVendors = (limit = 5) => api.get(`/analytics/top-vendors?limit=${limit}`).then(r => r.data);
export const getUpcomingRenewals = (days = 90) => api.get(`/analytics/upcoming-renewals?days=${days}`).then(r => r.data);

export const getSubscriptions = (params = {}) => api.get('/subscriptions', { params }).then(r => r.data);
export const getSubscription = (id) => api.get(`/subscriptions/${id}`).then(r => r.data);
export const createSubscription = (data) => api.post('/subscriptions', data).then(r => r.data);
export const updateSubscription = (id, data) => api.put(`/subscriptions/${id}`, data).then(r => r.data);
export const cancelSubscription = (id, reason) => api.delete(`/subscriptions/${id}`, { params: { reason } }).then(r => r.data);

export const getCategories = () => api.get('/categories').then(r => r.data);
export const createCategory = (data) => api.post('/categories', data).then(r => r.data);

export const getSavingsOpportunities = (params = {}) => api.get('/savings', { params }).then(r => r.data);
export const detectSavings = () => api.post('/savings/detect').then(r => r.data);
export const updateSavingsStatus = (id, status) => api.put(`/savings/${id}`, { status }).then(r => r.data);

export const getReviews = (params = {}) => api.get('/reviews', { params }).then(r => r.data);
export const createReview = (data) => api.post('/reviews', data).then(r => r.data);

export const getActivityLog = (params = {}) => api.get('/activity', { params }).then(r => r.data);

export default api;
