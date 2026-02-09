'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();

    // Wait until we've run the initial auth check (token from localStorage + getMe)
    const authPending = !isInitialized || isLoading;

    useEffect(() => {
        if (!isInitialized) return;
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }
        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            if (user.role === 'superadmin') {
                router.replace('/dashboard/superadmin');
            } else {
                router.replace('/dashboard/responsable');
            }
        }
    }, [isInitialized, isAuthenticated, user, allowedRoles, router]);

    if (authPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-100">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-cream-300 border-t-accent-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
