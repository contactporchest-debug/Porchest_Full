'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PostVerificationQueue from '@/components/admin/PostVerificationQueue';
import BrandTrackingSetup from '@/components/admin/BrandTrackingSetup';
import { adminAPI } from '@/lib/api';
import { USER_ROLES, isAdminRole } from '@/lib/accessRoles';
import toast from 'react-hot-toast';
import { useSocket } from '@/context/SocketContext';
import {
    Users, Shield, CheckCircle, XCircle, Trash2, Loader2,
    Search, RefreshCw, ChevronDown, Megaphone, LayoutDashboard,
    Clock, TrendingUp, AlertTriangle, UserCheck, UserX, Edit3,
    ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';

/* ─── Types ────────────────────────────────────────────── */
export type Tab = 'users' | 'campaigns';
type UserRole = typeof USER_ROLES[number];
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
    instagramProfilePicture?: string;
    instagramHandle?: string;
}

interface Campaign {
    _id: string;
    name: string;
    brand: { _id: string; companyName: string; };
    influencers: { influencer: { _id: string; fullName: string; }; status: string; }[];
    status: 'running' | 'paused' | 'completed' | 'pending';
    startDate: string;
    endDate: string;
    budget: number;
}

interface AdminCampaignRequest {
    _id: string;
    campaignTitle: string;
    brandName?: string;
    influencerName?: string;
    influencerNiche?: string;
    status: 'sent' | 'viewed' | 'accepted' | 'rejected' | 'deal_closed' | 'expired' | 'cancelled';
    postingDeadline?: string;
    campaignStartDate?: string;
    campaignEndDate?: string;
    agreedPrice?: number;
    createdAt?: string;
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
const statusColors: Record<string, { bg: string; color: string; border: string }> = {
    active:      { bg: 'rgba(194,52,10,0.1)',  color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    pending:     { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', border: 'rgba(245,158,11,0.2)' },
    suspended:   { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
    sent:        { bg: 'rgba(194,52,10,0.1)',  color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    accepted:    { bg: 'rgba(194,52,10,0.1)',  color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    rejected:    { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
    deal_closed: { bg: 'rgba(194,52,10,0.1)', color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    cancelled:   { bg: 'rgba(255,255,255,0.6)', color: '#7A5030', border: '#EDD9BC' },
    expired:     { bg: 'rgba(255,255,255,0.6)', color: '#7A5030', border: '#EDD9BC' },
};
const roleColors: Record<string, { bg: string; color: string; border: string }> = {
    admin:      { bg: 'rgba(194,52,10,0.1)',  color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    'admin-marketing': { bg: 'rgba(194,52,10,0.1)', color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    'admin-software': { bg: 'rgba(194,52,10,0.1)', color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    'employee-marketing': { bg: 'rgba(194,52,10,0.1)', color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    'employee-software': { bg: 'rgba(194,52,10,0.1)', color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    owner:      { bg: 'rgba(194,52,10,0.1)',  color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    brand:      { bg: 'rgba(194,52,10,0.1)',  color: '#C2340A', border: 'rgba(194,52,10,0.2)' },
    influencer: { bg: 'rgba(194,52,10,0.08)',  color: '#7A5030', border: 'rgba(194,52,10,0.16)' },
    'software-client': { bg: 'rgba(194,52,10,0.08)', color: '#7A5030', border: 'rgba(194,52,10,0.16)' },
};

/* ─── Shared tiny components ───────────────────────────── */
const Badge = ({ label, map }: { label: string; map: Record<string, { bg: string; color: string; border: string }> }) => {
    const s = map[label] || { bg: 'rgba(255,255,255,0.6)', color: '#7A5030', border: '#EDD9BC' };
    return (
        <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {label}
        </span>
    );
};

const StatCard = ({ label, value, sub, color, icon, progress }: {
    label: string; value: string | number; sub?: string;
    color: string; icon: React.ReactNode; progress?: number;
}) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid #EDD9BC', borderRadius: 24, padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,10,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.8)', border: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                {icon}
            </div>
            <p style={{ fontSize: 13, color: '#7A5030', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        </div>
        <p style={{ fontWeight: 800, fontSize: '32px', color: '#1A0A00', letterSpacing: '-0.02em' }}>{value}</p>
        {sub && <p style={{ fontSize: 13, color: '#C4A882', fontWeight: 500, marginTop: 4 }}>{sub}</p>}
        {progress != null && (
            <div style={{ marginTop: 16, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, progress)}%`, background: color, transition: 'width 700ms ease' }} />
            </div>
        )}
    </motion.div>
);

/* ─── Main Component ────────────────────────────────────── */
export function AdminDashboardView({ initialTab = 'users' }: { initialTab?: Tab }) {
    const { socket } = useSocket();
    const [stats,   setStats]   = useState<Stats | null>(null);
    const [users,   setUsers]   = useState<AdminUser[]>([]);
    const [campaigns, setCampaigns] = useState<AdminCampaignRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const activeTab = initialTab;

    // Users tab state
    const [userSearch,     setUserSearch]     = useState('');
    const [roleFilter,     setRoleFilter]     = useState('');
    const [statusFilter,   setStatusFilter]   = useState('');
    const [actioningUser,  setActioningUser]  = useState<string | null>(null);
    const [editRoleId,     setEditRoleId]     = useState<string | null>(null);
    const [selectedUser,   setSelectedUser]   = useState<AdminUser | null>(null);

    // Campaigns tab state
    const [campSearch,  setCampSearch]  = useState('');
    const [campStatus,  setCampStatus]  = useState('');
    const [campLoading, setCampLoading] = useState(false);

    const [selectedCampaign, setSelectedCampaign] = useState<AdminCampaignRequest | null>(null);

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

    useEffect(() => {
        if (!socket) return;

        const handleUserUpdate = (updatedUser: AdminUser) => {
            setUsers(prev => prev.map(u => u._id === updatedUser._id ? { ...u, ...updatedUser } : u));
            toast.success(`User ${updatedUser.fullName || updatedUser.email} was updated.`);
        };

        const handleCampaignUpdate = ({ campaignId, status }: { campaignId: string, status: AdminCampaignRequest['status'] }) => {
            setCampaigns(prev => prev.map(c => c._id === campaignId ? { ...c, status } : c));
            toast.success(`A campaign status was updated to ${status}.`);
        };

        socket.on('user-updated', handleUserUpdate);
        socket.on('campaign-status-update', handleCampaignUpdate);

        return () => {
            socket.off('user-updated', handleUserUpdate);
            socket.off('campaign-status-update', handleCampaignUpdate);
        };
    }, [socket]);

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

    const handleCampaignStatus = async (id: string, status: 'deal_closed' | 'cancelled' | 'accepted') => {
        try {
            await adminAPI.updateCampaignStatus(id, status);
            toast.success(`Campaign status updated to ${status}`);
            setCampaigns(prev => prev.map(c => c._id === id ? { ...c, status } : c));
        } catch {
            toast.error('Failed to update campaign status');
        }
    };

    /* ── Derived ────────────────────────────────────────── */
    const filteredCampaigns = campaigns.filter(c => {
        const q = campSearch.toLowerCase();
        return (!q || c.campaignTitle?.toLowerCase().includes(q) || c.brandName?.toLowerCase().includes(q) || c.influencerName?.toLowerCase().includes(q))
            && (!campStatus || c.status === campStatus);
    });

    const inputStyle = {
        padding: '12px 16px 12px 40px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid #EDD9BC',
        color: '#1A0A00',
        fontSize: '14px',
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box' as const,
        width: '100%',
        transition: 'border-color 0.2s',
    };

    const selectStyle = {
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid #EDD9BC',
        color: '#1A0A00',
        fontSize: '14px',
        fontFamily: 'inherit',
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    /* ── Render ─────────────────────────────────────────── */
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <AnimatePresence mode="wait">

                        {activeTab === 'users' && (
                            <motion.div key="users" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* Filters */}
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#C4A882' }} />
                                        <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or email..."
                                            style={inputStyle} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                                    </div>
                                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                        style={selectStyle} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}>
                                        <option value="">All Roles</option>
                                        <option value="brand">Brand</option>
                                        <option value="influencer">Influencer</option>
                                        <option value="software-client">Software Client</option>
                                        <option value="admin-marketing">Admin Marketing</option>
                                        <option value="admin-software">Admin Software</option>
                                        <option value="employee-marketing">Employee Marketing</option>
                                        <option value="employee-software">Employee Software</option>
                                        <option value="owner">Owner</option>
                                    </select>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                        style={selectStyle} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}>
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                    <button onClick={loadUsers} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.8)', border: '1px solid #EDD9BC', color: '#1A0A00', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fff'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}>
                                        <RefreshCw size={16} /> Refresh
                                    </button>
                                </div>

                                {/* Users table */}
                                <div style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid #EDD9BC', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,10,0,0.02)' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.4)' }}>
                                        <h2 style={{ fontWeight: 800, fontSize: 16, color: '#1A0A00' }}>All Users ({users.length})</h2>
                                    </div>

                                    {loading ? (
                                        <div style={{ padding: 64, textAlign: 'center' }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#C2340A' }} /></div>
                                    ) : users.length === 0 ? (
                                        <div style={{ padding: 80, textAlign: 'center', color: '#7A5030', fontSize: 15, fontWeight: 500 }}>No users found</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.2)' }}>
                                                        {['User', 'Role', 'Status', 'Profile', 'Joined', 'Actions'].map(h => (
                                                            <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.map((u) => (
                                                        <tr key={u._id} style={{ borderBottom: '1px solid #EDD9BC', transition: 'background 150ms', cursor: 'pointer' }}
                                                            onClick={() => setSelectedUser(u)}
                                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)'}
                                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                                                            {/* User */}
                                                            <td style={{ padding: '16px 24px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                    {u.instagramProfilePicture ? (
                                                                        <img src={u.instagramProfilePicture} alt={u.companyName || u.fullName || ''} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#C2340A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                                                                            {(u.companyName || u.fullName || u.email || '?')[0]?.toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p style={{ fontWeight: 700, color: '#1A0A00', fontSize: 14 }}>{u.role === 'brand' ? u.companyName : u.fullName || '—'}</p>
                                                                        <p style={{ fontSize: 13, color: '#7A5030', marginTop: 2 }}>{u.instagramHandle ? `@${u.instagramHandle}` : u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Role — with inline change dropdown */}
                                                            <td style={{ padding: '16px 24px' }}>
                                                                {editRoleId === u._id ? (
                                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                                                        <select defaultValue={u.role}
                                                                            onChange={e => handleRoleChange(u._id, e.target.value as UserRole)}
                                                                            onBlur={() => setEditRoleId(null)}
                                                                            autoFocus
                                                                            style={{ padding: '6px 12px', borderRadius: 8, background: '#fff', border: '1px solid #EDD9BC', color: '#1A0A00', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                                                                            <option value="brand">Brand</option>
                                                                            <option value="influencer">Influencer</option>
                                                                            <option value="software-client">Software Client</option>
                                                                            <option value="admin-marketing">Admin Marketing</option>
                                                                            <option value="admin-software">Admin Software</option>
                                                                            <option value="employee-marketing">Employee Marketing</option>
                                                                            <option value="employee-software">Employee Software</option>
                                                                            <option value="owner">Owner</option>
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <Badge label={u.role} map={roleColors} />
                                                                        <button onClick={(e) => { e.stopPropagation(); setEditRoleId(u._id); }} title="Change role"
                                                                            style={{ padding: 6, background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', borderRadius: 8, cursor: 'pointer', color: '#7A5030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <Edit3 size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Status */}
                                                            <td style={{ padding: '16px 24px' }}><Badge label={u.status} map={statusColors} /></td>

                                                            {/* Profile completion */}
                                                            <td style={{ padding: '16px 24px' }}>
                                                                {isAdminRole(u.role) ? (
                                                                    <span style={{ fontSize: 12, color: '#C4A882', fontWeight: 600 }}>—</span>
                                                                ) : (
                                                                    <span style={{ fontSize: 12, fontWeight: 700, color: u.profileCompletionStatus ? '#C2340A' : '#d97706', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                        {u.profileCompletionStatus ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                                                        {u.profileCompletionStatus ? 'Complete' : 'Incomplete'}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Joined */}
                                                            <td style={{ padding: '16px 24px', color: '#7A5030', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                                {new Date(u.createdAt).toLocaleDateString()}
                                                            </td>

                                                            {/* Actions */}
                                                            <td style={{ padding: '16px 24px' }}>
                                                                {!isAdminRole(u.role) && (
                                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleStatus(u._id, 'active'); }} title="Approve / Activate"
                                                                            disabled={actioningUser === u._id}
                                                                            style={{ padding: '8px', borderRadius: 8, background: 'rgba(194,52,10,0.1)', border: '1px solid rgba(194,52,10,0.18)', color: '#C2340A', cursor: 'pointer', transition: 'all 0.15s' }}
                                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(194,52,10,0.16)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(194,52,10,0.1)'}>
                                                                            <UserCheck size={16} />
                                                                        </button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleStatus(u._id, 'suspended'); }} title="Suspend"
                                                                            disabled={actioningUser === u._id}
                                                                            style={{ padding: '8px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#d97706', cursor: 'pointer', transition: 'all 0.15s' }}
                                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}>
                                                                            <UserX size={16} />
                                                                        </button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(u._id); }} title="Delete user"
                                                                            style={{ padding: '8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', cursor: 'pointer', transition: 'all 0.15s' }}
                                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                                                                            <Trash2 size={16} />
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
                                {selectedUser && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
                                        onClick={() => setSelectedUser(null)}
                                    >
                                        <motion.div
                                            initial={{ y: 20, scale: 0.95 }}
                                            animate={{ y: 0, scale: 1 }}
                                            exit={{ y: 20, scale: 0.95 }}
                                            style={{ background: '#FDF6EE', padding: 32, borderRadius: 24, border: '1px solid #EDD9BC', width: '100%', maxWidth: 500, boxShadow: '0 24px 60px rgba(26,10,0,0.1)' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h2 style={{ fontWeight: 800, fontSize: 24, color: '#1A0A00', marginBottom: 24 }}>User Details</h2>
                                            {selectedUser.instagramProfilePicture && <img src={selectedUser.instagramProfilePicture} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 24px', display: 'block' }} />}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
                                                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1A0A00' }}>{selectedUser.role === 'brand' ? selectedUser.companyName : selectedUser.fullName}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#1A0A00' }}>{selectedUser.email}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</span>
                                                    <Badge label={selectedUser.role} map={roleColors} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                                                    <Badge label={selectedUser.status} map={statusColors} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instagram</span>
                                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#C2340A' }}>{selectedUser.instagramHandle ? `@${selectedUser.instagramHandle}` : 'Not linked'}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedUser(null)} style={{ marginTop: 32, width: '100%', padding: '14px', borderRadius: 12, background: '#C2340A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, transition: 'background-color 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#E8400A'} onMouseLeave={e => e.currentTarget.style.background = '#C2340A'}>Close Details</button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'campaigns' && (
                            <motion.div key="campaigns" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                <div>
                                    <PostVerificationQueue />
                                </div>

                                <div>
                                    <BrandTrackingSetup />
                                </div>

                                {/* Filters */}
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#C4A882' }} />
                                        <input value={campSearch} onChange={e => setCampSearch(e.target.value)} placeholder="Search campaign, brand, influencer..."
                                            style={inputStyle} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                                    </div>
                                    <select value={campStatus} onChange={e => setCampStatus(e.target.value)}
                                        style={selectStyle} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}>
                                        <option value="">All Statuses</option>
                                        <option value="sent">Sent</option>
                                        <option value="viewed">Viewed</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="deal_closed">Closed</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button onClick={loadCampaigns} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.8)', border: '1px solid #EDD9BC', color: '#1A0A00', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fff'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}>
                                        <RefreshCw size={16} /> Refresh
                                    </button>
                                </div>

                                {/* Campaigns table */}
                                <div style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid #EDD9BC', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,10,0,0.02)' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.4)' }}>
                                        <h2 style={{ fontWeight: 800, fontSize: 16, color: '#1A0A00' }}>Campaigns ({filteredCampaigns.length})</h2>
                                    </div>

                                    {campLoading ? (
                                        <div style={{ padding: 64, textAlign: 'center' }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#C2340A' }} /></div>
                                    ) : filteredCampaigns.length === 0 ? (
                                        <div style={{ padding: 80, textAlign: 'center', color: '#7A5030', fontSize: 15, fontWeight: 500 }}>No campaigns found</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.2)' }}>
                                                        {['Campaign', 'Brand', 'Influencer', 'Status', 'Dates', 'Budget', 'Actions'].map(h => (
                                                            <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredCampaigns.map((c) => (
                                                        <tr key={c._id} style={{ borderBottom: '1px solid #EDD9BC', transition: 'background 150ms', cursor: 'pointer' }}
                                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)'}
                                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                                            onClick={() => setSelectedCampaign(c)}>

                                                            {/* Campaign title */}
                                                            <td style={{ padding: '16px 24px', maxWidth: 220 }}>
                                                                <p style={{ fontWeight: 700, color: '#1A0A00', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaignTitle || '—'}</p>
                                                            </td>

                                                            {/* Brand */}
                                                            <td style={{ padding: '16px 24px' }}>
                                                                <p style={{ fontSize: 13, fontWeight: 600, color: '#C2340A' }}>{c.brandName || '—'}</p>
                                                            </td>

                                                            {/* Influencer */}
                                                            <td style={{ padding: '16px 24px' }}>
                                                                <div>
                                                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A0A00' }}>{c.influencerName || '—'}</p>
                                                                    <p style={{ fontSize: 12, color: '#7A5030', marginTop: 2 }}>{c.influencerNiche || '—'}</p>
                                                                </div>
                                                            </td>

                                                            {/* Status */}
                                                            <td style={{ padding: '16px 24px' }}><Badge label={c.status} map={statusColors} /></td>

                                                            {/* Dates */}
                                                            <td style={{ padding: '16px 24px', color: '#7A5030', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                                {(c.campaignStartDate || c.createdAt) ? new Date(c.campaignStartDate || c.createdAt || '').toLocaleDateString() : '—'}
                                                                {' - '}
                                                                {c.campaignEndDate ? new Date(c.campaignEndDate).toLocaleDateString() : (c.postingDeadline ? new Date(c.postingDeadline).toLocaleDateString() : '—')}
                                                            </td>

                                                            {/* Budget */}
                                                            <td style={{ padding: '16px 24px', color: c.agreedPrice ? '#C2340A' : '#C4A882', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                                {c.agreedPrice ? `$${(c.agreedPrice || 0).toLocaleString()}` : '—'}
                                                            </td>

                                                            {/* Actions */}
                                                            <td style={{ padding: '16px 24px' }}>
                                                                <div style={{ display: 'flex', gap: 8 }}>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleCampaignStatus(c._id, 'accepted'); }} title="Mark Accepted" style={{ padding: '8px', borderRadius: 8, background: 'rgba(194,52,10,0.1)', border: '1px solid rgba(194,52,10,0.18)', color: '#C2340A', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(194,52,10,0.16)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(194,52,10,0.1)'}><UserCheck size={16} /></button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleCampaignStatus(c._id, 'deal_closed'); }} title="Close Deal" style={{ padding: '8px', borderRadius: 8, background: 'rgba(194,52,10,0.1)', border: '1px solid rgba(194,52,10,0.18)', color: '#7A5030', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(194,52,10,0.16)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(194,52,10,0.1)'}><CheckCircle size={16} /></button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleCampaignStatus(c._id, 'cancelled'); }} title="Cancel" style={{ padding: '8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}><Trash2 size={16} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                {selectedCampaign && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
                                        onClick={() => setSelectedCampaign(null)}
                                    >
                                        <motion.div
                                            initial={{ y: 20, scale: 0.95 }}
                                            animate={{ y: 0, scale: 1 }}
                                            exit={{ y: 20, scale: 0.95 }}
                                            style={{ background: '#FDF6EE', padding: 32, borderRadius: 24, border: '1px solid #EDD9BC', width: '100%', maxWidth: 600, boxShadow: '0 24px 60px rgba(26,10,0,0.1)' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h2 style={{ fontWeight: 800, fontSize: 24, color: '#1A0A00', marginBottom: 24 }}>Campaign Details</h2>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
                                                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1A0A00' }}>{selectedCampaign.campaignTitle}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand</span>
                                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#C2340A' }}>{selectedCampaign.brandName || '—'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Influencer</span>
                                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#1A0A00' }}>{selectedCampaign.influencerName || '—'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                                                    <Badge label={selectedCampaign.status} map={statusColors} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget</span>
                                                    <span style={{ fontSize: 15, fontWeight: 700, color: '#C2340A' }}>{selectedCampaign.agreedPrice ? `$${(selectedCampaign.agreedPrice || 0).toLocaleString()}` : '—'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dates</span>
                                                    <span style={{ fontSize: 15, fontWeight: 500, color: '#1A0A00' }}>{(selectedCampaign.campaignStartDate || selectedCampaign.createdAt) ? new Date(selectedCampaign.campaignStartDate || selectedCampaign.createdAt || '').toLocaleDateString() : '—'} - {selectedCampaign.campaignEndDate ? new Date(selectedCampaign.campaignEndDate).toLocaleDateString() : (selectedCampaign.postingDeadline ? new Date(selectedCampaign.postingDeadline).toLocaleDateString() : '—')}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedCampaign(null)} style={{ marginTop: 32, width: '100%', padding: '14px', borderRadius: 12, background: '#C2340A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, transition: 'background-color 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#E8400A'} onMouseLeave={e => e.currentTarget.style.background = '#C2340A'}>Close Details</button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

export default function AdminDashboardPage() {
    return <AdminDashboardView initialTab="users" />;
}
