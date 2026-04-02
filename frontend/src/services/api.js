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

export default api;
