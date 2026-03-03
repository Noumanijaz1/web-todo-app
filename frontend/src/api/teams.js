import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const teamsAPI = {
  getTeams: async () => {
    const response = await axios.get(`${API_BASE}/teams`, { headers: getAuthHeader() });
    return response.data;
  },
  getTeam: async (id) => {
    const response = await axios.get(`${API_BASE}/teams/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  createTeam: async (name, description, memberIds) => {
    const response = await axios.post(
      `${API_BASE}/teams`,
      { name, description, members: memberIds },
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  updateTeam: async (id, payload) => {
    const response = await axios.put(`${API_BASE}/teams/${id}`, payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
  deleteTeam: async (id) => {
    await axios.delete(`${API_BASE}/teams/${id}`, {
      headers: getAuthHeader(),
    });
  },
};
