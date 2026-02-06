import { create } from 'zustand';
import { User } from '@/types';
import { authAPI } from '@/lib/api';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    setUser: (user: User | null) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.login(email, password);
            const { user, token } = response.data;

            // Store token in localStorage
            localStorage.setItem('token', token);

            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Login failed',
                isLoading: false,
                isAuthenticated: false,
            });
            throw error;
        }
    },

    logout: async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                error: null,
            });
        }
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
        }

        set({ isLoading: true });
        try {
            const response = await authAPI.getMe();
            set({
                user: response.data.user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            localStorage.removeItem('token');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    setUser: (user: User | null) => {
        set({ user });
    },

    clearError: () => {
        set({ error: null });
    },
}));
