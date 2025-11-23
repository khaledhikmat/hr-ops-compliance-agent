import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

export const documentAPI = {
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: () => api.get('/documents'),
  getById: (id: string) => api.get(`/documents/${id}`),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

export const taskAPI = {
  getAll: (params?: { status?: string; assigned_to?: number }) =>
    api.get('/tasks', { params }),
  create: (data: {
    issue_id: number;
    title: string;
    description?: string;
    assigned_to?: number;
    due_date?: string;
  }) => api.post('/tasks', data),
  update: (
    id: number,
    data: {
      status?: string;
      assigned_to?: number;
      due_date?: string;
      description?: string;
    }
  ) => api.patch(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

export const reportAPI = {
  generate: (data: { title: string; document_ids: number[] }) =>
    api.post('/reports/generate', data),
  getAll: () => api.get('/reports'),
  getById: (id: string) => api.get(`/reports/${id}`),
  delete: (id: string) => api.delete(`/reports/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
