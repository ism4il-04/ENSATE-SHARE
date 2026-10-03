'use client';

import DashboardShell from '@/components/DashboardShell';

export default function ResponsableDashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell role="responsable">{children}</DashboardShell>;
}
