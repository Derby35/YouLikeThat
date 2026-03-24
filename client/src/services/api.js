import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' }
});

// slap the JWT on every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// boot to login if the token is expired/invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
