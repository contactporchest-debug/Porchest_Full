'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownCircle, CheckCircle2, Clock3, DollarSign, History, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { influencerAPI } from '@/lib/api';

type CashoutStatus = 'pending' | 'approved' | 'rejected';

interface EarningsSummary {
    lifetimeTotal: number;
    totalPaid: number;
    totalPending: number;
    availableForCashout: number;
    pendingCashoutsTotal?: number;
    approvedCashoutsTotal?: number;
}

interface Cashout {
    _id: string;
    amount: number;
    status: CashoutStatus;
    transactionId?: string | null;
    requestedAt?: string;
    createdAt: string;
    reviewedAt?: string;
    processedAt?: string;
    rejectionReason?: string;
}

interface PayoutRow {
    _id: string;
    title: string;
    source: string;
    amount: number;
    status: string;
    createdAt: string;
    paidAmount: number;
    pendingAmount: number;
}

const colors = {
    ink: '#1A0A00',
    rust: '#C2340A',
    flame: '#E8400A',
    amber: '#FF6B1A',
    brown: '#7A5030',
    cream: '#FDF6EE',
    border: '#EDD9BC',
    card: 'rgba(255,255,255,0.35)',
    cardStrong: 'rgba(255,255,255,0.48)',
};

const cashoutLabels: Record<CashoutStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#d97706', bg: 'rgba(245,158,11,0.10)' },
    approved: { label: 'Approved', color: '#059669', bg: 'rgba(16,185,129,0.10)' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: 'rgba(239,68,68,0.10)' },
};

function money(value: number) {
    return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
                border: `1px solid ${colors.border}`,
                background: colors.card,
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
                <p style={{ fontSize: '11px', fontWeight: 700, color: colors.brown, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            </div>
            <p style={{ fontSize: '32px', lineHeight: 1, fontWeight: 800, color: colors.ink, letterSpacing: '-0.04em' }}>{value}</p>
            {helper && <p style={{ marginTop: '8px', fontSize: '13px', color: colors.brown }}>{helper}</p>}
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
                border: `1px solid ${colors.border}`,
                background: colors.card,
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
                        color: colors.rust,
                    }}
                >
                    {icon}
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.ink }}>{title}</h2>
                    {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.brown }}>{subtitle}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

