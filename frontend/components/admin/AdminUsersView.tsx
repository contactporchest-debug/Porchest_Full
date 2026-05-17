'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Edit3, Loader2, RefreshCw, Search, Shield, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSocket } from '@/context/SocketContext';
import { adminAPI } from '@/lib/api';
import { USER_ROLES, isAdminRole } from '@/lib/accessRoles';

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

interface Stats {
    totalUsers: number;
    totalBrands: number;
    totalInfluencers: number;
    totalAdmins: number;
    pendingUsers: number;
    pendingVerifications: number;
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
    active: { bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.20)' },
    pending: { bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.20)' },
    suspended: { bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.20)' },
};

const roleColors: Record<string, { bg: string; color: string; border: string }> = {
    admin: { bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.20)' },
    'admin-marketing': { bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.20)' },
    'admin-software': { bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.20)' },
    'employee-marketing': { bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.20)' },
    'employee-software': { bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.20)' },
    owner: { bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.20)' },
    brand: { bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.20)' },
    influencer: { bg: 'rgba(194,52,10,0.08)', color: '#7A5030', border: 'rgba(194,52,10,0.16)' },
    'software-client': { bg: 'rgba(194,52,10,0.08)', color: '#7A5030', border: 'rgba(194,52,10,0.16)' },
};

function Badge({
    label,
    map,
}: {
    label: string;
    map: Record<string, { bg: string; color: string; border: string }>;
}) {
    const style = map[label] || { bg: 'rgba(255,255,255,0.6)', color: '#7A5030', border: '#EDD9BC' };
    return (
        <span
            style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
                whiteSpace: 'nowrap',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
            }}
        >
            {label}
        </span>
    );
}

function StatCard({
    label,
    value,
    sub,
    icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(12px)',
                border: '1px solid #EDD9BC',
                borderRadius: 24,
                padding: '24px',
                boxShadow: '0 4px 20px rgba(26,10,0,0.02)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.8)',
                        border: '1px solid #EDD9BC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#C2340A',
                    }}
                >
                    {icon}
                </div>
                <p style={{ fontSize: 13, color: '#7A5030', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </p>
            </div>
            <p style={{ fontWeight: 800, fontSize: 32, color: '#1A0A00', letterSpacing: '-0.02em' }}>{value}</p>
            {sub && <p style={{ fontSize: 13, color: '#C4A882', fontWeight: 500, marginTop: 4 }}>{sub}</p>}
        </motion.div>
    );
}

