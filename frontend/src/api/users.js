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
  getAll: async () => {
    const response = await axios.get(`${API_BASE}/users`, {
      headers: getAuthHeader(),
    });
    return response.data?.data ?? [];
  },
  getMe: async () => {
    const response = await axios.get(`${API_BASE}/users/me`, {
      headers: getAuthHeader(),
    });
    return response.data?.data ?? null;
  },
  updateMe: async (formData) => {
    const response = await axios.put(`${API_BASE}/users/me`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data ?? null;
  },
  getById: async (id) => {
    const response = await axios.get(`${API_BASE}/users/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data?.data ?? null;
  },
  create: async (data) => {
    const response = await axios.post(`${API_BASE}/users`, data, {
      headers: getAuthHeader(),
    });
    return response.data?.data ?? null;
  },
  update: async (id, data) => {
    const response = await axios.put(`${API_BASE}/users/${id}`, data, {
      headers: getAuthHeader(),
    });
    return response.data?.data ?? null;
  },
  delete: async (id) => {
    await axios.delete(`${API_BASE}/users/${id}`, {
      headers: getAuthHeader(),
    });
  },
};
