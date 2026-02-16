import axios from 'axios';
import { normalizeTask, normalizeTasks } from '@/lib/taskUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const todosAPI = {
  getTodos: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/todos`, {
      params,
      headers: getAuthHeader(),
    });
    const data = response.data;
    return Array.isArray(data) ? normalizeTasks(data) : [];
  },
  getTodoById: async (id) => {
    const response = await axios.get(`${API_BASE}/todos/${id}`, {
      headers: getAuthHeader(),
    });
    return normalizeTask(response.data);
  },
  createTodo: async (titleOrPayload, description, priority, dueDate) => {
    // Accept either a payload object or individual fields
    let payload;
    if (titleOrPayload && typeof titleOrPayload === 'object' && !Array.isArray(titleOrPayload)) {
      payload = titleOrPayload;
    } else {
      payload = {
        title: titleOrPayload,
        description,
        priority,
        dueDate
      };
    }

    const response = await axios.post(`${API_BASE}/todos`, payload, { headers: getAuthHeader() });
    return normalizeTask(response.data);
  },
  updateTodo: async (id, data) => {
    const response = await axios.put(`${API_BASE}/todos/${id}`, data, {
      headers: getAuthHeader()
    });
    return normalizeTask(response.data);
  },
  deleteTodo: async (id) => {
    const response = await axios.delete(`${API_BASE}/todos/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
  addComment: async (id, text) => {
    const response = await axios.post(
      `${API_BASE}/todos/${id}/comments`,
      { text },
      { headers: getAuthHeader() }
    );
    return normalizeTask(response.data);
  },
  addAttachment: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(
      `${API_BASE}/todos/${id}/attachments`,
      formData,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return normalizeTask(response.data);
  },
};
