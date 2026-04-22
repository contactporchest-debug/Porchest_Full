'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { brandAPI, influencerAPI } from '@/lib/api';
import {
    LayoutDashboard, Users, Megaphone, BarChart3,
    UserCircle, Briefcase, DollarSign, LogOut,
    ChevronLeft, ChevronRight, Bell, Search, Bot, Shield,
    Inbox, Mail, CheckCheck, ExternalLink,
} from 'lucide-react';

const adminNav = [
    { label: 'Overview', href: '/dashboard/admin', icon: <LayoutDashboard size={17} /> },
    { label: 'Users', href: '/dashboard/admin/users', icon: <Users size={17} /> },
    { label: 'Campaigns', href: '/dashboard/admin/campaigns', icon: <Megaphone size={17} /> },
];
const brandNav = [
    { label: 'Overview', href: '/dashboard/brand', icon: <LayoutDashboard size={17} /> },
    { label: 'My Profile', href: '/dashboard/brand/profile', icon: <UserCircle size={17} /> },
    { label: 'Influencers', href: '/dashboard/brand/influencers', icon: <Users size={17} /> },
    { label: 'Collaborations', href: '/dashboard/brand/collaborations', icon: <Briefcase size={17} /> },
    { label: 'Analytics', href: '/dashboard/brand/analytics', icon: <BarChart3 size={17} /> },
    { label: 'AI Matching', href: '/dashboard/brand/matching', icon: <Bot size={17} /> },
];
const influencerNav = [
    { label: 'Overview', href: '/dashboard/influencer', icon: <LayoutDashboard size={17} /> },
    { label: 'My Profile', href: '/dashboard/influencer/profile', icon: <UserCircle size={17} /> },
    { label: 'Requests', href: '/dashboard/influencer/requests', icon: <Inbox size={17} /> },
    { label: 'Analytics', href: '/dashboard/influencer/analytics', icon: <BarChart3 size={17} /> },
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

interface NotifItem {
    _id: string;
    type: string;
    title: string;
    message?: string;
    isRead: boolean;
    createdAt: string;
    senderName?: string;
    senderAvatar?: string;
    campaignRequestId?: string;
}

function NotificationDropdown({ notifications, unreadCount, onMarkRead, onMarkAllRead, onClose, role }: {
    notifications: NotifItem[];
    unreadCount: number;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    onClose: () => void;
    role: string;
}) {
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [onClose]);

    const getTimeAgo = (date: string) => {
        const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const typeColor: Record<string, string> = {
        collaboration_request: '#60d5f8',
        request_accepted: '#4ade80',
        request_rejected: '#f87171',
        request_viewed: '#a78bfa',
        negotiation: '#fbbf24',
        counter_offer: '#fbbf24',
        deal_closed: '#4ade80',
    };

    return (
        <motion.div ref={dropdownRef} initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'absolute', top: '48px', right: '0', width: '380px', maxHeight: '480px',
                background: 'rgba(14,12,26,0.95)', border: '1px solid rgba(123,63,242,0.2)',
                borderRadius: '20px', backdropFilter: 'blur(30px)', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(123,63,242,0.08)',
                overflow: 'hidden', zIndex: 100,
            }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={14} style={{ color: '#a78bfa' }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#fff' }}>Notifications</span>
                    {unreadCount > 0 && (
                        <span style={{ padding: '2px 8px', borderRadius: '99px', background: 'rgba(123,63,242,0.2)', border: '1px solid rgba(123,63,242,0.3)', fontSize: '10px', color: '#a78bfa', fontWeight: '700' }}>
                            {unreadCount} new
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button onClick={onMarkAllRead} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <CheckCheck size={11} /> Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <Mail size={32} style={{ color: 'rgba(123,63,242,0.2)', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div key={n._id}
                            onClick={() => {
                                if (!n.isRead) onMarkRead(n._id);
                                if (role === 'influencer') router.push('/dashboard/influencer/requests');
                                else router.push('/dashboard/brand/collaborations');
                                onClose();
                            }}
                            style={{
                                padding: '14px 20px', cursor: 'pointer', transition: 'all 150ms ease',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                background: n.isRead ? 'transparent' : 'rgba(123,63,242,0.04)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(123,63,242,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(123,63,242,0.04)')}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                {/* Unread dot */}
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.isRead ? 'transparent' : '#7B3FF2', marginTop: '5px', flexShrink: 0, boxShadow: n.isRead ? 'none' : '0 0 8px rgba(123,63,242,0.5)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: n.isRead ? 'rgba(255,255,255,0.6)' : '#fff' }}>{n.title}</span>
                                    </div>
                                    {n.message && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.5', marginBottom: '4px' }}>{n.message}</p>}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '10px', color: typeColor[n.type] || 'rgba(255,255,255,0.25)', fontWeight: '600', textTransform: 'capitalize' }}>
                                            {n.type.replace(/_/g, ' ')}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>•</span>
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{getTimeAgo(n.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState<NotifItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    if (!user) return null;

    const nav = roleNav[user.role] || [];
    const roleColor = rolePillColor[user.role];
    const displayName = user.companyName || user.fullName || user.email.split('@')[0];

    const api = user.role === 'brand' ? brandAPI : influencerAPI;

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const [nRes, cRes] = await Promise.all([
                api.getNotifications({ limit: 20 }),
                api.getUnreadCount(),
            ]);
            setNotifications(nRes.data.notifications || []);
            setUnreadCount(cRes.data.count || 0);
        } catch { /* silent */ }
    }, [user.role]);

    useEffect(() => {
        if (user.role === 'brand' || user.role === 'influencer') {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [fetchNotifications, user.role]);

    const handleMarkRead = async (id: string) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

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
                                style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '11px 0' : '', position: 'relative' }}>
                                <span style={{ flexShrink: 0, color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
                                 {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                                {/* Show unread count on primary action items */}
                                {(item.label === 'Requests' || item.label === 'Collaborations') && unreadCount > 0 && (
                                    <span style={{
                                        position: collapsed ? 'absolute' : 'relative',
                                        top: collapsed ? '4px' : 'auto',
                                        right: collapsed ? '4px' : 'auto',
                                        marginLeft: collapsed ? 0 : 'auto',
                                        minWidth: '18px', height: '18px', borderRadius: '99px',
                                        background: 'linear-gradient(135deg, #7B3FF2, #A855F7)',
                                        fontSize: '10px', fontWeight: '800', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 5px', boxShadow: '0 0 10px rgba(123,63,242,0.4)',
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                        {/* Notification bell */}
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            style={{
                                position: 'relative', width: '36px', height: '36px', borderRadius: '10px',
                                background: showNotifs ? 'rgba(123,63,242,0.12)' : 'rgba(255,255,255,0.04)',
                                border: showNotifs ? '1px solid rgba(123,63,242,0.3)' : '1px solid rgba(255,255,255,0.07)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: showNotifs ? '#a78bfa' : 'rgba(255,255,255,0.45)', cursor: 'pointer',
                                transition: 'all 150ms ease',
                            }}>
                            <Bell size={15} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-4px', right: '-4px',
                                    minWidth: '16px', height: '16px', borderRadius: '99px',
                                    background: 'linear-gradient(135deg, #7B3FF2, #A855F7)',
                                    fontSize: '9px', fontWeight: '800', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 4px', border: '2px solid #050505',
                                    boxShadow: '0 0 8px rgba(123,63,242,0.4)',
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification dropdown */}
                        <AnimatePresence>
                            {showNotifs && (
                                <NotificationDropdown
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    onMarkRead={handleMarkRead}
                                    onMarkAllRead={handleMarkAllRead}
                                    onClose={() => setShowNotifs(false)}
                                    role={user.role}
                                />
                            )}
                        </AnimatePresence>

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
