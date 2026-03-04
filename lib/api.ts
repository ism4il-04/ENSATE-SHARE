import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear auth state on 401
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/ensa-portal-9x7k')) {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (email: string, password: string, rememberMe: boolean = false) =>
        api.post('/auth/login', { email, password, rememberMe }),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Files API
export const filesAPI = {
    getFiles: (params?: any) => api.get('/files', { params }),
    getFileById: (id: string) => api.get(`/files/${id}`),
    uploadFile: (formData: FormData) =>
        api.post('/files', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateFile: (id: string, data: any) => api.put(`/files/${id}`, data),
    deleteFile: (id: string) => api.delete(`/files/${id}`),
    downloadFile: (id: string) => api.get(`/files/${id}/download`),
};

// Users API (Superadmin only)
export const usersAPI = {
    getUsers: () => api.get('/users'),
    createUser: (data: any) => api.post('/users', data),
    updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
    deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// Structure API
export const structureAPI = {
    getStructure: () => api.get('/structure'),
    updateStructure: (data: { cycles: unknown[] }) => api.put('/structure', data),
};

// Stats API (Superadmin only)
export const statsAPI = {
    getDashboardStats: () => api.get('/stats/dashboard'),
    getFilesByFiliere: () => api.get('/stats/files-by-filiere'),
    getFilesByYear: () => api.get('/stats/files-by-year'),
    getActivityLogs: (params?: any) => api.get('/stats/logs', { params }),
};
