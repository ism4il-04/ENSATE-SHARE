'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
    LayoutDashboard,
    Upload,
    FileText,
    Users,
    Settings,
    LogOut,
    BarChart3,
    FolderTree,
    Activity
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const responsableLinks = [
        { href: '/dashboard/responsable', icon: LayoutDashboard, label: 'Tableau de bord' },
        { href: '/dashboard/responsable/upload', icon: Upload, label: 'Uploader' },
        { href: '/dashboard/responsable/files', icon: FileText, label: 'Mes fichiers' },
    ];

    const superadminLinks = [
        { href: '/dashboard/superadmin', icon: LayoutDashboard, label: 'Tableau de bord' },
        { href: '/dashboard/superadmin/files', icon: FileText, label: 'Tous les fichiers' },
        { href: '/dashboard/superadmin/users', icon: Users, label: 'Utilisateurs' },
        { href: '/dashboard/superadmin/structure', icon: FolderTree, label: 'Structure' },
        { href: '/dashboard/superadmin/stats', icon: BarChart3, label: 'Statistiques' },
        { href: '/dashboard/superadmin/logs', icon: Activity, label: 'Logs' },
    ];

    const links = user?.role === 'superadmin' ? superadminLinks : responsableLinks;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <Link href="/" className="block">
                    <Image
                        src="/ensa-share_logo.png"
                        alt="ENSA-SHARE"
                        width={180}
                        height={56}
                        className="h-9 w-auto"
                    />
                </Link>
                <p className="text-sm text-gray-600 mt-2">
                    {user?.role === 'superadmin' ? 'Superadmin' : 'Responsable'}
                </p>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                {user?.role === 'responsable' && (
                    <div className="mt-3 text-xs text-gray-600">
                        <p><strong>Année:</strong> {user.assignedYear}</p>
                        <p><strong>Filière:</strong> {user.assignedFiliere}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary-50 text-primary-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
                >
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
}
