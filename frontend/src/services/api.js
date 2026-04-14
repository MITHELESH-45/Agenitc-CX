import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const sendMessage = async (message, userId = 'user_1') => {
  try {
    const response = await api.post('/chat', { message, userId });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// --- Admin APIs ---

export const getAnalytics = async () => {
  try {
    // Admin routes are at /admin not /api
    const response = await api.get('/../admin/analytics');
    return response.data;
  } catch (error) {
    console.error('Analytics Error:', error);
    throw error;
  }
};

export const getMetrics = async () => {
  try {
    const response = await api.get('/../admin/metrics');
    return response.data;
  } catch (error) {
    console.error('Metrics Error:', error);
    throw error;
  }
};

export const getTickets = async () => {
  try {
    const response = await api.get('/../admin/tickets');
    return response.data;
  } catch (error) {
    console.error('Tickets Error:', error);
    throw error;
  }
};

export default api;
