import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080api';

export const authAPI = {
  signup: async (name, email, password) => {
    const response = await axios.post(`${API_BASE}/auth/signup`, { name, email, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return response.data;
  }
};
