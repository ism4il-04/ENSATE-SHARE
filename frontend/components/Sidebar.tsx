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
    Activity,
    UserCircle,
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
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-cream-300/60 md:h-screen md:sticky md:top-0 flex flex-col md:overflow-y-auto">
            {/* Logo */}
            <div className="p-6 border-b border-cream-300/60">
                <Link href="/" className="block">
                    <Image
                        src="/ensa-share_logo.png"
                        alt="ENSATE-SHARE"
                        width={180}
                        height={56}
                        className="h-9 w-auto"
                    />
                </Link>
                <p className="text-sm text-atlas-600 mt-2">
                    {user?.role === 'superadmin' ? 'Superadmin' : 'Responsable'}
                </p>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-cream-300/60">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                        <span className="text-accent-700 font-semibold">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-atlas-900 truncate">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-atlas-500 truncate">{user?.email}</p>
                    </div>
                </div>
                {user?.role === 'responsable' && (
                    <div className="mt-3 text-xs text-atlas-600">
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
                                        ? 'bg-accent-50 text-accent-700 font-medium'
                                        : 'text-atlas-700 hover:bg-cream-100'
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

            {/* Profile & Logout */}
            <div className="p-4 border-t border-cream-300/60 space-y-1">
                <Link
                    href={user?.role === 'superadmin' ? '/dashboard/superadmin/profile' : '/dashboard/responsable/profile'}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname.endsWith('/profile')
                            ? 'bg-accent-50 text-accent-700 font-medium'
                            : 'text-atlas-700 hover:bg-cream-100'
                        }`}
                >
                    <UserCircle size={20} />
                    <span>Profil</span>
                </Link>
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
