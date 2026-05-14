'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { influencerAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Clock3,
    DollarSign,
    RefreshCw,
    PieChart as PieChartIcon,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Collaboration = {
    _id: string;
    status: string;
    campaignTitle?: string;
    brandName?: string;
    influencerName?: string;
    agreedPrice?: number;
    pricing?: {
        agreedFee?: number;
        brandOffer?: number;
        influencerCounter?: number;
    };
    payment?: {
        status?: string;
        portion1?: { amount?: number; releasedAt?: string | null; status?: string };
        portion2?: { amount?: number; releasedAt?: string | null; status?: string };
    };
    firstPayoutAmount?: number;
    secondPayoutAmount?: number;
    firstPayoutReleasedAt?: string | null;
    secondPayoutReleasedAt?: string | null;
    campaignEndAt?: string;
    campaignEndDate?: string;
    postingDeadline?: string;
    campaignCompletedAt?: string;
    brandVerifiedPost?: boolean;
    adminVerifiedPost?: boolean;
    metrics?: {
        clicks?: number;
        visits?: number;
        conversions?: number;
        revenue?: number;
        reach?: number;
        impressions?: number;
        engagementRate?: number;
        roas?: number;
        cpa?: number;
        lastUpdatedAt?: string;
    };
};

const SURFACE = 'rgba(255,255,255,0.42)';
const SURFACE_ALT = 'rgba(255,255,255,0.62)';
const BORDER = '#EDD9BC';
const TEXT = '#1A0A00';
const MUTED = '#7A5030';
const PRIMARY = '#C2340A';

const STATUS_COLORS: Record<string, string> = {
    pending: '#0284c7',
    viewed: '#0ea5e9',
    countered: '#d97706',
    negotiation: '#d97706',
    brand_payment_pending: '#b45309',
    brand_paid_work_can_start: '#059669',
    campaign_active: '#059669',
    content_submitted: '#0284c7',
    content_approved: '#0284c7',
    posted: '#d97706',
    completed: '#059669',
    deal_closed: '#059669',
    declined: '#dc2626',
    cancelled: '#dc2626',
    expired: '#6b7280',
};

function money(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `$${Number(value).toLocaleString()}`;
}

