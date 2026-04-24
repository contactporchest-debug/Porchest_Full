'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
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
    const s = map[label] || { bg: 'rgba(148,163,184,0.12)', color: '#667085' };
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
        style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 22, padding: '22px 24px', position: 'relative', overflow: 'hidden', boxShadow: '0 18px 40px rgba(15,23,42,0.06)' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 22px 0 80px', background: `${color}08` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                {icon}
            </div>
        </div>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color, letterSpacing: '-0.04em', filter: `drop-shadow(0 0 8px ${color}50)` }}>{value}</p>
        <p style={{ fontSize: 12, color: '#667085', marginTop: 4 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color, opacity: 0.65, marginTop: 3 }}>{sub}</p>}
        {progress != null && (
            <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: 'rgba(148,163,184,0.18)' }}>
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
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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

    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

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
            const r = await adminAPI.getCampaigns(params);
            setCampaigns(r.data.campaigns || []);
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

        const handleCampaignUpdate = ({ campaignId, status }: { campaignId: string, status: Campaign['status'] }) => {
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

    const handleCampaignStatus = async (id: string, status: 'running' | 'paused' | 'completed') => {
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
        return (!q || c.name?.toLowerCase().includes(q) || c.brand?.companyName?.toLowerCase().includes(q))
            && (!campStatus || c.status === campStatus);
    });

    /* ── Render ─────────────────────────────────────────── */
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>



                    <AnimatePresence mode="wait">

                        {activeTab === 'users' && (
                            <motion.div key="users" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                                {/* Filters */}
                                <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                                        <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or email..."
                                            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 12, background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(148,163,184,0.22)', color: '#172033', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                        style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(148,163,184,0.22)', color: '#475467', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                                        <option value="">All Roles</option>
                                        <option value="brand">Brand</option>
                                        <option value="influencer">Influencer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                        style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(148,163,184,0.22)', color: '#475467', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
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
                                <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 18px 40px rgba(15,23,42,0.05)' }}>
                                    <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(148,163,184,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#172033' }}>All Users ({users.length})</h2>
                                    </div>

                                    {loading ? (
                                        <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#ff8c42' }} /></div>
                                    ) : users.length === 0 ? (
                                        <div style={{ padding: 60, textAlign: 'center', color: '#667085', fontSize: 14 }}>No users found</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.16)' }}>
                                                        {['User', 'Role', 'Status', 'Profile', 'Joined', 'Actions'].map(h => (
                                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#7a8798', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.map((u) => (
                                                        <tr key={u._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.12)', transition: 'background 150ms', cursor: 'pointer' }}
                                                            onClick={() => setSelectedUser(u)}
                                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(123,63,242,0.04)'}
                                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                                                            {/* User */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    {u.instagramProfilePicture ? (
                                                                        <img src={u.instagramProfilePicture} alt={u.companyName || u.fullName || ''} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                                            {(u.companyName || u.fullName || u.email || '?')[0]?.toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{u.role === 'brand' ? u.companyName : u.fullName || '—'}</p>
                                                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.instagramHandle ? `@${u.instagramHandle}` : u.email}</p>
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
                                                                        <button onClick={(e) => { e.stopPropagation(); setEditRoleId(u._id); }} title="Change role"
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
                                                                {u.role === 'admin' ? (
                                                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>—</span>
                                                                ) : (
                                                                    <span style={{ fontSize: 11, color: u.profileCompletionStatus ? '#4ade80' : '#fbbf24' }}>
                                                                        {u.profileCompletionStatus ? '✓ Complete' : '○ Incomplete'}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Joined */}
                                                            <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                                                {new Date(u.createdAt).toLocaleDateString()}
                                                            </td>

                                                            {/* Actions */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                {u.role !== 'admin' && (
                                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleStatus(u._id, 'active'); }} title="Approve / Activate"
                                                                            disabled={actioningUser === u._id}
                                                                            style={{ padding: '6px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', cursor: 'pointer' }}>
                                                                            <UserCheck size={13} />
                                                                        </button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleStatus(u._id, 'suspended'); }} title="Suspend"
                                                                            disabled={actioningUser === u._id}
                                                                            style={{ padding: '6px', borderRadius: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', cursor: 'pointer' }}>
                                                                            <UserX size={13} />
                                                                        </button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(u._id); }} title="Delete user"
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
                                {selectedUser && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                                        onClick={() => setSelectedUser(null)}
                                    >
                                        <motion.div
                                            initial={{ y: 20, scale: 0.95 }}
                                            animate={{ y: 0, scale: 1 }}
                                            exit={{ y: 20, scale: 0.95 }}
                                            style={{ background: '#12101d', padding: 30, borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', width: '90%', maxWidth: 500 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 20 }}>User Details</h2>
                                            {selectedUser.instagramProfilePicture && <img src={selectedUser.instagramProfilePicture} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 20px' }} />}
                                            <p><strong>Name:</strong> {selectedUser.role === 'brand' ? selectedUser.companyName : selectedUser.fullName}</p>
                                            <p><strong>Email:</strong> {selectedUser.email}</p>
                                            <p><strong>Role:</strong> {selectedUser.role}</p>
                                            <p><strong>Status:</strong> {selectedUser.status}</p>
                                            <p><strong>Instagram:</strong> {selectedUser.instagramHandle ? `@${selectedUser.instagramHandle}` : 'Not linked'}</p>
                                            <button onClick={() => setSelectedUser(null)} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 10, background: '#ff8c42', color: '#fff', border: 'none', cursor: 'pointer' }}>Close</button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

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
                                        <option value="running">Running</option>
                                        <option value="paused">Paused</option>
                                        <option value="completed">Completed</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                    <button onClick={loadCampaigns} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,140,66,0.1)', border: '1px solid rgba(255,140,66,0.2)', color: '#ff8c42', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        <RefreshCw size={12} /> Refresh
                                    </button>
                                </div>

                                {/* Campaigns table */}
                                <div style={{ background: 'rgba(14,12,26,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}>
                                    <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#fff' }}>Campaigns ({filteredCampaigns.length})</h2>
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
                                                        {['Campaign', 'Brand', 'Status', 'Dates', 'Progress', 'Budget', 'Actions'].map(h => (
                                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredCampaigns.map((c) => (
                                                        <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}
                                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                                            onClick={() => setSelectedCampaign(c)}>

                                                            {/* Campaign title */}
                                                            <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                                                                <p style={{ fontWeight: 600, color: '#fff', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || '—'}</p>
                                                            </td>

                                                            {/* Brand */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <p style={{ fontSize: 12, color: '#a78bfa' }}>{c.brand?.companyName || '—'}</p>
                                                            </td>

                                                            {/* Status */}
                                                            <td style={{ padding: '14px 16px' }}><Badge label={c.status} map={statusColors} /></td>

                                                            {/* Dates */}
                                                            <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                                                {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                                                            </td>

                                                            {/* Progress */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                                                                    {c.influencers.filter(i => i.status === 'accepted').length} / {c.influencers.length} influencers
                                                                </div>
                                                            </td>

                                                            {/* Budget */}
                                                            <td style={{ padding: '14px 16px', color: c.budget ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                                {c.budget ? `$${c.budget.toLocaleString()}` : '—'}
                                                            </td>

                                                            {/* Actions */}
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <div style={{ display: 'flex', gap: 6 }}>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleCampaignStatus(c._id, 'paused'); }} title="Pause" style={{ padding: '6px', borderRadius: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', cursor: 'pointer' }}><UserX size={13} /></button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleCampaignStatus(c._id, 'running'); }} title="Resume" style={{ padding: '6px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', cursor: 'pointer' }}><UserCheck size={13} /></button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleCampaignStatus(c._id, 'completed'); }} title="End" style={{ padding: '6px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', cursor: 'pointer' }}><Trash2 size={13} /></button>
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
                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                                        onClick={() => setSelectedCampaign(null)}
                                    >
                                        <motion.div
                                            initial={{ y: 20, scale: 0.95 }}
                                            animate={{ y: 0, scale: 1 }}
                                            exit={{ y: 20, scale: 0.95 }}
                                            style={{ background: '#12101d', padding: 30, borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', width: '90%', maxWidth: 600 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 20 }}>Campaign Details</h2>
                                            <p><strong>Name:</strong> {selectedCampaign.name}</p>
                                            <p><strong>Brand:</strong> {selectedCampaign.brand.companyName}</p>
                                            <p><strong>Status:</strong> {selectedCampaign.status}</p>
                                            <p><strong>Budget:</strong> ${selectedCampaign.budget.toLocaleString()}</p>
                                            <p><strong>Dates:</strong> {new Date(selectedCampaign.startDate).toLocaleDateString()} - {new Date(selectedCampaign.endDate).toLocaleDateString()}</p>
                                            <h3 style={{ marginTop: 20, marginBottom: 10 }}>Influencers</h3>
                                            <ul>
                                                {selectedCampaign.influencers.map(inf => (
                                                    <li key={inf.influencer._id}>{inf.influencer.fullName} - {inf.status}</li>
                                                ))}
                                            </ul>
                                            <button onClick={() => setSelectedCampaign(null)} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 10, background: '#ff8c42', color: '#fff', border: 'none', cursor: 'pointer' }}>Close</button>
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
