import axios from 'axios';
import toast from 'react-hot-toast';

const API_HOST = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://api.wephas.com' : 'http://localhost:3001');

const api = axios.create({
  baseURL: `${API_HOST}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach school user token or super admin token — whichever is present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('superAdminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isLoginRequest = url.includes('/auth/login') || url.includes('/superadmin/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      const isSuperAdmin = window.location.pathname.startsWith('/superadmin');
      if (isSuperAdmin) {
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminUser');
        window.location.href = '/superadmin/login';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired, please log in again.');
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
