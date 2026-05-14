'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
    AlertCircle,
    BarChart3,
    Clock3,
    RefreshCw,
    PieChart as PieChartIcon,
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
    influencerUsername?: string;
    agreedPrice?: number;
    pricing?: {
        agreedFee?: number;
        brandOffer?: number;
        influencerCounter?: number;
        currency?: string;
    };
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
    campaignEndAt?: string;
    campaignEndDate?: string;
    postingDeadline?: string;
    createdAt?: string;
    campaignCompletedAt?: string;
    adminVerifiedPost?: boolean;
    brandVerifiedPost?: boolean;
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

function getSpend(collab: Collaboration) {
    return Number(collab.pricing?.agreedFee ?? collab.pricing?.brandOffer ?? collab.agreedPrice ?? 0);
}

function getRevenue(collab: Collaboration) {
    return Number(collab.metrics?.revenue ?? 0);
}

function getConversions(collab: Collaboration) {
    return Number(collab.metrics?.conversions ?? 0);
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
        <div style={{
            borderRadius: 18,
            border: '1px solid #EDD9BC',
            background: SURFACE,
            padding: 18,
        }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C4A882' }}>{label}</p>
            <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: tone }}>{value}</p>
            {hint && <p style={{ margin: '8px 0 0', fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{hint}</p>}
        </div>
    );
}

