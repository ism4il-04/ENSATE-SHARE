'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

interface DashboardShellProps {
    role: 'responsable' | 'superadmin';
    children: React.ReactNode;
}

// Staff dashboards: sidebar on desktop, top bar + slide-in menu on phones
export default function DashboardShell({ role, children }: DashboardShellProps) {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    // A tap on a menu link navigates: close the menu so it doesn't cover the new page
    useEffect(() => setMenuOpen(false), [pathname]);

    return (
        <ProtectedRoute allowedRoles={[role]}>
            <div className="min-h-screen bg-cream-100 flex flex-col">
                {/* Phone top bar */}
                <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-cream-300/60 bg-white/90 backdrop-blur">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        className="inline-flex items-center justify-center rounded-lg p-2 -ml-2 text-atlas-700 hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
                        aria-label="Ouvrir le menu"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="text-sm font-semibold text-atlas-900">
                        ENSATE-SHARE · {role === 'superadmin' ? 'Admin' : 'Responsable'}
                    </span>
                </div>

                <div className="flex flex-1 min-h-0">
                    {menuOpen && (
                        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
                            <div className="fixed inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
                            <div className="relative z-50 w-72 max-w-[85vw] h-full overflow-y-auto bg-white shadow-lg">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(false)}
                                    className="absolute right-3 top-3 z-10 rounded-lg p-2 text-atlas-500 hover:bg-cream-100"
                                    aria-label="Fermer le menu"
                                >
                                    <X size={20} />
                                </button>
                                <Sidebar />
                            </div>
                        </div>
                    )}

                    <div className="hidden md:block">
                        <Sidebar />
                    </div>

                    <main className="flex-1 min-w-0 overflow-auto w-full px-4 py-6 sm:px-6 lg:px-8">{children}</main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
