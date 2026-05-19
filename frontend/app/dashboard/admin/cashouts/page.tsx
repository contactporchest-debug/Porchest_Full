'use client';

import { Fragment, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    BadgeInfo,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock3,
    Image as ImageIcon,
    Loader2,
    Search,
    ShieldAlert,
    XCircle,
    Wallet,
} from 'lucide-react';

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
        easypaisaNumber?: string;
        easypaisaScreenshotUrl?: string;
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
    cardStrong: 'rgba(255,255,255,0.48)',
};

const labels: Record<CashoutStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#d97706', bg: 'rgba(245,158,11,0.10)' },
    approved: { label: 'Cleared', color: '#059669', bg: 'rgba(16,185,129,0.10)' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: 'rgba(239,68,68,0.10)' },
};

function money(value: number) {
    return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({
    label,
    value,
    helper,
    icon,
    tint,
}: {
    label: string;
    value: string;
    helper?: string;
    icon: ReactNode;
    tint: string;
}) {
    return (
        <div
            style={{
                padding: '22px',
                borderRadius: '14px',
                border: `1px solid ${COLORS.border}`,
                background: COLORS.card,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(194,52,10,0.04)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${tint}14`,
                        border: `1px solid ${tint}22`,
                        color: tint,
                    }}
                >
                    {icon}
                </div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: COLORS.brown, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            </div>
            <p style={{ fontSize: '32px', lineHeight: 1, fontWeight: 800, color: COLORS.ink, letterSpacing: '-0.04em' }}>{value}</p>
            {helper && <p style={{ marginTop: '8px', fontSize: '13px', color: COLORS.brown }}>{helper}</p>}
        </div>
    );
}

function Panel({
    title,
    subtitle,
    icon,
    children,
}: {
    title: string;
    subtitle?: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section
            style={{
                borderRadius: '18px',
                border: `1px solid ${COLORS.border}`,
                background: COLORS.card,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(194,52,10,0.04)',
                padding: '28px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(194,52,10,0.10)',
                        border: '1px solid rgba(194,52,10,0.18)',
                        color: COLORS.rust,
                    }}
                >
                    {icon}
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: COLORS.ink }}>{title}</h2>
                    {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: COLORS.brown }}>{subtitle}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

export default function AdminCashoutsPage() {
    const [loading, setLoading] = useState(true);
    const [cashouts, setCashouts] = useState<Cashout[]>([]);
    const [search, setSearch] = useState('');
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
            return (
                cashout.cashoutCode.toLowerCase().includes(q) ||
                influencer.toLowerCase().includes(q) ||
                cashout.status.toLowerCase().includes(q) ||
                String(cashout.amount || '').includes(q)
            );
        });
    }, [cashouts, search]);

    const pendingCashouts = useMemo(() => filtered.filter((item) => item.status === 'pending'), [filtered]);
    const clearedCashouts = useMemo(() => filtered.filter((item) => item.status === 'approved'), [filtered]);

    const totalSent = useMemo(() => cashouts.filter((item) => item.status === 'approved').reduce((sum, item) => sum + Number(item.amount || 0), 0), [cashouts]);
    const totalToSend = useMemo(() => cashouts.filter((item) => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount || 0), 0), [cashouts]);

    const review = async (id: string, status: 'approved' | 'rejected') => {
        const reason = status === 'rejected' ? window.prompt('Rejection reason') || undefined : undefined;
        const transactionId = status === 'approved' ? window.prompt('Transaction ID (optional)') || undefined : undefined;

        setReviewingId(id);
        try {
            await adminAPI.reviewCashout(id, status, { rejectionReason: reason, transactionId });
            toast.success(status === 'approved' ? 'Cashout cleared' : 'Cashout rejected');
            setExpandedId(null);
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
                            Review pending Easypaisa payouts, inspect payout details, and track amounts already cleared to influencers.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <StatCard label="Total sent" value={money(totalSent)} helper="Approved and cleared cashouts" icon={<CheckCircle2 size={18} />} tint="#059669" />
                        <StatCard label="Need to send" value={money(totalToSend)} helper="Pending cashouts waiting for review" icon={<Clock3 size={18} />} tint="#d97706" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', maxWidth: 460, width: '100%' }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.brown }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by code, influencer, status, or amount"
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
                            {pendingCashouts.length} pending
                        </div>
                    </div>

                    <Panel
                        title="Pending cashouts"
                        subtitle="These are the amounts admin still needs to clear."
                        icon={<Wallet size={18} />}
                    >
                        {pendingCashouts.length === 0 ? (
                            <EmptyState
                                title="No pending cashouts"
                                description="Once influencers request payouts, the list will appear here with their Easypaisa details."
                            />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left' }}>
                                            <Th>Cashout</Th>
                                            <Th>Influencer</Th>
                                            <Th>Amount</Th>
                                            <Th>Requested</Th>
                                            <Th>Actions</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingCashouts.map((cashout) => {
                                            const label = labels[cashout.status];
                                            const influencerName = cashout.influencer?.fullName || cashout.influencer?.instagramUsername || 'Unknown influencer';
                                            const isExpanded = expandedId === cashout._id;
                                            return (
                                                <Fragment key={cashout._id}>
                                                    <tr>
                                                        <Td>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: 800, color: COLORS.ink }}>{cashout.cashoutCode}</span>
                                                                <span style={{ fontSize: 12, color: COLORS.brown }}>{label.label}</span>
                                                            </div>
                                                        </Td>
                                                        <Td>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: 800, color: COLORS.ink }}>{influencerName}</span>
                                                                <span style={{ fontSize: 12, color: COLORS.brown }}>{cashout.influencer?.instagramUsername || cashout.influencer?.email || '—'}</span>
                                                            </div>
                                                        </Td>
                                                        <Td style={{ fontWeight: 800, color: COLORS.rust }}>{money(cashout.amount)}</Td>
                                                        <Td>{formatDate(cashout.requestedAt || cashout.createdAt)}</Td>
                                                        <Td>
                                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                                <button onClick={() => setExpandedId(isExpanded ? null : cashout._id)} style={outlineButtonStyle}>
                                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                    View details
                                                                </button>
                                                                <button onClick={() => review(cashout._id, 'approved')} disabled={reviewingId === cashout._id} style={actionButtonStyle('approve')}>
                                                                    <CheckCircle2 size={14} />
                                                                    Clear
                                                                </button>
                                                                <button onClick={() => review(cashout._id, 'rejected')} disabled={reviewingId === cashout._id} style={actionButtonStyle('reject')}>
                                                                    <XCircle size={14} />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </Td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={5} style={{ padding: 0 }}>
                                                                <div style={{ marginTop: -2, marginBottom: 12, padding: 18, borderRadius: 16, border: `1px solid ${COLORS.border}`, background: COLORS.cardStrong }}>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                                                                        <InfoCard label="Easypaisa number" value={cashout.influencer?.easypaisaNumber || '—'} />
                                                                        <InfoCard
                                                                            label="Screenshot"
                                                                            value={cashout.influencer?.easypaisaScreenshotUrl ? 'Attached' : 'Not attached'}
                                                                            icon={cashout.influencer?.easypaisaScreenshotUrl ? <ImageIcon size={14} /> : <BadgeInfo size={14} />}
                                                                        />
                                                                        <InfoCard label="Profile photo" value={cashout.influencer?.profilePictureUrl ? 'Available' : 'Not available'} />
                                                                    </div>
                                                                    {cashout.influencer?.easypaisaScreenshotUrl && (
                                                                        <div style={{ marginTop: 14 }}>
                                                                            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: COLORS.ink }}>Attached screenshot</p>
                                                                            <img
                                                                                src={cashout.influencer.easypaisaScreenshotUrl}
                                                                                alt="Influencer Easypaisa screenshot"
                                                                                style={{ width: '100%', maxWidth: 420, borderRadius: 12, border: `1px solid ${COLORS.border}`, objectFit: 'cover' }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>

                    <Panel
                        title="Cleared cashouts"
                        subtitle="These amounts have already been approved and sent."
                        icon={<CheckCircle2 size={18} />}
                    >
                        {clearedCashouts.length === 0 ? (
                            <EmptyState
                                title="No cleared cashouts"
                                description="Once admin approves a payout, it will show here in the cleared table."
                            />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left' }}>
                                            <Th>Cashout</Th>
                                            <Th>Influencer</Th>
                                            <Th>Amount</Th>
                                            <Th>Transaction ID</Th>
                                            <Th>Cleared</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clearedCashouts.map((cashout) => {
                                            const influencerName = cashout.influencer?.fullName || cashout.influencer?.instagramUsername || 'Unknown influencer';
                                            return (
                                                <tr key={cashout._id}>
                                                    <Td>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 800, color: COLORS.ink }}>{cashout.cashoutCode}</span>
                                                            <span style={{ fontSize: 12, color: COLORS.brown }}>{formatDate(cashout.requestedAt || cashout.createdAt)}</span>
                                                        </div>
                                                    </Td>
                                                    <Td>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 800, color: COLORS.ink }}>{influencerName}</span>
                                                            <span style={{ fontSize: 12, color: COLORS.brown }}>{cashout.influencer?.instagramUsername || cashout.influencer?.email || '—'}</span>
                                                        </div>
                                                    </Td>
                                                    <Td style={{ fontWeight: 800, color: COLORS.rust }}>{money(cashout.amount)}</Td>
                                                    <Td style={{ fontFamily: 'monospace', fontSize: 13, color: COLORS.brown }}>{cashout.transactionId || '—'}</Td>
                                                    <Td>{formatDate(cashout.reviewedAt || cashout.createdAt)}</Td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>
                </motion.div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div style={{ padding: '36px', borderRadius: '18px', border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            <Clock3 size={32} style={{ margin: '0 auto 10px', color: 'rgba(194,52,10,0.35)' }} />
            <p style={{ margin: 0, fontWeight: 800, color: COLORS.ink }}>{title}</p>
            <p style={{ margin: '6px 0 0', color: COLORS.brown, fontSize: 13 }}>{description}</p>
        </div>
    );
}

function InfoCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
}) {
    return (
        <div style={{ padding: 16, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: 'rgba(255,255,255,0.52)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.brown, display: 'flex', alignItems: 'center', gap: 6 }}>
                {icon}
                {label}
            </p>
            <p style={{ margin: '8px 0 0', fontWeight: 800, color: COLORS.ink, wordBreak: 'break-word' }}>{value}</p>
        </div>
    );
}

function Th({ children, style }: { children: ReactNode; style?: CSSProperties }) {
    return (
        <th style={{ padding: '0 14px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.brown, ...style }}>
            {children}
        </th>
    );
}

function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
    return (
        <td
            style={{
                padding: '14px',
                background: COLORS.cardStrong,
                borderTop: `1px solid ${COLORS.border}`,
                borderBottom: `1px solid ${COLORS.border}`,
                color: COLORS.ink,
                verticalAlign: 'top',
                ...style,
            }}
        >
            {children}
        </td>
    );
}

function actionButtonStyle(kind: 'approve' | 'reject'): CSSProperties {
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

function outlineButtonStyle(): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        background: 'rgba(255,255,255,0.60)',
        color: COLORS.brown,
        fontSize: 13,
        fontWeight: 800,
        padding: '10px 14px',
        cursor: 'pointer',
    };
}
