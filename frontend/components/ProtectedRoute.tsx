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
    const { user, isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
                return;
            }

            if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                // Redirect to appropriate dashboard based on role
                if (user.role === 'superadmin') {
                    router.push('/dashboard/superadmin');
                } else {
                    router.push('/dashboard/responsable');
                }
            }
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
