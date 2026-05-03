'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell } from 'lucide-react';
import Image from 'next/image';

function titleFromPath(pathname: string) {
    const parts = pathname.split('/').filter(Boolean);
    const label = parts[parts.length - 1] || 'dashboard';
    const map: Record<string, string> = {
        dashboard: 'Dashboard', profile: 'Profile', analytics: 'Analytics',
        collaborations: 'Collaborations', influencers: 'Influencers',
        earnings: 'Earnings', requests: 'Requests', users: 'Users',
        campaigns: 'Campaigns', matching: 'Smart Matching', projects: 'Projects',
        brand: 'Dashboard', influencer: 'Dashboard', admin: 'Dashboard',
        'software-client': 'Dashboard',
    };
    return map[label] || label.charAt(0).toUpperCase() + label.slice(1);
}

export default function TopBar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const title = titleFromPath(pathname);
    const initials = user?.fullName
        ? user.fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
        : 'P';

    return (
        <header style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            borderBottom: '1px solid #EDD9BC',
            background: 'rgba(253,246,238,0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            flexShrink: 0,
        }}>
            <div>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.01em' }}>{title}</p>
                <p style={{ fontSize: '11px', color: '#C4A882', fontWeight: 500, letterSpacing: '0.03em', marginTop: '1px' }}>Porchest workspace</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Search */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.60)',
                    border: '1px solid #EDD9BC',
                    borderRadius: '8px',
                    padding: '8px 14px',
                }}>
                    <Search size={15} style={{ color: '#C4A882', flexShrink: 0 }} />
                    <input
                        placeholder="Search"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '13px',
                            color: '#1A0A00',
                            width: '140px',
                            fontFamily: 'inherit',
                        }}
                        className="placeholder:text-[#C4A882]"
                    />
                </div>

                {/* Bell */}
                <button style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #EDD9BC',
                    background: 'rgba(255,255,255,0.60)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#7A5030',
                }}>
                    <Bell size={15} />
                </button>

                {/* Avatar */}
                <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #C2340A, #FF6B1A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#fff',
                    cursor: 'pointer',
                    flexShrink: 0,
                }}>
                    {initials}
                </div>
            </div>
        </header>
    );
}
