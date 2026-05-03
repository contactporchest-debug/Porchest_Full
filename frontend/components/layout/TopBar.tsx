'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, ChevronDown } from 'lucide-react';

function titleFromPath(pathname: string) {
    const parts = pathname.split('/').filter(Boolean);
    const label = parts[parts.length - 1] || 'dashboard';
    const map: Record<string, string> = {
        dashboard: 'Dashboard',
        profile: 'Profile',
        analytics: 'Analytics',
        collaborations: 'Collaborations',
        influencers: 'Influencers',
        earnings: 'Earnings',
        requests: 'Requests',
        users: 'Users',
        campaigns: 'Campaigns',
        matching: 'Smart Matching',
        projects: 'Projects',
    };
    return map[label] || label.charAt(0).toUpperCase() + label.slice(1);
}

export default function TopBar() {
    const pathname = usePathname();
    const title = titleFromPath(pathname);

    return (
        <header className="flex h-16 items-center justify-between border-b border-[#2A2A30] bg-[#0A0A0B] px-6 lg:px-8">
            <div>
                <p className="text-xl font-semibold text-white">{title}</p>
                <p className="text-xs text-gray-500">Porchest workspace</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-lg border border-[#2A2A30] bg-[#1A1A1E] px-3 py-2 md:flex">
                    <Search size={16} className="text-gray-500" />
                    <input
                        placeholder="Search"
                        className="w-40 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
                    />
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A30] bg-[#1A1A1E] text-gray-400 hover:text-white">
                    <Bell size={16} />
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-[#2A2A30] bg-[#1A1A1E] px-3 py-2 text-sm text-gray-300 hover:text-white">
                    <div className="h-6 w-6 rounded-full bg-blue-600" />
                    <ChevronDown size={14} />
                </button>
            </div>
        </header>
    );
}
