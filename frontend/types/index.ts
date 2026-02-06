export interface User {
    id: string;
    email: string;
    role: 'responsable' | 'superadmin';
    firstName: string;
    lastName: string;
    assignedYear?: string;
    assignedFiliere?: string;
    isActive: boolean;
}

export interface File {
    _id: string;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    year: string;
    filiere: string;
    module: string;
    uploadedBy: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    uploadedAt: string;
    updatedAt: string;
}

export interface Module {
    name: string;
}

export interface Filiere {
    name: string;
    modules: string[];
}

export interface Year {
    name: string;
    filieres: Filiere[];
}

export interface AcademicStructure {
    _id: string;
    years: Year[];
    updatedAt: string;
}

export interface ActivityLog {
    _id: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    action: string;
    targetId?: string;
    targetType?: string;
    details?: any;
    timestamp: string;
}

export interface DashboardStats {
    totalFiles: number;
    totalResponsables: number;
    filesThisMonth: number;
    totalStorage: number;
    recentUploads: File[];
}

export interface FileDistribution {
    _id: string;
    count: number;
    totalSize: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    count: number;
    total: number;
    page: number;
    pages: number;
    data: T[];
}
