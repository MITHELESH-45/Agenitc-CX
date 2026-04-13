import axios from 'axios';

const api = axios.create({
  baseURL: 'https://agenitc-cx.onrender.com',
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
