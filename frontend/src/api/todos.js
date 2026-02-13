import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const todosAPI = {
  getTodos: async () => {
    const response = await axios.get(`${API_BASE}/todos`, { headers: getAuthHeader() });
    return response.data;
  },
  createTodo: async (title, description, priority, dueDate) => {
    const response = await axios.post(
      `${API_BASE}/todos`,
      { title, description, priority, dueDate },
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  updateTodo: async (id, data) => {
    const response = await axios.put(`${API_BASE}/todos/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  deleteTodo: async (id) => {
    const response = await axios.delete(`${API_BASE}/todos/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};
