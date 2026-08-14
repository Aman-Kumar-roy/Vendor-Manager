import { apiClient } from '../../services/api.client';

export interface User {
  id: string;
  email: string;
  name: string;
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

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return res.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const res = await apiClient.get<MeResponse>('/auth/me');
    return res.data;
  },
};