export function AdminUsersView() {
    const { socket } = useSocket();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [actioningUser, setActioningUser] = useState<string | null>(null);
    const [editRoleId, setEditRoleId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    const loadStats = useCallback(async () => {
        const r = await adminAPI.getStats();
        setStats(r.data.stats);
    }, []);

    const loadUsers = useCallback(async () => {
        const params: Record<string, unknown> = {};
        if (roleFilter) params.role = roleFilter;
        if (statusFilter) params.status = statusFilter;
        if (userSearch) params.search = userSearch;
        const r = await adminAPI.getUsers(params);
        setUsers(r.data.users || []);
    }, [roleFilter, statusFilter, userSearch]);

    useEffect(() => {
        void loadStats().catch(() => toast.error('Failed to load stats'));
    }, [loadStats]);

    useEffect(() => {
        setUsersLoading(true);
        loadUsers()
            .catch(() => toast.error('Failed to load users'))
            .finally(() => setUsersLoading(false));
    }, [loadUsers]);

    useEffect(() => {
        if (!socket) return;

        const handleUserUpdate = (updatedUser: AdminUser) => {
            setUsers((prev) => prev.map((user) => (user._id === updatedUser._id ? { ...user, ...updatedUser } : user)));
            toast.success(`User ${updatedUser.fullName || updatedUser.email} was updated.`);
        };

        socket.on('user-updated', handleUserUpdate);
        return () => {
            socket.off('user-updated', handleUserUpdate);
        };
    }, [socket]);

    const handleStatus = async (id: string, status: UserStatus) => {
        setActioningUser(id);
        try {
            await adminAPI.updateUserStatus(id, status);
            toast.success(`User updated to ${status}`);
            setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, status } : user)));
            await loadStats();
        } catch {
            toast.error('Action failed');
        } finally {
            setActioningUser(null);
        }
    };

    const handleRoleChange = async (id: string, role: UserRole) => {
        setEditRoleId(null);
        try {
            await adminAPI.updateUserRole(id, role);
            toast.success(`Role changed to ${role}`);
            setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, role } : user)));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Role change failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this user? This cannot be undone.')) return;
        try {
            await adminAPI.deleteUser(id);
            toast.success('User deleted');
            setUsers((prev) => prev.filter((user) => user._id !== id));
            await loadStats();
        } catch {
            toast.error('Delete failed');
        }
    };

    const filteredUsers = users.filter((user) => {
        const q = userSearch.toLowerCase();
        const haystack = [user.email, user.fullName, user.companyName].filter(Boolean).join(' ').toLowerCase();
        return (!q || haystack.includes(q)) && (!roleFilter || user.role === roleFilter) && (!statusFilter || user.status === statusFilter);
    });

    if (usersLoading && users.length === 0 && !stats) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                    <div style={{ minHeight: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={32} style={{ color: '#C2340A', animation: 'spin 1s linear infinite' }} />
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(255,255,255,0.38)',
                            border: '1px solid rgba(255,255,255,0.65)',
                            borderRadius: 14,
                            padding: 24,
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <p style={{ textTransform: 'uppercase', letterSpacing: '0.25em', color: '#7A5030', fontSize: 12, fontWeight: 600 }}>Admin portal</p>
                        <h1 style={{ marginTop: 8, fontSize: 32, fontWeight: 800, color: '#1A0A00' }}>Users</h1>
                        <p style={{ marginTop: 8, color: '#7A5030', lineHeight: 1.7, maxWidth: 760 }}>
                            Manage user accounts, roles, and access. This is now the only admin workspace.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
                        <StatCard label="Total users" value={stats?.totalUsers ?? '—'} icon={<Users size={18} />} />
                        <StatCard label="Brands" value={stats?.totalBrands ?? '—'} icon={<Shield size={18} />} />
                        <StatCard label="Influencers" value={stats?.totalInfluencers ?? '—'} icon={<Users size={18} />} />
                        <StatCard label="Pending users" value={stats?.pendingUsers ?? '—'} icon={<CheckCircle size={18} />} sub="Pending verifications" />
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#C4A882' }} />
                            <input
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 40px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #EDD9BC',
                                    color: '#1A0A00',
                                    fontSize: 14,
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.6)',
                                border: '1px solid #EDD9BC',
                                color: '#1A0A00',
                                fontSize: 14,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="">All roles</option>
                            <option value="brand">Brand</option>
                            <option value="influencer">Influencer</option>
                            <option value="software-client">Software Client</option>
                            <option value="admin-marketing">Admin Marketing</option>
                            <option value="admin-software">Admin Software</option>
                            <option value="employee-marketing">Employee Marketing</option>
                            <option value="employee-software">Employee Software</option>
                            <option value="owner">Owner</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.6)',
                                border: '1px solid #EDD9BC',
                                color: '#1A0A00',
                                fontSize: 14,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <button
                            onClick={() => {
                                void loadUsers();
                                void loadStats();
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '12px 20px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.8)',
                                border: '1px solid #EDD9BC',
                                color: '#1A0A00',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid #EDD9BC', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,10,0,0.02)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.4)' }}>
                            <h2 style={{ fontWeight: 800, fontSize: 16, color: '#1A0A00' }}>All users ({filteredUsers.length})</h2>
                        </div>

                        {usersLoading && filteredUsers.length === 0 ? (
                            <div style={{ padding: 64, textAlign: 'center' }}>
                                <Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#C2340A' }} />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div style={{ padding: 80, textAlign: 'center', color: '#7A5030', fontSize: 15, fontWeight: 500 }}>
                                No users found
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.2)' }}>
                                            {['User', 'Role', 'Status', 'Profile', 'Joined', 'Actions'].map((header) => (
                                                <th key={header} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr
                                                key={user._id}
                                                style={{ borderBottom: '1px solid #EDD9BC', transition: 'background 150ms', cursor: 'pointer' }}
                                                onClick={() => setSelectedUser(user)}
                                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)')}
                                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                            >
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        {user.instagramProfilePicture ? (
                                                            <img src={user.instagramProfilePicture} alt={user.companyName || user.fullName || ''} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#C2340A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                                                                {(user.companyName || user.fullName || user.email || '?')[0]?.toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p style={{ fontWeight: 700, color: '#1A0A00', fontSize: 14 }}>{user.role === 'brand' ? user.companyName : user.fullName || '—'}</p>
                                                            <p style={{ fontSize: 13, color: '#7A5030', marginTop: 2 }}>{user.instagramHandle ? `@${user.instagramHandle}` : user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td style={{ padding: '16px 24px' }}>
                                                    {editRoleId === user._id ? (
                                                        <select
                                                            defaultValue={user.role}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => handleRoleChange(user._id, e.target.value as UserRole)}
                                                            onBlur={() => setEditRoleId(null)}
                                                            autoFocus
                                                            style={{ padding: '6px 12px', borderRadius: 8, background: '#fff', border: '1px solid #EDD9BC', color: '#1A0A00', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
                                                        >
                                                            <option value="brand">Brand</option>
                                                            <option value="influencer">Influencer</option>
                                                            <option value="software-client">Software Client</option>
                                                            <option value="admin-marketing">Admin Marketing</option>
                                                            <option value="admin-software">Admin Software</option>
                                                            <option value="employee-marketing">Employee Marketing</option>
                                                            <option value="employee-software">Employee Software</option>
                                                            <option value="owner">Owner</option>
                                                        </select>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Badge label={user.role} map={roleColors} />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditRoleId(user._id);
                                                                }}
                                                                title="Change role"
                                                                style={{ padding: 6, background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', borderRadius: 8, cursor: 'pointer', color: '#7A5030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <Edit3 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>

                                                <td style={{ padding: '16px 24px' }}>
                                                    <Badge label={user.status} map={statusColors} />
                                                </td>

                                                <td style={{ padding: '16px 24px' }}>
                                                    {isAdminRole(user.role) ? (
                                                        <span style={{ fontSize: 12, color: '#C4A882', fontWeight: 600 }}>—</span>
                                                    ) : (
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: user.profileCompletionStatus ? '#C2340A' : '#d97706', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            {user.profileCompletionStatus ? <CheckCircle size={14} /> : <Users size={14} />}
                                                            {user.profileCompletionStatus ? 'Complete' : 'Incomplete'}
                                                        </span>
                                                    )}
                                                </td>

                                                <td style={{ padding: '16px 24px', color: '#7A5030', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>

                                                <td style={{ padding: '16px 24px' }}>
                                                    {!isAdminRole(user.role) && (
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleStatus(user._id, 'active');
                                                                }}
                                                                title="Approve / Activate"
                                                                disabled={actioningUser === user._id}
                                                                style={{ padding: '8px', borderRadius: 8, background: 'rgba(194,52,10,0.1)', border: '1px solid rgba(194,52,10,0.18)', color: '#C2340A', cursor: 'pointer' }}
                                                            >
                                                                <UserCheck size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleStatus(user._id, 'suspended');
                                                                }}
                                                                title="Suspend"
                                                                disabled={actioningUser === user._id}
                                                                style={{ padding: '8px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#d97706', cursor: 'pointer' }}
                                                            >
                                                                <UserX size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleDelete(user._id);
                                                                }}
                                                                title="Delete user"
                                                                style={{ padding: '8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', cursor: 'pointer' }}
                                                            >
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
                            style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
                            onClick={() => setSelectedUser(null)}
                        >
                            <motion.div
                                initial={{ y: 20, scale: 0.95 }}
                                animate={{ y: 0, scale: 1 }}
                                style={{ background: '#FDF6EE', padding: 32, borderRadius: 24, border: '1px solid #EDD9BC', width: '100%', maxWidth: 500, boxShadow: '0 24px 60px rgba(26,10,0,0.1)' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 style={{ fontWeight: 800, fontSize: 24, color: '#1A0A00', marginBottom: 24 }}>User details</h2>
                                {selectedUser.instagramProfilePicture && <img src={selectedUser.instagramProfilePicture} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 24px', display: 'block' }} />}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <DetailRow label="Name" value={selectedUser.role === 'brand' ? selectedUser.companyName : selectedUser.fullName || '—'} />
                                    <DetailRow label="Email" value={selectedUser.email} />
                                    <DetailRow label="Role" value={<Badge label={selectedUser.role} map={roleColors} />} />
                                    <DetailRow label="Status" value={<Badge label={selectedUser.status} map={statusColors} />} />
                                    <DetailRow label="Instagram" value={selectedUser.instagramHandle ? `@${selectedUser.instagramHandle}` : 'Not linked'} tone={selectedUser.instagramHandle ? '#C2340A' : '#7A5030'} />
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    style={{ marginTop: 32, width: '100%', padding: '14px', borderRadius: 12, background: '#C2340A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}
                                >
                                    Close details
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

function DetailRow({
    label,
    value,
    tone = '#1A0A00',
}: {
    label: string;
    value: React.ReactNode;
    tone?: string;
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #EDD9BC', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: tone, textAlign: 'right' }}>{value}</span>
        </div>
    );
}

export default AdminUsersView;
