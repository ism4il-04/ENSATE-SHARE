'use client';

import DashboardShell from '@/components/DashboardShell';

export default function SuperadminDashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell role="superadmin">{children}</DashboardShell>;
}
