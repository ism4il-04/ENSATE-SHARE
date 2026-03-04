import { create } from 'zustand';
import { User } from '@/types';
import { authAPI } from '@/lib/api';

// Helper: get token from either storage
const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper: clear token from both storages
const clearStoredToken = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
};

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean; // true only after first checkAuth() has completed (prevents flash + wrong redirect)
    error: string | null;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
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
    isInitialized: false,
    error: null,

    login: async (email: string, password: string, rememberMe: boolean = false) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.login(email, password, rememberMe);
            const { user, token } = response.data;

            // Store token based on rememberMe preference
            clearStoredToken();
            if (rememberMe) {
                localStorage.setItem('token', token);
            } else {
                sessionStorage.setItem('token', token);
            }

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
            clearStoredToken();
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                error: null,
            });
        }
    },

    checkAuth: async () => {
        if (typeof window === 'undefined') return;
        const token = getStoredToken();
        if (!token) {
            set({ isAuthenticated: false, user: null, isInitialized: true, isLoading: false });
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
                isInitialized: true,
            });
        } catch (error) {
            clearStoredToken();
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
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
