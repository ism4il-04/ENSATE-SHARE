import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

export default function SuperadminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['superadmin']}>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
