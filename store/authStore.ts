import { create } from 'zustand';
import { User } from '@/types';
import { authAPI } from '@/lib/api';

// The session lives in an httpOnly cookie set by the API, so this store never
// sees or stores the token itself; it only keeps the current user.
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean; // true only after first checkAuth() has completed (prevents flash + wrong redirect)
    error: string | null;
    justSignedIn: boolean; // true right after an explicit sign-in, until acknowledged (not on session restore)
    acknowledgeSignIn: () => void;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    loginWithGoogle: (credential: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    setUser: (user: User | null) => void;
    clearError: () => void;
}

type SetState = (partial: Partial<AuthState>) => void;

// Shared by password and Google login: the API sets the session cookie and returns the user
const signIn = async (set: SetState, request: () => Promise<{ data: { user: User } }>) => {
    set({ isLoading: true, error: null });
    try {
        const response = await request();
        set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
            justSignedIn: true,
        });
    } catch (error: any) {
        set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
        });
        throw error;
    }
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,
    justSignedIn: false,

    acknowledgeSignIn: () => set({ justSignedIn: false }),

    login: async (email: string, password: string, rememberMe: boolean = false) => {
        await signIn(set, () => authAPI.login(email, password, rememberMe));
    },

    loginWithGoogle: async (credential: string, rememberMe: boolean = false) => {
        await signIn(set, () => authAPI.googleLogin(credential, rememberMe));
    },

    logout: async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            set({
                user: null,
                isAuthenticated: false,
                error: null,
                justSignedIn: false,
            });
        }
    },

    checkAuth: async () => {
        if (typeof window === 'undefined') return;

        set({ isLoading: true });
        try {
            const response = await authAPI.getMe();
            const user = response.data.user as User | null;
            set({
                user,
                isAuthenticated: !!user,
                isLoading: false,
                isInitialized: true,
            });
        } catch (error) {
            set({
                user: null,
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
