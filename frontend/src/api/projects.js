import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const projectsAPI = {
  getAll: async () => {
    const response = await axios.get(`${API_BASE}/projects`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
  getById: async (id) => {
    const response = await axios.get(`${API_BASE}/projects/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
  getProjectTasks: async (id) => {
    const response = await axios.get(`${API_BASE}/projects/${id}/tasks`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
  create: async (data) => {
    const response = await axios.post(`${API_BASE}/projects`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
  update: async (id, data) => {
    const response = await axios.put(`${API_BASE}/projects/${id}`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE}/projects/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
