import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiError } from '@/types';

// In production (cluster) use /api prefix which nginx proxies to the API service
// In development use localhost:4000 directly
const BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000');

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('neptune_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('neptune_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
