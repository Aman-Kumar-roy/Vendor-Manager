import { apiClient } from '../../services/api.client';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  createdAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface MeResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
  };
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return res.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const res = await apiClient.get<MeResponse>('/auth/me');
    return res.data;
  },

  createAdminUser: async (data: CreateUserDto): Promise<{ success: boolean; message?: string; data?: { user: User } }> => {
    const res = await apiClient.post('/auth/users', data);
    return res.data;
  },

  getAdminUsers: async (): Promise<{ success: boolean; data?: { users: User[] } }> => {
    const res = await apiClient.get('/auth/users');
    return res.data;
  },

  deleteAdminUser: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await apiClient.delete(`/auth/users/${id}`);
    return res.data;
  },
};