export default function BrandPerformancePage() {
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPerformance = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await brandAPI.getCollaborations();
            setCollaborations(res.data?.collaborations || []);
            setError(null);
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load campaign performance.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadPerformance();
    }, []);

    const metrics = useMemo(() => {
        const spendable = collaborations.filter((item) => !['declined', 'cancelled', 'expired'].includes(item.status));
        const active = collaborations.filter((item) => ['brand_payment_pending', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(item.status));
        const completed = collaborations.filter((item) => ['completed', 'deal_closed'].includes(item.status));
        const expired = collaborations.filter((item) => item.status === 'expired');
        const spend = spendable.reduce((sum, item) => sum + getSpend(item), 0);
        const revenue = collaborations.reduce((sum, item) => sum + getRevenue(item), 0);
        const clicks = collaborations.reduce((sum, item) => sum + Number(item.metrics?.clicks || 0), 0);
        const visits = collaborations.reduce((sum, item) => sum + Number(item.metrics?.visits || 0), 0);
        const conversions = collaborations.reduce((sum, item) => sum + getConversions(item), 0);
        const reach = collaborations.reduce((sum, item) => sum + Number(item.metrics?.reach || 0), 0);
        const impressions = collaborations.reduce((sum, item) => sum + Number(item.metrics?.impressions || 0), 0);
        const total = collaborations.length || 1;
        const completionRate = (completed.length / total) * 100;
        const avgROAS = spend > 0 ? revenue / spend : 0;
        const avgCPA = conversions > 0 ? spend / conversions : 0;
        const ctr = visits > 0 ? (clicks / visits) * 100 : 0;
        const statusDistribution = Object.entries(
            collaborations.reduce((acc, item) => {
                acc[item.status] = (acc[item.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        )
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        const topCampaigns = [...collaborations]
            .sort((a, b) => getRevenue(b) - getRevenue(a) || getSpend(b) - getSpend(a))
            .slice(0, 6)
            .map((item) => ({
                name: item.campaignTitle || 'Campaign',
                Spend: getSpend(item),
                Revenue: getRevenue(item),
            }));
        const expiringSoon = [...collaborations]
            .map((item) => {
                const deadline = getDeadline(item);
                const remaining = deadline ? daysRemaining(deadline) : null;
                return { ...item, deadline, remaining };
            })
            .filter((item) => item.remaining != null && item.remaining <= 7)
            .sort((a, b) => (a.remaining ?? 0) - (b.remaining ?? 0));

        return {
            spend,
            revenue,
            clicks,
            visits,
            conversions,
            reach,
            impressions,
            active,
            completed,
            expired,
            completionRate,
            avgROAS,
            avgCPA,
            ctr,
            statusDistribution,
            topCampaigns,
            expiringSoon,
        };
    }, [collaborations]);

    const pieColors = ['#C2340A', '#E8400A', '#FF8A4C', '#C4A882', '#0ea5e9', '#059669', '#7A5030', '#6b7280'];

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {loading ? (
                    <div style={{ padding: 24, borderRadius: 16, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.38)', color: MUTED }}>
                        Loading campaign performance...
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
                                        <TrendingUp size={14} style={{ color: PRIMARY }} />
                                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: PRIMARY }}>Campaign performance</span>
                                    </div>
                                    <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.04em', fontWeight: 800, color: TEXT }}>
                                        Brand campaign performance dashboard
                                    </h1>
                                    <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: MUTED, maxWidth: 820 }}>
                                        Track spend, revenue, engagement, conversions, and deadline health across every collaboration. The dashboard also surfaces campaigns that are about to be auto-closed by the lifecycle scheduler.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => void loadPerformance(true)}
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
                                        href="/dashboard/brand/collaborations"
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
                                        <BarChart3 size={14} />
                                        Open workflows
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
                            <StatCard label="Committed spend" value={money(metrics.spend)} hint="Allocated across live and completed collaborations." tone={PRIMARY} />
                            <StatCard label="Tracked revenue" value={money(metrics.revenue)} hint="Revenue attributed through tracking links and webhooks." tone="#059669" />
                            <StatCard label="Average ROAS" value={metrics.avgROAS ? `${metrics.avgROAS.toFixed(2)}x` : '—'} hint="Revenue divided by brand spend." tone="#0284c7" />
                            <StatCard label="Completion rate" value={pct(metrics.completionRate)} hint="Completed or deal-closed campaigns out of all collaborations." tone="#0f766e" />
                            <StatCard label="Conversions" value={metrics.conversions.toLocaleString()} hint="Orders or checkout conversions recorded by tracking." tone="#b45309" />
                            <StatCard label="Active campaigns" value={metrics.active.length.toString()} hint="Campaigns currently moving through the delivery flow." tone="#7C3AED" />
                        </div>

                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                            <StatCard label="Clicks" value={metrics.clicks.toLocaleString()} hint="Tracked link clicks." tone="#C2340A" />
                            <StatCard label="Visits" value={metrics.visits.toLocaleString()} hint="Unique visits after click-through." tone="#E8400A" />
                            <StatCard label="Reach" value={metrics.reach.toLocaleString()} hint="Total account reach aggregated across collaborations." tone="#059669" />
                            <StatCard label="Impressions" value={metrics.impressions.toLocaleString()} hint="Total campaign impressions." tone="#0284c7" />
                            <StatCard label="Avg CPA" value={metrics.avgCPA ? money(metrics.avgCPA) : '—'} hint="Spend divided by conversions." tone="#d97706" />
                            <StatCard label="CTR" value={pct(metrics.ctr)} hint="Clicks divided by visits." tone="#6b7280" />
                        </div>

                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            <SectionCard title="Status mix" subtitle="How your collaborations are distributed across the lifecycle." icon={<PieChartIcon size={16} />}>
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

                            <SectionCard title="Top campaigns" subtitle="Highest revenue campaigns versus their spend." icon={<BarChart3 size={16} />}>
                                {metrics.topCampaigns.length === 0 ? (
                                    <div style={{ padding: '40px 0', textAlign: 'center', color: MUTED }}>No campaign results yet.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={metrics.topCampaigns} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="Spend" fill="#C4A882" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="Revenue" fill={PRIMARY} radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </SectionCard>
                        </div>

                        <SectionCard
                            title="Deadline health"
                            subtitle="Campaigns within seven days of their deadline or already overdue. These are the ones the auto-close scheduler will act on first."
                            icon={<Clock3 size={16} />}
                        >
                            {metrics.expiringSoon.length === 0 ? (
                                <div style={{ padding: '44px 0', textAlign: 'center', color: MUTED }}>
                                    No campaigns are close to auto-close.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {metrics.expiringSoon.map((item) => {
                                        const remaining = item.remaining ?? 0;
                                        const overdue = remaining < 0;
                                        const label = overdue ? `Overdue by ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'}` : `${remaining} day${remaining === 1 ? '' : 's'} left`;
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
                                                        {item.influencerName || item.influencerUsername || 'Influencer'} · closes {item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}
                                                    </p>
                                                </div>
                                                <span style={{ padding: '6px 12px', borderRadius: 999, background: overdue ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.12)', color: overdue ? '#dc2626' : '#d97706', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    {label}
                                                </span>
                                                <span style={{ fontSize: 12, color: MUTED }}>
                                                    Auto-close status: {item.status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Campaign table"
                            subtitle="A compact operational view of your live and completed work."
                            icon={<Users size={16} />}
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
                                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>{item.influencerName || item.influencerUsername || 'Influencer'}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 12, color: MUTED }}>Spend</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: TEXT }}>{money(getSpend(item))}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 12, color: MUTED }}>Revenue</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#059669' }}>{money(getRevenue(item))}</p>
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
                                                        {remaining == null ? 'No auto-close deadline' : remaining < 0 ? `Overdue by ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'}` : `${remaining} day${remaining === 1 ? '' : 's'} left`}
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
