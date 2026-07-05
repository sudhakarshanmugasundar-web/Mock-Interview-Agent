import { create } from 'zustand';
import { axiosClient } from '../api/axiosClient';
import type { UserProfile } from '../types/auth';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  registerUser: (username: string, email: string, password: string) => Promise<void>;
  loginSocial: (provider: 'google' | 'github', oauthToken: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  loadStoredAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken, userId, email: userEmail, roles } = response.data;

      const profile: UserProfile = {
        id: userId,
        email: userEmail,
        username: userEmail.split('@')[0], // Extract clean username
        role: roles[0] || 'ROLE_CANDIDATE',
      };

      if (rememberMe) {
        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('auth_refresh_token', refreshToken);
        localStorage.setItem('auth_user', JSON.stringify(profile));
      } else {
        sessionStorage.setItem('auth_token', accessToken);
        sessionStorage.setItem('auth_refresh_token', refreshToken);
        sessionStorage.setItem('auth_user', JSON.stringify(profile));
      }

      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        token: accessToken,
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Authentication failed. Please check your credentials.';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  },

  registerUser: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await axiosClient.post('/auth/register', { username, email, password });
      set({ isLoading: false, error: null });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  },

  loginSocial: async (provider, oauthToken) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`Authenticating with social provider: ${provider} (Token: ${oauthToken})`);
      // Direct mock flow that signs in using test credentials
      const response = await axiosClient.post('/auth/login', { email: 'candidate@test.com', password: 'Password123!' });
      const { accessToken, refreshToken, userId, email: userEmail, roles } = response.data;

      const profile: UserProfile = {
        id: userId,
        email: userEmail,
        username: userEmail.split('@')[0],
        role: roles[0] || 'ROLE_CANDIDATE',
      };

      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('auth_refresh_token', refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(profile));

      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        token: accessToken,
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const errMsg = err.message || `Failed to login via ${provider}`;
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  logout: () => {
    // Attempt standard logout on backend (fire and forget)
    axiosClient.post('/auth/logout').catch(() => {});

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_refresh_token');
    sessionStorage.removeItem('auth_user');
    delete axiosClient.defaults.headers.common['Authorization'];

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  loadStoredAuth: () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserProfile;
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({
          token,
          user,
          isAuthenticated: true,
          error: null,
        });
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_refresh_token');
        sessionStorage.removeItem('auth_user');
      }
    }
  },
}));