function pct(value?: number | null, digits = 1) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Number(value).toFixed(digits)}%`;
}

function daysRemaining(date?: string) {
    if (!date) return null;
    const ms = new Date(date).getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function getDeadline(collab: Collaboration) {
    return collab.campaignEndAt || collab.campaignEndDate || collab.postingDeadline || null;
}

function getPayoutReceived(collab: Collaboration) {
    const first = Number(collab.firstPayoutAmount ?? collab.payment?.portion1?.amount ?? 0);
    const second = Number(collab.secondPayoutAmount ?? collab.payment?.portion2?.amount ?? 0);
    const firstReleased = Boolean(collab.firstPayoutReleasedAt || collab.payment?.portion1?.releasedAt || collab.payment?.portion1?.status === 'released');
    const secondReleased = Boolean(collab.secondPayoutReleasedAt || collab.payment?.portion2?.releasedAt || collab.payment?.portion2?.status === 'released');
    return {
        first: firstReleased ? first : 0,
        second: secondReleased ? second : 0,
        total: (firstReleased ? first : 0) + (secondReleased ? second : 0),
        pending: (!firstReleased ? first : 0) + (!secondReleased ? second : 0),
        firstReleased,
        secondReleased,
    };
}

function SectionCard({ title, subtitle, children, icon }: { title: string; subtitle?: string; children: ReactNode; icon?: ReactNode }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: 24,
                borderRadius: 24,
                border: '1px solid rgba(194,52,10,0.12)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,248,241,0.95) 100%)',
                boxShadow: '0 24px 60px rgba(124,63,34,0.08)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT }}>{title}</p>
                    {subtitle && <p style={{ margin: '6px 0 0', fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{subtitle}</p>}
                </div>
                {icon && <div style={{ color: '#C4A882' }}>{icon}</div>}
            </div>
            {children}
        </motion.section>
    );
}

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: string }) {
    return (
        <div style={{ borderRadius: 18, border: '1px solid #EDD9BC', background: SURFACE, padding: 18 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C4A882' }}>{label}</p>
            <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: tone }}>{value}</p>
            {hint && <p style={{ margin: '8px 0 0', fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{hint}</p>}
        </div>
    );
}

export default function InfluencerOutcomesPage() {
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadOutcomes = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await influencerAPI.getCollaborations();
            setCollaborations(res.data?.collaborations || []);
            setError(null);
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load campaign outcomes.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadOutcomes();
    }, []);

    const metrics = useMemo(() => {
        const relevant = collaborations.filter((item) => !['declined', 'cancelled'].includes(item.status));
        const active = collaborations.filter((item) => ['brand_payment_pending', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(item.status));
        const completed = collaborations.filter((item) => ['completed', 'deal_closed'].includes(item.status));
        const expired = collaborations.filter((item) => item.status === 'expired');
        const payoutReceived = collaborations.reduce((sum, item) => sum + getPayoutReceived(item).total, 0);
        const payoutPending = collaborations.reduce((sum, item) => sum + getPayoutReceived(item).pending, 0);
        const expected = collaborations.reduce((sum, item) => sum + Number(item.pricing?.agreedFee ?? item.pricing?.brandOffer ?? item.agreedPrice ?? 0), 0);
        const revenue = collaborations.reduce((sum, item) => sum + Number(item.metrics?.revenue || 0), 0);
        const conversions = collaborations.reduce((sum, item) => sum + Number(item.metrics?.conversions || 0), 0);
        const clicks = collaborations.reduce((sum, item) => sum + Number(item.metrics?.clicks || 0), 0);
        const visits = collaborations.reduce((sum, item) => sum + Number(item.metrics?.visits || 0), 0);
        const engagementRate = collaborations.reduce((sum, item) => sum + Number(item.metrics?.engagementRate || 0), 0);
        const avgEngagement = collaborations.length ? engagementRate / collaborations.length : 0;
        const completionRate = collaborations.length ? (completed.length / collaborations.length) * 100 : 0;
        const payoutRate = expected > 0 ? (payoutReceived / expected) * 100 : 0;
        const statusDistribution = Object.entries(
            collaborations.reduce((acc, item) => {
                acc[item.status] = (acc[item.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        )
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        const payoutChart = collaborations
            .filter((item) => ['completed', 'deal_closed', 'posted', 'campaign_active', 'content_submitted', 'content_approved'].includes(item.status))
            .slice(0, 6)
            .map((item) => {
                const payout = getPayoutReceived(item);
                return {
                    name: item.campaignTitle || 'Campaign',
                    Received: payout.total,
                    Pending: payout.pending,
                };
            });
        const expiringSoon = collaborations
            .map((item) => {
                const deadline = getDeadline(item);
                const remaining = deadline ? daysRemaining(deadline) : null;
                return { ...item, deadline, remaining };
            })
            .filter((item) => item.remaining != null && item.remaining <= 7)
            .sort((a, b) => (a.remaining ?? 0) - (b.remaining ?? 0));

        return {
            relevant,
            active,
            completed,
            expired,
            payoutReceived,
            payoutPending,
            expected,
            revenue,
            conversions,
            clicks,
            visits,
            avgEngagement,
            completionRate,
            payoutRate,
            statusDistribution,
            payoutChart,
            expiringSoon,
        };
    }, [collaborations]);

    const pieColors = ['#C2340A', '#E8400A', '#FF8A4C', '#C4A882', '#0ea5e9', '#059669', '#7A5030', '#6b7280'];

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                {loading ? (
                    <div style={{ padding: 24, borderRadius: 16, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.38)', color: MUTED }}>
                        Loading campaign outcomes...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: 24,
                                borderRadius: 24,
                                border: '1px solid rgba(194,52,10,0.12)',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,248,241,0.98) 100%)',
                                boxShadow: '0 24px 60px rgba(124,63,34,0.08)',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(194,52,10,0.08)', border: '1px solid rgba(194,52,10,0.12)', marginBottom: 12 }}>
                                        <Sparkles size={14} style={{ color: PRIMARY }} />
                                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: PRIMARY }}>Campaign outcomes</span>
                                    </div>
                                    <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.04em', fontWeight: 800, color: TEXT }}>
                                        Your collaboration lifecycle
                                    </h1>
                                    <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: MUTED, maxWidth: 820 }}>
                                        See how requests turned into accepted work, what has been posted, what has been paid, and which collaborations are nearing expiration from the influencer side.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => void loadOutcomes(true)}
                                        disabled={refreshing}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            borderRadius: 14,
                                            border: '1px solid #EDD9BC',
                                            background: 'rgba(255,255,255,0.74)',
                                            color: MUTED,
                                            padding: '12px 16px',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
                                        Refresh
                                    </button>
                                    <Link
                                        href="/dashboard/influencer/collaborations"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            borderRadius: 14,
                                            background: PRIMARY,
                                            color: '#fff',
                                            padding: '12px 16px',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        <Users size={14} />
                                        Open collaborations
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {error && (
                            <div style={{ borderRadius: 16, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(254,242,242,0.9)', padding: 16, color: '#991B1B', fontSize: 14 }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                            <StatCard label="Expected earnings" value={money(metrics.expected)} hint="Full contract value across your collaborations." tone={PRIMARY} />
                            <StatCard label="Received so far" value={money(metrics.payoutReceived)} hint="Released payout tranches already paid out." tone="#059669" />
                            <StatCard label="Pending payout" value={money(metrics.payoutPending)} hint="Tranches scheduled but not yet released." tone="#d97706" />
                            <StatCard label="Completion rate" value={pct(metrics.completionRate)} hint="Completed or deal-closed collaborations." tone="#0f766e" />
                            <StatCard label="Payout rate" value={pct(metrics.payoutRate)} hint="Paid amount versus expected contract value." tone="#0284c7" />
                            <StatCard label="Avg engagement" value={pct(metrics.avgEngagement)} hint="Average engagement across collaboration metrics." tone="#7C3AED" />
                        </div>

                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                            <StatCard label="Clicks" value={metrics.clicks.toLocaleString()} hint="Tracked link clicks across campaigns." tone="#C2340A" />
                            <StatCard label="Visits" value={metrics.visits.toLocaleString()} hint="Visits after click-through." tone="#E8400A" />
                            <StatCard label="Conversions" value={metrics.conversions.toLocaleString()} hint="Recorded orders or conversions." tone="#059669" />
                            <StatCard label="Revenue" value={money(metrics.revenue)} hint="Attributed campaign revenue." tone="#0284c7" />
                            <StatCard label="Active work" value={metrics.active.length.toString()} hint="Requests that are now in the execution phase." tone="#b45309" />
                            <StatCard label="Expired" value={metrics.expired.length.toString()} hint="Deadlines that have passed without closure." tone="#6b7280" />
                        </div>

                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            <SectionCard title="Status mix" subtitle="How your requests are moving through the lifecycle." icon={<PieChartIcon size={16} />}>
                                {metrics.statusDistribution.length === 0 ? (
                                    <div style={{ padding: '40px 0', textAlign: 'center', color: MUTED }}>No collaboration data yet.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={metrics.statusDistribution} dataKey="value" nameKey="name" innerRadius={72} outerRadius={108} paddingAngle={3}>
                                                {metrics.statusDistribution.map((entry, index) => (
                                                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </SectionCard>

                            <SectionCard title="Payout timeline" subtitle="Released and pending payout amounts by campaign." icon={<DollarSign size={16} />}>
                                {metrics.payoutChart.length === 0 ? (
                                    <div style={{ padding: '40px 0', textAlign: 'center', color: MUTED }}>No payout history yet.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={metrics.payoutChart} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="Received" fill="#059669" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="Pending" fill="#d97706" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </SectionCard>
                        </div>

                        <SectionCard
                            title="Deadline watch"
                            subtitle="Campaigns due within seven days or already overdue. These are the ones most likely to auto-close."
                            icon={<Clock3 size={16} />}
                        >
                            {metrics.expiringSoon.length === 0 ? (
                                <div style={{ padding: '44px 0', textAlign: 'center', color: MUTED }}>
                                    No deadlines are close right now.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {metrics.expiringSoon.map((item) => {
                                        const remaining = item.remaining ?? 0;
                                        const overdue = remaining < 0;
                                        const payout = getPayoutReceived(item);
                                        return (
                                            <div key={item._id} style={{
                                                display: 'flex',
                                                gap: 14,
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                borderRadius: 16,
                                                border: '1px solid #EDD9BC',
                                                background: SURFACE_ALT,
                                                padding: '14px 16px',
                                            }}>
                                                <div style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 14,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    background: overdue ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.12)',
                                                    color: overdue ? '#dc2626' : '#d97706',
                                                    flexShrink: 0,
                                                }}>
                                                    {overdue ? <AlertCircle size={18} /> : <Clock3 size={18} />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 180 }}>
                                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT }}>{item.campaignTitle || 'Campaign'}</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>
                                                        {item.brandName || 'Brand'} · closes {item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}
                                                    </p>
                                                </div>
                                                <span style={{ padding: '6px 12px', borderRadius: 999, background: overdue ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.12)', color: overdue ? '#dc2626' : '#d97706', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    {overdue ? `Overdue by ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'}` : `${remaining} day${remaining === 1 ? '' : 's'} left`}
                                                </span>
                                                <span style={{ fontSize: 12, color: MUTED }}>
                                                    Paid: {money(payout.total)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Campaign table"
                            subtitle="A compact view of your collaborations, payout state, and verification progress."
                            icon={<CheckCircle2 size={16} />}
                        >
                            {collaborations.length === 0 ? (
                                <div style={{ padding: '44px 0', textAlign: 'center', color: MUTED }}>
                                    No collaborations to display yet.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 10 }}>
                                    {collaborations.map((item) => {
                                        const statusColor = STATUS_COLORS[item.status] || '#7A5030';
                                        const deadline = getDeadline(item);
                                        const remaining = deadline ? daysRemaining(deadline) : null;
                                        const payout = getPayoutReceived(item);
                                        return (
                                            <div key={item._id} style={{
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                                                gap: 12,
                                                alignItems: 'center',
                                                padding: '14px 16px',
                                                borderRadius: 16,
                                                border: '1px solid #EDD9BC',
                                                background: 'rgba(255,255,255,0.68)',
                                            }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT }}>{item.campaignTitle || 'Campaign'}</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>{item.brandName || 'Brand'}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 12, color: MUTED }}>Earnings</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#059669' }}>{money(Number(item.pricing?.agreedFee ?? item.pricing?.brandOffer ?? item.agreedPrice ?? 0))}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 12, color: MUTED }}>Paid</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: TEXT }}>{money(payout.total)}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 12, color: MUTED }}>Deadline</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: TEXT }}>{deadline ? new Date(deadline).toLocaleDateString() : '—'}</p>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: `${statusColor}18`, color: statusColor, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                        {item.status}
                                                    </span>
                                                    <span style={{ fontSize: 12, color: MUTED }}>
                                                        {item.adminVerifiedPost || item.brandVerifiedPost ? 'Verified' : 'Awaiting verification'}
                                                        {remaining != null ? ` · ${remaining < 0 ? `overdue by ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'}` : `${remaining} day${remaining === 1 ? '' : 's'} left`}` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SectionCard>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
