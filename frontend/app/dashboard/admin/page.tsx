'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Users, Shield, CheckCircle, XCircle, Trash2, Loader2,
    Search, RefreshCw, ChevronDown, Megaphone, LayoutDashboard,
    Clock, TrendingUp, AlertTriangle, UserCheck, UserX, Edit3,
    ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';

/* ─── Types ────────────────────────────────────────────── */
type Tab = 'overview' | 'users' | 'campaigns';
type UserRole = 'admin' | 'brand' | 'influencer';
type UserStatus = 'active' | 'pending' | 'suspended';

interface AdminUser {
    _id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    fullName?: string;
    companyName?: string;
    createdAt: string;
    isVerified?: boolean;
    profileCompletionStatus?: boolean;
}

interface Campaign {
    _id: string;
    campaignTitle: string;
    brandName: string;
    influencerName: string;
    status: string;
    agreedPrice?: number;
    createdAt: string;
    campaignStartDate?: string;
    campaignEndDate?: string;
    requestCode: string;
}

interface Stats {
    totalUsers: number;
    totalBrands: number;
    totalInfluencers: number;
    totalAdmins: number;
    pendingUsers: number;
    pendingVerifications: number;
    totalRequests: number;
    pendingRequests: number;
    acceptedRequests: number;
    activeRequests: number;
}

