'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, User, Users, BarChart3, Briefcase, DollarSign, Inbox,
    Building2, Handshake, Sparkles, FolderKanban, LogOut, ChevronRight, TrendingUp,
    ShieldCheck, ShieldAlert,
} from 'lucide-react';

type Role = 'influencer' | 'brand' | 'admin' | 'software-client';

const NAVS: Record<Role, Array<{ label: string; href: string; icon: React.ReactNode }>> = {
    influencer: [
        { label: 'Dashboard',      href: '/dashboard/influencer',                icon: <LayoutDashboard size={18} /> },
        { label: 'Profile',        href: '/dashboard/influencer/profile',        icon: <User size={18} /> },
        { label: 'Instagram Analytics', href: '/dashboard/influencer/analytics', icon: <BarChart3 size={18} /> },
        { label: 'Campaigns',      href: '/dashboard/influencer/collaborations', icon: <Briefcase size={18} /> },
        { label: 'Performance',    href: '/dashboard/influencer/performance',    icon: <TrendingUp size={18} /> },
        { label: 'Earnings',       href: '/dashboard/influencer/earnings',       icon: <DollarSign size={18} /> },
        { label: 'Requests',       href: '/dashboard/influencer/requests',       icon: <Inbox size={18} /> },
    ],
    brand: [
        { label: 'Dashboard',      href: '/dashboard/brand',                     icon: <LayoutDashboard size={18} /> },
        { label: 'Profile',        href: '/dashboard/brand/profile',             icon: <Building2 size={18} /> },
        { label: 'Influencers',    href: '/dashboard/brand/influencers',         icon: <Users size={18} /> },
        { label: 'Collaborations', href: '/dashboard/brand/collaborations',      icon: <Handshake size={18} /> },
        { label: 'Performance',    href: '/dashboard/brand/performance',         icon: <TrendingUp size={18} /> },
        { label: 'Tracking Setup', href: '/brand/webhook-setup',                 icon: <Briefcase size={18} /> },
        { label: 'Smart Matching', href: '/dashboard/brand/matching',            icon: <Sparkles size={18} /> },
    ],
    admin: [
        { label: 'Dashboard',      href: '/dashboard/admin',                     icon: <LayoutDashboard size={18} /> },
        { label: 'Users',          href: '/dashboard/admin/users',               icon: <Users size={18} /> },
        { label: 'Payments',       href: '/dashboard/admin/payments',            icon: <ShieldCheck size={18} /> },
        { label: 'Collaborations', href: '/dashboard/admin/collaborations',      icon: <Handshake size={18} /> },
        { label: 'Fraud Detection', href: '/dashboard/admin/fraud-detection',    icon: <ShieldAlert size={18} /> },
        { label: 'Cashouts',       href: '/dashboard/admin/cashouts',            icon: <DollarSign size={18} /> },
    ],
    'software-client': [
        { label: 'Dashboard',      href: '/dashboard/software-client',           icon: <LayoutDashboard size={18} /> },
        { label: 'Profile',        href: '/dashboard/software-client/profile',   icon: <User size={18} /> },
        { label: 'Projects',       href: '/dashboard/software-client/projects',  icon: <FolderKanban size={18} /> },
    ],
}; 

export default function Sidebar({
    role,
    mobileOpen = true,
    brandLogo = '',
    brandName = '',
    onNavigate,
}: {
    role: Role;
    mobileOpen?: boolean;
    brandLogo?: string;
    brandName?: string;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const router = useRouter();
    const nav = NAVS[role] || NAVS.brand;

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside
            style={{
                width: '256px',
                flexShrink: 0,
                background: 'rgba(253,246,238,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRight: '1px solid #EDD9BC',
                display: mobileOpen ? 'flex' : 'none',
                flexDirection: 'column',
                minHeight: '100vh',
                position: 'sticky',
                top: 0,
            }}
            className="lg:flex"
        >
            {/* Logo */}
            <div style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                borderBottom: '1px solid #EDD9BC',
                gap: '10px',
                flexShrink: 0,
            }}>
                <Image
                    src={role === 'brand' && brandLogo ? brandLogo : '/porchest-logo.png'}
                    alt={role === 'brand' && brandLogo ? (brandName || 'Brand logo') : 'Porchest'}
                    width={32}
                    height={32}
                    unoptimized={Boolean(role === 'brand' && brandLogo)}
                    style={{ borderRadius: role === 'brand' && brandLogo ? '10px' : '6px', objectFit: 'cover' }}
                />
                <div>
                    <p style={{ fontSize: '17px', fontWeight: 600, color: '#1A0A00', lineHeight: 1.2 }}>{role === 'brand' && brandName ? brandName : 'Porchest'}</p>
                    <p style={{ fontSize: '10px', fontWeight: 500, color: '#C4A882', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Dashboard</p>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {nav.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: active ? 600 : 400,
                                color: active ? '#C2340A' : '#7A5030',
                                background: active ? 'rgba(194,52,10,0.10)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.color = '#C2340A';
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(194,52,10,0.06)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.color = '#7A5030';
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: active ? '#C2340A' : '#C4A882' }}>{item.icon}</span>
                                {item.label}
                            </span>
                            {active && <ChevronRight size={14} style={{ color: '#C2340A' }} />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom: sign out */}
            <div style={{ borderTop: '1px solid #EDD9BC', padding: '12px' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#7A5030',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = '#C2340A';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(194,52,10,0.06)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = '#7A5030';
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                >
                    <LogOut size={16} style={{ color: '#C4A882' }} />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
