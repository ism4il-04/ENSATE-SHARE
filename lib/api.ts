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

// Auth is carried by the httpOnly "token" cookie set by the API; JavaScript never sees the token.

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const path = typeof window !== 'undefined' ? window.location.pathname : '';
            // Only protected pages need to bounce back to home on an expired session
            if (path.startsWith('/dashboard')) {
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
    googleLogin: (credential: string, rememberMe: boolean = false) =>
        api.post('/auth/google', { credential, rememberMe }),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Files API
export const filesAPI = {
    getFiles: (params?: any) => api.get('/files', { params }),
    getFileById: (id: string) => api.get(`/files/${id}`),
    // Direct-to-Drive upload, see lib/directUpload.ts
    createUploadSession: (data: Record<string, unknown>) => api.post('/files/upload-session', data),
    completeUpload: (data: { uploadId: string; driveFileId: string }) => api.post('/files/upload-complete', data),
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
    getStructureWithIds: () => api.get('/structure', { params: { withIds: 1 } }),
    updateStructure: (data: { cycles: unknown[] }) => api.put('/structure', data),
};

// Saved parcours API (any signed-in user)
export const parcoursAPI = {
    getSaved: () => api.get('/parcours'),
    save: (data: { cycle: string; filiere: string; year: string; semester: string }) =>
        api.post('/parcours', data),
    remove: (id: string) => api.delete(`/parcours/${id}`),
};

// Student allowlist API (Superadmin only)
export const studentsAPI = {
    getList: (params: { search?: string; page?: number }) => api.get('/students', { params }),
    importEmails: (emails: string[]) => api.post('/students/import', { emails }),
    remove: (id: string) => api.delete(`/students/${encodeURIComponent(id)}`),
    clearAll: () => api.delete('/students', { params: { all: 'true' } }),
};

// Stats API (Superadmin only)
export const statsAPI = {
    getDashboardStats: () => api.get('/stats/dashboard'),
    getFilesByFiliere: () => api.get('/stats/files-by-filiere'),
    getFilesByYear: () => api.get('/stats/files-by-year'),
    getActivityLogs: (params?: any) => api.get('/stats/logs', { params }),
};
