'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Users, Shield, CheckCircle, XCircle, Trash2,
    TrendingUp, Loader2, Link2, FileText, Clock,
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: [0.23, 1, 0.32, 1] } }),
};

type Tab = 'overview' | 'users' | 'verifications';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [reviewing, setReviewing] = useState<string | null>(null);

    const loadStats = useCallback(async () => {
        try {
            const res = await adminAPI.getStats();
            setStats(res.data.stats);
        } catch { toast.error('Failed to load stats'); }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const res = await adminAPI.getUsers();
            setUsers(res.data.users || []);
        } catch { toast.error('Failed to load users'); }
    }, []);

    const loadVerifications = useCallback(async () => {
        try {
            const res = await adminAPI.getVerificationQueue('pending');
            setVerifications(res.data.verifications || []);
        } catch { toast.error('Failed to load verification queue'); }
    }, []);

    useEffect(() => {
        Promise.all([loadStats(), loadUsers(), loadVerifications()]).finally(() => setLoading(false));
    }, [loadStats, loadUsers, loadVerifications]);

    const handleUserStatus = async (userId: string, status: string) => {
        try {
            await adminAPI.updateUserStatus(userId, status);
            toast.success(`User ${status}`);
            loadUsers();
        } catch { toast.error('Action failed'); }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try {
            await adminAPI.deleteUser(userId);
            toast.success('User deleted');
            loadUsers();
            loadStats();
        } catch { toast.error('Delete failed'); }
    };

    const handleReview = async (id: string, status: 'verified' | 'rejected') => {
        const note = status === 'rejected' ? prompt('Rejection reason (optional)') || '' : '';
        setReviewing(id);
        try {
            await adminAPI.reviewVerification(id, status, note);
            toast.success(status === 'verified' ? '✅ Verification approved!' : 'Submission rejected');
            setVerifications(prev => prev.filter(v => v._id !== id));
            loadStats();
        } catch { toast.error('Review failed'); } finally { setReviewing(null); }
    };

    const TABS: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'users', label: 'Users' },
        { key: 'verifications', label: `Verification Queue${stats?.pendingVerifications ? ` (${stats.pendingVerifications})` : ''}` },
    ];

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ maxWidth: '1200px' }}>
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 13px', borderRadius: '99px', background: 'rgba(255,140,66,0.1)', border: '1px solid rgba(255,140,66,0.25)', marginBottom: '12px' }}>
                            <Shield size={11} style={{ color: '#ff8c42' }} />
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#ff8c42', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Portal</span>
                        </div>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#fff', letterSpacing: '-0.03em', marginBottom: '5px' }}>
                            Platform <span style={{ background: 'linear-gradient(90deg,#ff8c42,#ff5f1f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Control Center</span>
                        </h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Manage users and review influencer content verification requests.</p>
                    </motion.div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '4px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)}
                                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', transition: 'all 180ms ease', whiteSpace: 'nowrap', background: activeTab === t.key ? 'rgba(255,140,66,0.15)' : 'transparent', color: activeTab === t.key ? '#ff8c42' : 'rgba(255,255,255,0.4)' }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* ── OVERVIEW ── */}
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px', marginBottom: '24px' }}>
                                    {[
                                        { label: 'Total Users', val: stats?.totalUsers ?? '—', color: '#7B3FF2', sub: `${stats?.totalBrands ?? 0} brands · ${stats?.totalInfluencers ?? 0} influencers` },
                                        { label: 'Total Requests', val: stats?.totalRequests ?? '—', color: '#A855F7', sub: 'Campaign requests sent' },
                                        { label: 'Pending Verifications', val: stats?.pendingVerifications ?? '—', color: '#fbbf24', sub: 'Awaiting admin review' },
                                        { label: 'Pending Users', val: stats?.pendingUsers ?? '—', color: '#60d5f8', sub: 'Awaiting approval' },
                                    ].map((s, i) => (
                                        <motion.div key={s.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}
                                            className="glass-card" style={{ padding: '22px', borderRadius: '22px' }}>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2rem', color: s.color, letterSpacing: '-0.04em', filter: `drop-shadow(0 0 10px ${s.color}50)` }}>{loading ? '—' : s.val}</p>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '5px' }}>{s.label}</p>
                                            <p style={{ fontSize: '11px', color: s.color, marginTop: '6px', opacity: 0.65 }}>{s.sub}</p>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="glass-card" style={{ padding: '26px', borderRadius: '26px' }}>
                                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff', marginBottom: '18px' }}>Platform Composition</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                                        {[
                                            { label: 'Admins', count: stats?.totalAdmins ?? 0, color: '#ff8c42' },
                                            { label: 'Brands', count: stats?.totalBrands ?? 0, color: '#7B3FF2' },
                                            { label: 'Influencers', count: stats?.totalInfluencers ?? 0, color: '#A855F7' },
                                        ].map(r => (
                                            <div key={r.label} style={{ padding: '18px', borderRadius: '16px', background: `${r.color}08`, border: `1px solid ${r.color}20`, textAlign: 'center' }}>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2rem', color: r.color }}>{r.count}</p>
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{r.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── USERS ── */}
                        {activeTab === 'users' && (
                            <motion.div key="users" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                                className="glass-card" style={{ borderRadius: '26px', overflow: 'hidden' }}>
                                <div style={{ padding: '18px 26px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff' }}>All Users ({users.length})</h2>
                                </div>
                                {loading ? <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} /></div>
                                    : users.length === 0
                                        ? <div style={{ padding: '50px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No users registered yet</div>
                                        : (
                                            <table className="data-table">
                                                <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                                                <tbody>
                                                    {users.map((u: any) => (
                                                        <tr key={u._id}>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                                                                        {(u.companyName || u.fullName || u.email || '?')[0]?.toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontWeight: '600', color: '#fff', fontSize: '13px' }}>{u.companyName || u.fullName || '—'}</p>
                                                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td><span className={`badge ${u.role === 'admin' ? 'badge-yellow' : u.role === 'brand' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span></td>
                                                            <td><span className={`badge ${u.status === 'active' ? 'badge-green' : u.status === 'suspended' ? 'badge-red' : 'badge-yellow'}`}>{u.status}</span></td>
                                                            <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                                            <td>
                                                                {u.role !== 'admin' && (
                                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                                        <button onClick={() => handleUserStatus(u._id, 'active')} title="Approve" style={{ padding: '5px', borderRadius: '7px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', cursor: 'pointer' }}><CheckCircle size={13} /></button>
                                                                        <button onClick={() => handleUserStatus(u._id, 'suspended')} title="Suspend" style={{ padding: '5px', borderRadius: '7px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', cursor: 'pointer' }}><XCircle size={13} /></button>
                                                                        <button onClick={() => handleDeleteUser(u._id)} title="Delete" style={{ padding: '5px', borderRadius: '7px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', cursor: 'pointer' }}><Trash2 size={13} /></button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                            </motion.div>
                        )}

                        {/* ── VERIFICATION QUEUE ── */}
                        {activeTab === 'verifications' && (
                            <motion.div key="verifications" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff', marginBottom: '4px' }}>Verification Queue</h2>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Review influencer-submitted Instagram posts. Approve to sync data to brand dashboards.</p>
                                </div>

                                {loading ? <div style={{ textAlign: 'center', padding: '50px' }}><Loader2 size={28} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} /></div>
                                    : verifications.length === 0
                                        ? (
                                            <div className="glass-card" style={{ padding: '60px', borderRadius: '26px', textAlign: 'center' }}>
                                                <CheckCircle size={44} style={{ color: 'rgba(74,222,128,0.35)', margin: '0 auto 16px' }} />
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '6px' }}>Queue Empty</p>
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No pending verification submissions. All reviewed!</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                <AnimatePresence>
                                                    {verifications.map((v: any, i: number) => {
                                                        const req = v.campaignRequestId;
                                                        const inf = v.influencerId;
                                                        const brand = v.brandId;
                                                        return (
                                                            <motion.div key={v._id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, scale: 0.96 }}
                                                                transition={{ delay: i * 0.06, duration: 0.35 }}
                                                                className="glass-card" style={{ padding: '24px 28px', borderRadius: '26px', border: '1px solid rgba(251,191,36,0.12)' }}>

                                                                {/* Pulsing pending dot */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24', animation: 'pulse 2s infinite' }} />
                                                                    <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>Pending Review</span>
                                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>{new Date(v.createdAt).toLocaleDateString()}</span>
                                                                </div>

                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '10px', marginBottom: '16px' }}>
                                                                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Influencer</p>
                                                                        <p style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>{inf?.fullName || '—'}</p>
                                                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{inf?.email}</p>
                                                                    </div>
                                                                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand</p>
                                                                        <p style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>{brand?.companyName || '—'}</p>
                                                                    </div>
                                                                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campaign</p>
                                                                        <p style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>{req?.campaignTitle || '—'}</p>
                                                                        <p style={{ fontSize: '11px', color: '#a78bfa' }}>${req?.agreedPrice?.toLocaleString()}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Post URL */}
                                                                <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(96,213,248,0.05)', border: '1px solid rgba(96,213,248,0.15)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', wordBreak: 'break-all' }}>
                                                                    <Link2 size={12} style={{ color: '#60d5f8', flexShrink: 0 }} />
                                                                    <a href={v.postUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#60d5f8', textDecoration: 'none' }}>{v.postUrl}</a>
                                                                </div>

                                                                {/* Actions */}
                                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                                    <button onClick={() => handleReview(v._id, 'verified')} disabled={reviewing === v._id}
                                                                        style={{ flex: 1, padding: '11px', borderRadius: '13px', background: reviewing === v._id ? 'rgba(74,222,128,0.1)' : 'linear-gradient(135deg,#16a34a,#4ade80)', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: '700', cursor: reviewing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 200ms ease', boxShadow: '0 0 18px rgba(74,222,128,0.25)' }}>
                                                                        {reviewing === v._id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={13} />} Approve & Verify
                                                                    </button>
                                                                    <button onClick={() => handleReview(v._id, 'rejected')} disabled={reviewing === v._id}
                                                                        style={{ padding: '11px 20px', borderRadius: '13px', background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: 'inherit', fontSize: '13px', fontWeight: '600', cursor: reviewing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 200ms ease' }}>
                                                                        <XCircle size={13} /> Reject
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