/* ─── Status / Role color maps ─────────────────────────── */
const statusColors: Record<string, { bg: string; color: string }> = {
    active:      { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80' },
    pending:     { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
    suspended:   { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
    sent:        { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa' },
    accepted:    { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80' },
    rejected:    { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
    negotiation: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
    deal_closed: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
    cancelled:   { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
    expired:     { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};
const roleColors: Record<string, { bg: string; color: string }> = {
    admin:      { bg: 'rgba(255,140,66,0.12)',  color: '#ff8c42' },
    brand:      { bg: 'rgba(123,63,242,0.12)',  color: '#a78bfa' },
    influencer: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa' },
};

/* ─── Shared tiny components ───────────────────────────── */
const Badge = ({ label, map }: { label: string; map: Record<string, { bg: string; color: string }> }) => {
    const s = map[label] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' };
    return (
        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
            {label}
        </span>
    );
};

const StatCard = ({ label, value, sub, color, icon, progress }: {
    label: string; value: string | number; sub?: string;
    color: string; icon: React.ReactNode; progress?: number;
}) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(14,12,26,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 22px 0 80px', background: `${color}08` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                {icon}
            </div>
        </div>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color, letterSpacing: '-0.04em', filter: `drop-shadow(0 0 8px ${color}50)` }}>{value}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color, opacity: 0.65, marginTop: 3 }}>{sub}</p>}
        {progress != null && (
            <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, progress)}%`, background: color, transition: 'width 700ms ease' }} />
            </div>
        )}
    </motion.div>
);

const TabBtn = ({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 12, border: 'none',
        cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 180ms ease',
        background: active ? 'rgba(255,140,66,0.15)' : 'transparent',
        color: active ? '#ff8c42' : 'rgba(255,255,255,0.4)',
    }}>
        {label}
        {badge != null && badge > 0 && (
            <span style={{ padding: '1px 7px', borderRadius: 99, background: active ? '#ff8c42' : 'rgba(255,255,255,0.1)', color: active ? '#000' : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>
                {badge}
            </span>
        )}
    </button>
);

/* ─── Main Component ────────────────────────────────────── */
export default function AdminDashboard() {
    const [stats,   setStats]   = useState<Stats | null>(null);
    const [users,   setUsers]   = useState<AdminUser[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Users tab state
    const [userSearch,     setUserSearch]     = useState('');
    const [roleFilter,     setRoleFilter]     = useState('');
    const [statusFilter,   setStatusFilter]   = useState('');
    const [actioningUser,  setActioningUser]  = useState<string | null>(null);
    const [editRoleId,     setEditRoleId]     = useState<string | null>(null);

    // Campaigns tab state
    const [campSearch,  setCampSearch]  = useState('');
    const [campStatus,  setCampStatus]  = useState('');
    const [campLoading, setCampLoading] = useState(false);

    /* ── Data Loading ──────────────────────────────────── */
    const loadStats = useCallback(async () => {
        try { const r = await adminAPI.getStats(); setStats(r.data.stats); }
        catch { toast.error('Failed to load stats'); }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const params: Record<string, unknown> = {};
            if (roleFilter)   params.role   = roleFilter;
            if (statusFilter) params.status = statusFilter;
            if (userSearch)   params.search = userSearch;
            const r = await adminAPI.getUsers(params);
            setUsers(r.data.users || []);
        } catch { toast.error('Failed to load users'); }
    }, [roleFilter, statusFilter, userSearch]);

    const loadCampaigns = useCallback(async () => {
        setCampLoading(true);
        try {
            const params: Record<string, unknown> = {};
            if (campStatus) params.status = campStatus;
            if (campSearch) params.search = campSearch;
            const r = await adminAPI.getRequests(params);
            setCampaigns(r.data.requests || []);
        } catch { toast.error('Failed to load campaigns'); }
        finally { setCampLoading(false); }
    }, [campStatus, campSearch]);

    useEffect(() => {
        Promise.all([loadStats(), loadUsers(), loadCampaigns()]).finally(() => setLoading(false));
    }, [loadStats, loadUsers, loadCampaigns]);

    /* ── User Actions ──────────────────────────────────── */
    const handleStatus = async (id: string, status: UserStatus) => {
        setActioningUser(id);
        try {
            await adminAPI.updateUserStatus(id, status);
            toast.success(`User ${status}`);
            setUsers(prev => prev.map(u => u._id === id ? { ...u, status } : u));
            loadStats();
        } catch { toast.error('Action failed'); }
        finally { setActioningUser(null); }
    };

    const handleRoleChange = async (id: string, role: UserRole) => {
        setEditRoleId(null);
        try {
            await adminAPI.updateUserRole(id, role);
            toast.success(`Role changed to ${role}`);
            setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Role change failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this user? This cannot be undone.')) return;
        try {
            await adminAPI.deleteUser(id);
            toast.success('User deleted');
            setUsers(prev => prev.filter(u => u._id !== id));
            loadStats();
        } catch { toast.error('Delete failed'); }
    };

    /* ── Derived ────────────────────────────────────────── */
    const filteredCampaigns = campaigns.filter(c => {
        const q = campSearch.toLowerCase();
        return (!q || c.campaignTitle?.toLowerCase().includes(q) || c.brandName?.toLowerCase().includes(q) || c.influencerName?.toLowerCase().includes(q))
            && (!campStatus || c.status === campStatus);
    });

    /* ── Render ─────────────────────────────────────────── */
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                    {/* ── Header ── */}
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 99, background: 'rgba(255,140,66,0.1)', border: '1px solid rgba(255,140,66,0.25)', marginBottom: 12 }}>
                            <Shield size={11} style={{ color: '#ff8c42' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#ff8c42', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Portal</span>
                        </div>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#fff', letterSpacing: '-0.03em', marginBottom: 5 }}>
                            Platform <span style={{ background: 'linear-gradient(90deg,#ff8c42,#ff5f1f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Control Center</span>
                        </h1>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Manage users, monitor campaigns, and maintain platform health.</p>
                    </motion.div>

                    {/* ── Tabs ── */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <TabBtn label="Overview"  active={activeTab === 'overview'}  onClick={() => setActiveTab('overview')} />
                        <TabBtn label="Users"     active={activeTab === 'users'}     onClick={() => setActiveTab('users')}    badge={stats?.pendingUsers} />
                        <TabBtn label="Campaigns" active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} badge={stats?.activeRequests} />
                    </div>

                    <AnimatePresence mode="wait">

                        {/* ══════════════════════════════════════════
                            TAB 1 — OVERVIEW
                        ══════════════════════════════════════════ */}
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                                {/* Stats grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 24 }}>
                                    <StatCard
                                        label="Total Users" icon={<Users size={16} />}
                                        value={loading ? '—' : (stats?.totalUsers ?? 0)} color="#7B3FF2"
                                        sub={`${stats?.totalBrands ?? 0} brands · ${stats?.totalInfluencers ?? 0} influencers`}
                                    />
                                    <StatCard
                                        label="Total Requests" icon={<Megaphone size={16} />}
                                        value={loading ? '—' : (stats?.totalRequests ?? 0)} color="#A855F7"
                                        sub={`${stats?.activeRequests ?? 0} active collaborations`}
                                    />
                                    <StatCard
                                        label="Pending Verifications" icon={<AlertTriangle size={16} />}
                                        value={loading ? '—' : (stats?.pendingVerifications ?? 0)} color="#fbbf24"
                                        sub="Profiles awaiting admin review"
                                        progress={stats ? (stats.pendingVerifications / Math.max(1, stats.totalUsers)) * 100 : 0}
                                    />
                                    <StatCard
                                        label="Pending Users" icon={<Clock size={16} />}
                                        value={loading ? '—' : (stats?.pendingUsers ?? 0)} color="#60a5fa"
                                        sub="Awaiting account approval"
                                        progress={stats ? (stats.pendingUsers / Math.max(1, stats.totalUsers)) * 100 : 0}
                                    />
                                </div>

                                {/* Platform composition */}
                                <div style={{ background: 'rgba(14,12,26,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '28px 32px', marginBottom: 20 }}>
                                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 20 }}>Platform Composition</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                                        {[
                                            { label: 'Admins',      count: stats?.totalAdmins ?? 0,      color: '#ff8c42', icon: <Shield size={18} /> },
                                            { label: 'Brands',      count: stats?.totalBrands ?? 0,      color: '#7B3FF2', icon: <Megaphone size={18} /> },
                                            { label: 'Influencers', count: stats?.totalInfluencers ?? 0, color: '#A855F7', icon: <Users size={18} /> },
                                        ].map(r => (
                                            <div key={r.label} style={{ padding: '20px 22px', borderRadius: 18, background: `${r.color}08`, border: `1px solid ${r.color}20`, textAlign: 'center' }}>
                                                <div style={{ color: r.color, marginBottom: 10, display: 'flex', justifyContent: 'center' }}>{r.icon}</div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color: r.color }}>{r.count}</p>
                                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{r.label}</p>
                                                {stats && (
                                                    <p style={{ fontSize: 11, color: r.color, marginTop: 4, opacity: 0.7 }}>
                                                        {((r.count / Math.max(1, stats.totalUsers)) * 100).toFixed(1)}%
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Campaign status breakdown */}
                                <div style={{ background: 'rgba(14,12,26,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '28px 32px' }}>
                                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 20 }}>Campaign Request Overview</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                                        {[
                                            { label: 'Total Sent',    val: stats?.totalRequests ?? 0,  color: '#60a5fa' },
                                            { label: 'Accepted',      val: stats?.acceptedRequests ?? 0, color: '#4ade80' },
                                            { label: 'Pending Reply', val: stats?.pendingRequests ?? 0, color: '#fbbf24' },
                                            { label: 'Active',        val: stats?.activeRequests ?? 0,  color: '#a78bfa' },
                                        ].map(s => (
                                            <div key={s.label} style={{ padding: '14px 16px', borderRadius: 14, background: `${s.color}08`, border: `1px solid ${s.color}18`, textAlign: 'center' }}>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.6rem', color: s.color }}>{loading ? '—' : s.val}</p>
                                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ══════════════════════════════════════════
                            TAB 2 — USERS
                        ══════════════════════════════════════════ */}
                        {activeTab === 'users' && (
                            <motion.div key="users" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                                {/* Filters */}
                                <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                                        <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                        <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or email..."
                                            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                        style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                                        <option value="">All Roles</option>
                                        <option value="brand">Brand</option>
                                        <option value="influencer">Influencer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                        style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                    <button onClick={loadUsers} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,140,66,0.1)', border: '1px solid rgba(255,140,66,0.2)', color: '#ff8c42', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        <RefreshCw size={12} /> Refresh
                                    </button>
                                </div>

                                {/* Users table */}
                                <div style={{ background: 'rgba(14,12,26,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}>
                                    <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#fff' }}>All Users ({users.length})</h2>
                                    </div>

                                    {loading ? (
                                        <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#ff8c42' }} /></div>
                                    ) : users.length === 0 ? (
                                        <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No users found</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        {['User', 'Role', 'Status', 'Profile', 'Joined', 'Actions'].map(h => (
                                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.map((u) => (
                                                        <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                                                            {/* User */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                                        {(u.companyName || u.fullName || u.email || '?')[0]?.toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{u.companyName || u.fullName || '—'}</p>
                                                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Role — with inline change dropdown */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                {editRoleId === u._id ? (
                                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                        <select defaultValue={u.role}
                                                                            onChange={e => handleRoleChange(u._id, e.target.value as UserRole)}
                                                                            onBlur={() => setEditRoleId(null)}
                                                                            autoFocus
                                                                            style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                                                                            <option value="brand">Brand</option>
                                                                            <option value="influencer">Influencer</option>
                                                                            <option value="admin">Admin</option>
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                        <Badge label={u.role} map={roleColors} />
                                                                        <button onClick={() => setEditRoleId(u._id)} title="Change role"
                                                                            style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>
                                                                            <Edit3 size={11} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Status */}
                                                            <td style={{ padding: '14px 16px' }}><Badge label={u.status} map={statusColors} /></td>

                                                            {/* Profile completion */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <span style={{ fontSize: 11, color: u.profileCompletionStatus ? '#4ade80' : '#fbbf24' }}>
                                                                    {u.profileCompletionStatus ? '✓ Complete' : '○ Incomplete'}
                                                                </span>
                                                            </td>

                                                            {/* Joined */}
                                                            <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                                                {new Date(u.createdAt).toLocaleDateString()}
                                                            </td>

                                                            {/* Actions */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                {u.role !== 'admin' && (
                                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                                        <button onClick={() => handleStatus(u._id, 'active')} title="Approve / Activate"
                                                                            disabled={actioningUser === u._id}
                                                                            style={{ padding: '6px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', cursor: 'pointer' }}>
                                                                            <UserCheck size={13} />
                                                                        </button>
                                                                        <button onClick={() => handleStatus(u._id, 'suspended')} title="Suspend"
                                                                            disabled={actioningUser === u._id}
                                                                            style={{ padding: '6px', borderRadius: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', cursor: 'pointer' }}>
                                                                            <UserX size={13} />
                                                                        </button>
                                                                        <button onClick={() => handleDelete(u._id)} title="Delete user"
                                                                            style={{ padding: '6px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', cursor: 'pointer' }}>
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ══════════════════════════════════════════
                            TAB 3 — CAMPAIGNS
                        ══════════════════════════════════════════ */}
                        {activeTab === 'campaigns' && (
                            <motion.div key="campaigns" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                                {/* Filters */}
                                <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                                        <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                        <input value={campSearch} onChange={e => setCampSearch(e.target.value)} placeholder="Search campaign, brand, influencer..."
                                            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <select value={campStatus} onChange={e => setCampStatus(e.target.value)}
                                        style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                                        <option value="">All Statuses</option>
                                        <option value="sent">Sent</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="negotiation">Negotiation</option>
                                        <option value="deal_closed">Deal Closed</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                    <button onClick={loadCampaigns} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,140,66,0.1)', border: '1px solid rgba(255,140,66,0.2)', color: '#ff8c42', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        <RefreshCw size={12} /> Refresh
                                    </button>
                                </div>

                                {/* Campaigns table */}
                                <div style={{ background: 'rgba(14,12,26,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}>
                                    <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#fff' }}>Campaign Requests ({filteredCampaigns.length})</h2>
                                    </div>

                                    {campLoading ? (
                                        <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#ff8c42' }} /></div>
                                    ) : filteredCampaigns.length === 0 ? (
                                        <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No campaigns found</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        {['Campaign', 'Brand → Influencer', 'Status', 'Budget', 'Date', 'Code'].map(h => (
                                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredCampaigns.map((c) => (
                                                        <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                                                            {/* Campaign title */}
                                                            <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                                                                <p style={{ fontWeight: 600, color: '#fff', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaignTitle || '—'}</p>
                                                            </td>

                                                            {/* Brand → Influencer */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <p style={{ fontSize: 12, color: '#a78bfa' }}>{c.brandName || '—'}</p>
                                                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>→ {c.influencerName || '—'}</p>
                                                            </td>

                                                            {/* Status */}
                                                            <td style={{ padding: '14px 16px' }}><Badge label={c.status} map={statusColors} /></td>

                                                            {/* Budget */}
                                                            <td style={{ padding: '14px 16px', color: c.agreedPrice ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                                {c.agreedPrice ? `$${c.agreedPrice.toLocaleString()}` : '—'}
                                                            </td>

                                                            {/* Date */}
                                                            <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                                                {new Date(c.createdAt).toLocaleDateString()}
                                                            </td>

                                                            {/* Request code */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.04)', padding: '3px 7px', borderRadius: 6 }}>{c.requestCode}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