export default function EarningsPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [summary, setSummary] = useState<EarningsSummary | null>(null);
    const [cashouts, setCashouts] = useState<Cashout[]>([]);
    const [recentPayouts, setRecentPayouts] = useState<PayoutRow[]>([]);
    const [cashoutAmount, setCashoutAmount] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const [earningsRes, cashoutsRes] = await Promise.all([
                influencerAPI.getEarnings(),
                influencerAPI.getCashouts(),
            ]);

            setSummary(earningsRes.data.summary);
            setCashouts(cashoutsRes.data.cashouts || []);
            setRecentPayouts(earningsRes.data.payoutHistory || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load earnings data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const available = summary?.availableForCashout ?? 0;

    const handleCashout = async () => {
        const amount = Number(cashoutAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error('Enter a valid cashout amount');
            return;
        }
        if (amount > available) {
            toast.error(`Amount exceeds available balance of ${money(available)}`);
            return;
        }

        setSubmitting(true);
        try {
            await influencerAPI.cashout(amount);
            toast.success('Cashout request submitted');
            setCashoutAmount('');
            await load();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Cashout request failed');
        } finally {
            setSubmitting(false);
        }
    };

    const cashoutPreview = useMemo(() => {
        const amount = Number(cashoutAmount);
        if (!Number.isFinite(amount) || amount <= 0) return null;
        return Math.max(0, available - amount);
    }, [available, cashoutAmount]);

    if (loading) {
        return (
            <div style={{ minHeight: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: colors.rust, animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '12px', color: colors.brown, fontSize: '14px' }}>Loading earnings…</p>
                </div>
            </div>
        );
    }

    const safeSummary: EarningsSummary = summary || {
        lifetimeTotal: 0,
        totalPaid: 0,
        totalPending: 0,
        availableForCashout: 0,
        pendingCashoutsTotal: 0,
        approvedCashoutsTotal: 0,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                color: colors.ink,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.rust }}>
                    Influencer earnings
                </p>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', color: colors.ink }}>
                    Track payouts and request withdrawals
                </h1>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: colors.brown, maxWidth: 720 }}>
                    Your balance is built from released campaign payouts. Cashout requests move through admin review and are confirmed by email and in-app notifications.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                <StatCard label="Lifetime value" value={money(safeSummary.lifetimeTotal)} helper="All campaign value tracked so far" icon={<TrendingUp size={18} />} tint={colors.rust} />
                <StatCard label="Paid earnings" value={money(safeSummary.totalPaid)} helper="Released and available payouts" icon={<CheckCircle2 size={18} />} tint="#059669" />
                <StatCard label="Pending earnings" value={money(safeSummary.totalPending)} helper="Contract value not released yet" icon={<Clock3 size={18} />} tint="#d97706" />
                <StatCard label="Available now" value={money(safeSummary.availableForCashout)} helper="Can be requested for withdrawal" icon={<DollarSign size={18} />} tint="#0284c7" />
            </div>

            <Panel
                title="Request cashout"
                subtitle="Submit a withdrawal request for your available balance."
                icon={<ArrowDownCircle size={18} />}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '14px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: colors.brown, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Withdrawal amount
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: colors.brown, fontWeight: 700 }}>$</span>
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={cashoutAmount}
                                onChange={(e) => setCashoutAmount(e.target.value)}
                                placeholder="0.00"
                                style={{
                                    width: '100%',
                                    padding: '13px 14px 13px 30px',
                                    borderRadius: '12px',
                                    border: `1px solid ${colors.border}`,
                                    background: 'rgba(255,255,255,0.60)',
                                    outline: 'none',
                                    color: colors.ink,
                                    fontSize: '15px',
                                    fontWeight: 700,
                                }}
                            />
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: colors.brown }}>
                            Available balance: <strong style={{ color: colors.rust }}>{money(available)}</strong>
                            {cashoutPreview != null ? ` • Remaining after request: ${money(cashoutPreview)}` : ''}
                        </p>
                    </div>

                    <button
                        onClick={handleCashout}
                        disabled={submitting || available <= 0}
                        style={{
                            height: '48px',
                            padding: '0 22px',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 700,
                            background: available <= 0 ? 'rgba(255,255,255,0.7)' : `linear-gradient(135deg, ${colors.rust}, ${colors.flame})`,
                            boxShadow: available <= 0 ? 'none' : '0 14px 28px rgba(194,52,10,0.16)',
                            cursor: available <= 0 ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.75 : 1,
                            minWidth: '170px',
                        }}
                    >
                        {submitting ? 'Submitting...' : 'Request cashout'}
                    </button>
                </div>
            </Panel>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '14px' }}>
                <Panel
                    title="Payout history"
                    subtitle="Released campaign payouts collected from your collaborations."
                    icon={<History size={18} />}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentPayouts.length === 0 ? (
                            <EmptyState title="No payouts yet" description="Released payouts from verified campaigns will appear here." />
                        ) : (
                            recentPayouts.slice(0, 6).map((row) => (
                                <div
                                    key={row._id}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '14px',
                                        border: `1px solid ${colors.border}`,
                                        background: colors.cardStrong,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '16px',
                                    }}
                                >
                                    <div>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: colors.ink }}>{row.title}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.brown }}>
                                            {row.source} • {new Date(row.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontWeight: 800, fontSize: '16px', color: colors.rust }}>{money(row.amount)}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.brown }}>
                                            {row.pendingAmount > 0 ? `Pending ${money(row.pendingAmount)}` : 'Fully released'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Panel>

                <Panel
                    title="Cashout requests"
                    subtitle="Your withdrawal requests and admin decisions."
                    icon={<Sparkles size={18} />}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cashouts.length === 0 ? (
                            <EmptyState title="No cashouts yet" description="Once you submit a withdrawal request, the status trail will appear here." />
                        ) : (
                            cashouts.slice(0, 6).map((cashout) => {
                                const label = cashoutLabels[cashout.status];
                                return (
                                    <div
                                        key={cashout._id}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '14px',
                                            border: `1px solid ${colors.border}`,
                                            background: colors.cardStrong,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: colors.ink }}>{money(cashout.amount)}</p>
                                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.brown }}>
                                                    Requested {new Date(cashout.requestedAt || cashout.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '999px',
                                                    background: label.bg,
                                                    border: `1px solid ${label.color}28`,
                                                    color: label.color,
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.06em',
                                                }}
                                            >
                                                {label.label}
                                            </span>
                                        </div>
                                        {cashout.transactionId && (
                                            <p style={{ margin: '10px 0 0', fontSize: '12px', color: colors.brown }}>
                                                Transaction: <span style={{ fontFamily: 'monospace' }}>{cashout.transactionId}</span>
                                            </p>
                                        )}
                                        {cashout.rejectionReason && (
                                            <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#9f1239' }}>{cashout.rejectionReason}</p>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Panel>
            </div>
        </motion.div>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div
            style={{
                padding: '22px',
                borderRadius: '14px',
                border: `1px dashed ${colors.border}`,
                background: 'rgba(255,255,255,0.28)',
                textAlign: 'center',
            }}
        >
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: colors.ink }}>{title}</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: colors.brown, lineHeight: 1.65 }}>{description}</p>
        </div>
    );
}
