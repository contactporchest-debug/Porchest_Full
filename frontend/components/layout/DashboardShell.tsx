'use client';

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Menu } from 'lucide-react';

export default function DashboardShell({ children, role }: { children: ReactNode; role: 'influencer' | 'brand' | 'admin' | 'software-client' }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#0A0A0B] text-white">
            <div className="hidden lg:block">
                <Sidebar role={role} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="lg:hidden">
                    <div className="flex h-16 items-center justify-between border-b border-[#2A2A30] bg-[#0A0A0B] px-4">
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A30] bg-[#1A1A1E] text-gray-300"
                        >
                            <Menu size={18} />
                        </button>
                        <p className="text-sm font-semibold tracking-[0.16em] text-white">PORCHEST</p>
                        <div className="h-10 w-10 rounded-lg bg-blue-600" />
                    </div>
                    {mobileOpen && (
                        <Sidebar role={role} mobileOpen onNavigate={() => setMobileOpen(false)} />
                    )}
                </div>
                <div className="hidden lg:block">
                    <TopBar />
                </div>
                <main className="flex-1 overflow-y-auto bg-[#0A0A0B] p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
