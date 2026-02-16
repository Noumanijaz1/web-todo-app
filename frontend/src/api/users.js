import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const usersAPI = {
  search: async (query) => {
    const response = await axios.get(`${API_BASE}/users/search`, {
      params: { q: query },
      headers: getAuthHeader(),
    });
    return response.data?.data ?? [];
  },
};
