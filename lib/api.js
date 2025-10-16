import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  verifyToken: () => api.get('/auth/verify'),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (appointmentData) => api.post('/appointments', appointmentData),
  update: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
  getAvailability: (doctorID, date) => api.get(`/appointments/availability/${doctorID}`, { params: { date } }),
};

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  process: (paymentData) => api.post('/payments', paymentData),
  generateReceipt: (id, format = 'pdf') => api.post(`/payments/${id}/receipt`, { format }),
  processRefund: (id, refundData) => api.post(`/payments/${id}/refund`, refundData),
};

// Medical Records API
export const medicalRecordsAPI = {
  getAll: (params) => api.get('/medical-records', { params }),
  getById: (id) => api.get(`/medical-records/${id}`),
  create: (recordData) => api.post('/medical-records', recordData),
  update: (id, recordData) => api.put(`/medical-records/${id}`, recordData),
  delete: (id) => api.delete(`/medical-records/${id}`),
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/medical-records/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  addProgressNote: (id, note) => api.post(`/medical-records/${id}/progress-notes`, { note }),
};

// Hospitals API
export const hospitalsAPI = {
  getAll: (params) => api.get('/hospitals', { params }),
  getById: (id) => api.get(`/hospitals/${id}`),
  getDoctors: (id, params) => api.get(`/hospitals/${id}/doctors`, { params }),
  getSpecializations: () => api.get('/hospitals/specializations/list'),
  create: (hospitalData) => api.post('/hospitals', hospitalData),
  update: (id, hospitalData) => api.put(`/hospitals/${id}`, hospitalData),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getAppointments: (params) => api.get('/analytics/appointments', { params }),
  getFinancial: (params) => api.get('/analytics/financial', { params }),
  getPatients: (params) => api.get('/analytics/patients', { params }),
  export: (params) => api.get('/analytics/export', { params, responseType: 'blob' }),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
