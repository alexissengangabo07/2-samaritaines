import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Intercepteur pour ajouter le token JWT à chaque requête
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.code === 'LICENSE_EXPIRED') {
      window.location.href = '/expired';
    }
    return Promise.reject(error);
  }
);

export default API;