import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const usersAPI = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  }
};

export default usersAPI;
