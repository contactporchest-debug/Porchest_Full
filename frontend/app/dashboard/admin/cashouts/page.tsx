'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock3, DollarSign, Loader2, Search, ShieldAlert, XCircle } from 'lucide-react';

type CashoutStatus = 'pending' | 'approved' | 'rejected';

interface Cashout {
    _id: string;
    amount: number;
    status: CashoutStatus;
    cashoutCode: string;
    transactionId?: string | null;
    createdAt: string;
    requestedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    influencer?: {
        fullName?: string;
        instagramUsername?: string;
        profilePictureUrl?: string;
        email?: string;
    } | null;
}

const COLORS = {
    ink: '#1A0A00',
    rust: '#C2340A',
    flame: '#E8400A',
    brown: '#7A5030',
    cream: '#FDF6EE',
    border: '#EDD9BC',
    card: 'rgba(255,255,255,0.35)',
};

const labels: Record<CashoutStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#d97706', bg: 'rgba(245,158,11,0.10)' },
    approved: { label: 'Approved', color: '#059669', bg: 'rgba(16,185,129,0.10)' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: 'rgba(239,68,68,0.10)' },
};

function money(value: number) {
    return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminCashoutsPage() {
    const [loading, setLoading] = useState(true);
    const [cashouts, setCashouts] = useState<Cashout[]>([]);
    const [search, setSearch] = useState('');
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getCashouts({ status: 'all' });
            setCashouts(res.data.cashouts || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load cashouts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return cashouts;
        return cashouts.filter((cashout) => {
            const influencer = cashout.influencer?.fullName || cashout.influencer?.instagramUsername || '';
            return cashout.cashoutCode.toLowerCase().includes(q) || influencer.toLowerCase().includes(q) || cashout.status.toLowerCase().includes(q);
        });
    }, [cashouts, search]);

    const review = async (id: string, status: 'approved' | 'rejected') => {
        const reason = status === 'rejected' ? window.prompt('Rejection reason') || undefined : undefined;
        const transactionId = status === 'approved' ? window.prompt('Transaction ID (optional)') || undefined : undefined;

        setReviewingId(id);
        try {
            await adminAPI.reviewCashout(id, status, { rejectionReason: reason, transactionId });
            toast.success(status === 'approved' ? 'Cashout approved' : 'Cashout rejected');
            await load();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Review failed');
        } finally {
            setReviewingId(null);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                    <div style={{ minHeight: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={32} style={{ color: COLORS.rust, animation: 'spin 1s linear infinite' }} />
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.rust }}>Admin payouts</p>
                        <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 800, letterSpacing: '-0.04em', color: COLORS.ink }}>Cashout review queue</h1>
                        <p style={{ margin: 0, fontSize: '14px', color: COLORS.brown, lineHeight: 1.7 }}>
                            Review withdrawal requests, confirm transactions, and notify influencers automatically.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', maxWidth: 420, width: '100%' }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.brown }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by code, name, or status"
                                style={{
                                    width: '100%',
                                    padding: '13px 14px 13px 40px',
                                    borderRadius: '12px',
                                    border: `1px solid ${COLORS.border}`,
                                    background: 'rgba(255,255,255,0.60)',
                                    color: COLORS.ink,
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: '999px', border: `1px solid ${COLORS.border}`, background: 'rgba(255,255,255,0.55)', color: COLORS.brown, fontWeight: 700, fontSize: 13 }}>
                            <ShieldAlert size={14} color={COLORS.rust} />
                            {filtered.filter((item) => item.status === 'pending').length} pending
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        {filtered.length === 0 ? (
                            <EmptyState />
                        ) : (
                            filtered.map((cashout) => {
                                const label = labels[cashout.status];
                                const influencerName = cashout.influencer?.fullName || cashout.influencer?.instagramUsername || 'Unknown influencer';
                                return (
                                    <div
                                        key={cashout._id}
                                        style={{
                                            border: `1px solid ${COLORS.border}`,
                                            background: COLORS.card,
                                            borderRadius: '18px',
                                            padding: '20px',
                                            backdropFilter: 'blur(12px)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto',
                                            gap: '16px',
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(194,52,10,0.10)', border: '1px solid rgba(194,52,10,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.rust }}>
                                                    <DollarSign size={18} />
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 800, color: COLORS.ink }}>{money(cashout.amount)}</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.brown }}>
                                                        {influencerName} • {cashout.cashoutCode}
                                                    </p>
                                                </div>
                                            </div>
                                            <p style={{ margin: '8px 0 0', fontSize: 12, color: COLORS.brown }}>
                                                Requested {new Date(cashout.requestedAt || cashout.createdAt).toLocaleString()}
                                            </p>
                                            {cashout.rejectionReason && (
                                                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9f1239' }}>{cashout.rejectionReason}</p>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '999px', background: label.bg, border: `1px solid ${label.color}28`, color: label.color, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                                {label.label}
                                            </span>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                {cashout.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => review(cashout._id, 'approved')} disabled={reviewingId === cashout._id} style={buttonStyle('approve')}>
                                                            <CheckCircle2 size={14} />
                                                            Approve
                                                        </button>
                                                        <button onClick={() => review(cashout._id, 'rejected')} disabled={reviewingId === cashout._id} style={buttonStyle('reject')}>
                                                            <XCircle size={14} />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {cashout.transactionId && (
                                                    <span style={{ fontSize: 12, color: COLORS.brown, fontFamily: 'monospace' }}>
                                                        {cashout.transactionId}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

function EmptyState() {
    return (
        <div style={{ padding: '36px', borderRadius: '18px', border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            <Clock3 size={32} style={{ margin: '0 auto 10px', color: 'rgba(194,52,10,0.35)' }} />
            <p style={{ margin: 0, fontWeight: 800, color: COLORS.ink }}>No cashouts found</p>
            <p style={{ margin: '6px 0 0', color: COLORS.brown, fontSize: 13 }}>Withdrawal requests will show up here once influencers submit them.</p>
        </div>
    );
}

function buttonStyle(kind: 'approve' | 'reject'): CSSProperties {
    const isApprove = kind === 'approve';
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        border: `1px solid ${isApprove ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
        background: isApprove ? 'rgba(5,150,105,0.10)' : 'rgba(220,38,38,0.10)',
        color: isApprove ? '#059669' : '#dc2626',
        fontSize: 13,
        fontWeight: 800,
        padding: '10px 14px',
        cursor: 'pointer',
    };
}
