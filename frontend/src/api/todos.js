import axios from 'axios';

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
    return response.data;
  },
  getTodoById: async (id) => {
    const response = await axios.get(`${API_BASE}/todos/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
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
    return response.data;
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
    return response.data;
  },
};
