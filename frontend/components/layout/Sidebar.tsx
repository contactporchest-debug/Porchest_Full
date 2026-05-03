'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, User, Users, BarChart3, Briefcase, DollarSign, Inbox,
    Building2, Handshake, Sparkles, FolderKanban, Settings, LogOut, ChevronRight,
} from 'lucide-react';

type Role = 'influencer' | 'brand' | 'admin' | 'software-client';

const NAVS: Record<Role, Array<{ label: string; href: string; icon: React.ReactNode }>> = {
    influencer: [
        { label: 'Dashboard', href: '/dashboard/influencer', icon: <LayoutDashboard size={18} /> },
        { label: 'Profile', href: '/dashboard/influencer/profile', icon: <User size={18} /> },
        { label: 'Analytics', href: '/dashboard/influencer/analytics', icon: <BarChart3 size={18} /> },
        { label: 'Campaigns', href: '/dashboard/influencer/collaborations', icon: <Briefcase size={18} /> },
        { label: 'Earnings', href: '/dashboard/influencer/earnings', icon: <DollarSign size={18} /> },
        { label: 'Requests', href: '/dashboard/influencer/requests', icon: <Inbox size={18} /> },
    ],
    brand: [
        { label: 'Dashboard', href: '/dashboard/brand', icon: <LayoutDashboard size={18} /> },
        { label: 'Profile', href: '/dashboard/brand/profile', icon: <Building2 size={18} /> },
        { label: 'Influencers', href: '/dashboard/brand/influencers', icon: <Users size={18} /> },
        { label: 'Collaborations', href: '/dashboard/brand/collaborations', icon: <Handshake size={18} /> },
        { label: 'Analytics', href: '/dashboard/brand/analytics', icon: <BarChart3 size={18} /> },
        { label: 'Smart Matching', href: '/dashboard/brand/matching', icon: <Sparkles size={18} /> },
    ],
    admin: [
        { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard size={18} /> },
        { label: 'Users', href: '/dashboard/admin/users', icon: <Users size={18} /> },
        { label: 'Campaigns', href: '/dashboard/admin/campaigns', icon: <Briefcase size={18} /> },
    ],
    'software-client': [
        { label: 'Dashboard', href: '/dashboard/software-client', icon: <LayoutDashboard size={18} /> },
        { label: 'Profile', href: '/dashboard/software-client/profile', icon: <User size={18} /> },
        { label: 'Projects', href: '/dashboard/software-client/projects', icon: <FolderKanban size={18} /> },
    ],
};

export default function Sidebar({ role, mobileOpen = true, onNavigate }: { role: Role; mobileOpen?: boolean; onNavigate?: () => void }) {
    const pathname = usePathname();
    const nav = NAVS[role] || NAVS.brand;

    return (
        <aside className={`w-64 shrink-0 border-r border-[#2A2A30] bg-[#0B0B0F] ${mobileOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="flex h-16 items-center border-b border-[#2A2A30] px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#202025] border border-[#2A2A30] text-sm font-bold text-white">
                    P
                </div>
                <div className="ml-3">
                    <p className="text-sm font-bold tracking-[0.16em] text-white">PORCHEST</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Dashboard</p>
                </div>
            </div>
            <nav className="space-y-1 p-4">
                {nav.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                                active
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-[#1A1A1E] hover:text-white'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                {item.icon}
                                {item.label}
                            </span>
                            {active ? <ChevronRight size={16} /> : null}
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-auto border-t border-[#2A2A30] p-4">
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-[#1A1A1E] hover:text-white">
                    <Settings size={18} />
                    Settings
                </button>
                <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-[#1A1A1E] hover:text-white">
                    <LogOut size={18} />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
