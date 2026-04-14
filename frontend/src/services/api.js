import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
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


export const getAnalytics = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/analytics`);
    return response.data;
  } catch (error) {
    console.error('Analytics Error:', error);
    throw error;
  }
};

export const getMetrics = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/metrics`);
    return response.data;
  } catch (error) {
    console.error('Metrics Error:', error);
    throw error;
  }
};

export const getTickets = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/tickets`);
    return response.data;
  } catch (error) {
    console.error('Tickets Error:', error);
    throw error;
  }
};

export default api;
