import api from './api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MFASetupResponse {
  secret: string;
  qrCode: string;
}

export interface MFAVerifyRequest {
  userId: string;
  token: string;
  isSetup: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User }> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Setup MFA
  async setupMFA(userId: string): Promise<MFASetupResponse> {
    const response = await api.post('/auth/mfa/setup', { userId });
    return response.data;
  },

  // Verify MFA
  async verifyMFA(data: MFAVerifyRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/mfa/verify', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get current user
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  // Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
