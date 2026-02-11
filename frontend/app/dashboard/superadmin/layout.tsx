'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

export default function SuperadminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute allowedRoles={['superadmin']}>
            <div className="min-h-screen bg-cream-100 flex flex-col">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-cream-300/60 bg-white/80">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-atlas-700 hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                        <span className="sr-only">Ouvrir le menu</span>
                        <svg
                            className="h-6 w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold text-atlas-900">ENSA-SHARE Admin</span>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* Mobile overlay sidebar */}
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-40 flex md:hidden">
                            <div
                                className="fixed inset-0 bg-black/40"
                                onClick={() => setSidebarOpen(false)}
                            />
                            <div className="relative z-50 w-64 h-full bg-white shadow-lg">
                                <Sidebar />
                            </div>
                        </div>
                    )}

                    {/* Desktop sidebar */}
                    <div className="hidden md:block">
                        <Sidebar />
                    </div>

                    <main className="flex-1 overflow-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
