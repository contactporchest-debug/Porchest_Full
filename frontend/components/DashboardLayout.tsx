'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard, Users, Megaphone, BarChart3,
    UserCircle, Briefcase, DollarSign, LogOut,
    ChevronLeft, ChevronRight, Bell, Search, Bot, Shield,
} from 'lucide-react';

const adminNav = [
    { label: 'Overview', href: '/dashboard/admin', icon: <LayoutDashboard size={17} /> },
    { label: 'Users', href: '/dashboard/admin/users', icon: <Users size={17} /> },
    { label: 'Campaigns', href: '/dashboard/admin/campaigns', icon: <Megaphone size={17} /> },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: <BarChart3 size={17} /> },
];
const brandNav = [
    { label: 'Overview', href: '/dashboard/brand', icon: <LayoutDashboard size={17} /> },
    { label: 'My Profile', href: '/dashboard/brand/profile', icon: <UserCircle size={17} /> },
    { label: 'Campaigns', href: '/dashboard/brand/campaigns', icon: <Megaphone size={17} /> },
    { label: 'AI Matching', href: '/dashboard/brand/matching', icon: <Bot size={17} /> },
    { label: 'Analytics', href: '/dashboard/brand/analytics', icon: <BarChart3 size={17} /> },
];
const influencerNav = [
    { label: 'Overview', href: '/dashboard/influencer', icon: <LayoutDashboard size={17} /> },
    { label: 'My Profile', href: '/dashboard/influencer/profile', icon: <UserCircle size={17} /> },
    { label: 'Collaborations', href: '/dashboard/influencer/collaborations', icon: <Briefcase size={17} /> },
    { label: 'Earnings', href: '/dashboard/influencer/earnings', icon: <DollarSign size={17} /> },
];

const roleNav: Record<string, typeof adminNav> = { admin: adminNav, brand: brandNav, influencer: influencerNav };
const rolePillColor: Record<string, string> = { admin: '#ff8c42', brand: '#7B3FF2', influencer: '#A855F7' };
const roleIcons: Record<string, React.ReactNode> = {
    admin: <Shield size={12} />,
    brand: <Megaphone size={12} />,
    influencer: <Bot size={12} />,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    if (!user) return null;

    const nav = roleNav[user.role] || [];
    const roleColor = rolePillColor[user.role];
    const displayName = user.companyName || user.fullName || user.email.split('@')[0];

    const handleLogout = () => { logout(); router.push('/'); };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#050505' }}>
            {/* Neon grid */}
            <div className="neon-grid" />
            <div className="edge-glow" />

            {/* ── Sidebar ── */}
            <motion.aside
                animate={{ width: collapsed ? 68 : 232 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                style={{
                    position: 'sticky', top: 0, height: '100vh',
                    flexShrink: 0, zIndex: 40, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(10,9,18,0.85)',
                    backdropFilter: 'blur(30px)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '4px 0 40px rgba(0,0,0,0.4)',
                }}
            >
                {/* Logo area */}
                <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    {collapsed ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', boxShadow: '0 0 20px rgba(123,63,242,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '16px', color: '#fff', margin: '0 auto' }}>P</div>
                    ) : (
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', boxShadow: '0 0 16px rgba(123,63,242,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#fff', flexShrink: 0 }}>P</div>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '17px', color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                                Por<span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chest</span>
                            </span>
                        </Link>
                    )}
                </div>

                {/* Role badge */}
                {!collapsed && (
                    <div style={{ padding: '12px 12px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 12px', borderRadius: '10px', background: `${roleColor}0d`, border: `1px solid ${roleColor}25` }}>
                            <span style={{ color: roleColor }}>{roleIcons[user.role]}</span>
                            <span style={{ fontSize: '11px', color: roleColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user.role}</span>
                        </div>
                    </div>
                )}

                {/* Nav */}
                <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
                    {nav.map((item) => {
                        const isExact = pathname === item.href;
                        const isNested = item.href !== `/dashboard/${user.role}` && pathname?.startsWith(item.href) && item.href !== '/dashboard/messages';
                        const isActive = isExact || isNested || (item.href === '/dashboard/messages' && pathname === '/dashboard/messages');
                        return (
                            <Link key={item.href} href={item.href}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                title={collapsed ? item.label : undefined}
                                style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '11px 0' : '' }}>
                                <span style={{ flexShrink: 0, color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
                                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User + logout */}
                <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    {!collapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px 10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="sidebar-link" title={collapsed ? 'Sign Out' : undefined}
                        style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', color: 'rgba(248,113,113,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <LogOut size={16} />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(!collapsed)}
                    style={{ position: 'absolute', top: '20px', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: '#0d0c1a', border: '1px solid rgba(123,63,242,0.3)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 0 12px rgba(123,63,242,0.15)' }}>
                    {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
                </button>
            </motion.aside>

            {/* ── Main ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                {/* Topbar */}
                <header style={{
                    height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 28px', position: 'sticky', top: 0, zIndex: 30,
                    background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={14} style={{ position: 'absolute', left: '14px', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                            <input type="text" placeholder="Search..." className="input-dark"
                                style={{ paddingLeft: '38px', height: '36px', fontSize: '13px', borderRadius: '10px', width: '216px', background: 'rgba(255,255,255,0.04)' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                            <Bell size={15} />
                        </button>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', boxShadow: '0 0 14px rgba(123,63,242,0.4)' }}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto' }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={pathname}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
