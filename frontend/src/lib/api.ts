import axios from 'axios';

// In dev, Vite proxies /api → http://localhost:4000; in prod set VITE_API_BASE_URL to the deployed backend URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let token: string | null = null;

export const setToken = (newToken: string) => {
  token = newToken || null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401: swap the expired token, then retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('starverse_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { token: refreshToken });
          const newToken: string = data.accessToken;
          localStorage.setItem('starverse_token', newToken);
          setToken(newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          // Refresh also failed — clear session and go to login
          localStorage.removeItem('starverse_token');
          localStorage.removeItem('starverse_refresh');
          localStorage.removeItem('starverse_user');
          setToken('');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
