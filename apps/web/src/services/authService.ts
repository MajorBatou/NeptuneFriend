import apiClient from './apiClient';
import type { LoginRequest, LoginResponse, RegisterRequest, ApiResponse } from '@/types';
import type { User } from '@/types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    const { token } = data.data;
    localStorage.setItem('neptune_token', token);
    return data.data;
  },

  register: async (payload: RegisterRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', payload);
    const { token } = data.data;
    localStorage.setItem('neptune_token', token);
    return data.data;
  },

  logout: () => {
    localStorage.removeItem('neptune_token');
    window.location.href = '/login';
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('neptune_token');
  },
};
