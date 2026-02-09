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
    displayName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    year: string;
    filiere: string;
    semester: string;
    module: string;
    fileCategory: 'Cours' | 'TD' | 'TP' | 'EXAM' | 'Autre';
    fileLabel?: string;
    uploadedBy: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Semester {
    name: string;
    modules: string[];
}

export interface YearLevel {
    code: string; // "2AP1", "GI1", "GSTR1"
    semesters: Semester[];
}

export interface Cycle {
    name: string; // "Cycle Préparatoire", "Cycle Ingénieur - Génie Informatique"
    cycle: 'CP' | 'CI';
    years: YearLevel[];
}

export interface Filiere {
    name: string;
    code?: string;
    semesters: Semester[];
}

export interface Year {
    name: string;
    cycle?: string;
    filieres: Filiere[];
}

export interface AcademicStructure {
    _id: string;
    cycles: Cycle[];
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
