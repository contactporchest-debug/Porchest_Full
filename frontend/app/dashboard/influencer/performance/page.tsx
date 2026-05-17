'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GlassCard, GlowButton } from '@/components/ui';
import { influencerAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { AlertCircle, BarChart3, Clock3, ExternalLink, RefreshCw, TrendingUp, Users } from 'lucide-react';

type PerformanceWindowKey = 'today' | '10days' | '20days' | '30days';

type PerformanceWindowMetrics = {
    days: number;
    label: string;
    windowLabel: string;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagementRate: number;
    views: number;
    impressions: number;
    viewRate: number;
    postsAnalyzed: number;
    postsPerWeek: number;
    totalClicks: number;
    uniqueVisitors: number;
    conversions: number;
    revenue: number;
    roas: number | null;
    cpa: number | null;
    campaignCost: number;
    followersAtPostTime: number;
    hasMatchedMedia: boolean;
    postTimestamp: string | null;
    mediaLink: string | null;
};

type CampaignPerformanceItem = {
    campaignId: string;
    name: string;
    brand: string;
    username: string | null;
    price: number;
    status: string;
    lifecycleStatus: 'requested' | 'accepted' | 'active';
    uploadedMediaLink: string | null;
    trackingLink: string | null;
    promoCode: string | null;
    daysRan: number;
    progressPercent: number;
    mediaMetrics: PerformanceWindowMetrics;
    timeframes: Record<PerformanceWindowKey, PerformanceWindowMetrics>;
    clicksAndSales: {
        totalClicks: number;
        uniqueVisitors: number;
        conversions: number;
        revenue: number;
    };
    roiMetrics: {
        revenue: number;
        conversions: number;
        roas: number | null;
        cpa: number | null;
    };
};

type PerformanceSummary = {
    campaignCount: number;
    activeCampaignCount: number;
    acceptedCampaignCount: number;
    totalEarnings: number;
    totalReceived: number;
    totalPending: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    averageROAS: number;
    averageCPA: number;
};

type PerformanceResponse = {
    campaigns: CampaignPerformanceItem[];
    summary: PerformanceSummary;
};

const TEXT = '#1A0A00';
const MUTED = '#7A5030';
const PRIMARY = '#C2340A';
const BORDER = '#EDD9BC';

function money(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function pct(value?: number | null, digits = 1) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Number(value).toFixed(digits)}%`;
}

function titleCase(value: string) {
    return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function SectionCard({ title, subtitle, children, icon }: { title: string; subtitle?: string; children: ReactNode; icon?: ReactNode }) {
    return (
        <GlassCard padding="24px" style={{ borderRadius: 24, border: '1px solid rgba(194,52,10,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT }}>{title}</p>
                    {subtitle ? <p style={{ margin: '6px 0 0', fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{subtitle}</p> : null}
                </div>
                {icon ? <div style={{ color: '#C4A882' }}>{icon}</div> : null}
            </div>
            {children}
        </GlassCard>
    );
}

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: string }) {
    return (
        <div style={{ borderRadius: 18, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.42)', padding: 18 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C4A882' }}>{label}</p>
            <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: tone }}>{value}</p>
            {hint ? <p style={{ margin: '8px 0 0', fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{hint}</p> : null}
        </div>
    );
}

function SmallMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
    return (
        <div style={{ borderRadius: 16, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.72)', padding: 16 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 800, color: tone, letterSpacing: '-0.03em' }}>{value}</p>
        </div>
    );
}

function SkeletonBlock({ height, width = '100%' }: { height: number; width?: number | string }) {
    return (
        <div
            style={{
                height,
                width,
                borderRadius: 14,
                background: 'linear-gradient(90deg, rgba(237,217,188,0.22), rgba(255,255,255,0.72), rgba(237,217,188,0.22))',
                backgroundSize: '200% 100%',
                animation: 'pulse 1.4s ease-in-out infinite',
            }}
        />
    );
}

export default function InfluencerPerformancePage() {
    const [campaigns, setCampaigns] = useState<CampaignPerformanceItem[]>([]);
    const [summary, setSummary] = useState<PerformanceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
    const [selectedWindow, setSelectedWindow] = useState<PerformanceWindowKey>('30days');

    const loadPerformance = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await influencerAPI.getPerformance();
            const payload = (res.data || {}) as PerformanceResponse;
            const nextCampaigns = payload.campaigns || [];
            setCampaigns(nextCampaigns);
            setSummary(payload.summary || null);
            setExpandedCampaignId((current) => {
                if (current && nextCampaigns.some((item) => item.campaignId === current)) return current;
                return nextCampaigns[0]?.campaignId || null;
            });
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

    const selectedCampaign = useMemo(
        () => campaigns.find((item) => item.campaignId === expandedCampaignId) || null,
        [campaigns, expandedCampaignId]
    );

    const selectedMetrics = selectedCampaign?.timeframes?.[selectedWindow] || selectedCampaign?.timeframes?.['30days'] || null;

    const summaryCards = summary ? [
        { label: 'Ongoing campaigns', value: String(summary.campaignCount), tone: PRIMARY, hint: 'Live collaborations currently in progress.' },
        { label: 'Expected earnings', value: money(summary.totalEarnings), tone: '#7C3AED', hint: 'Contract value across your collaborations.' },
        { label: 'Received so far', value: money(summary.totalReceived), tone: '#059669', hint: 'Released earnings already paid out.' },
        { label: 'Pending payout', value: money(summary.totalPending), tone: '#d97706', hint: 'Tranches scheduled but not yet released.' },
        { label: 'Overall clicks', value: summary.totalClicks.toLocaleString(), tone: '#C2340A', hint: 'Tracked link clicks across your collaborations.' },
        { label: 'Conversion value', value: money(summary.totalRevenue), tone: '#b45309', hint: 'Dollars generated from tracked conversions.' },
        { label: 'Average ROAS', value: summary.averageROAS ? `${summary.averageROAS.toFixed(2)}x` : '—', tone: '#0f766e', hint: 'Average return on ad spend across campaigns.' },
        { label: 'Average CPA', value: money(summary.averageCPA), tone: '#0284c7', hint: 'Average cost required to acquire one conversion.' },
    ] : [];

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                {loading ? (
                    <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ padding: 24, borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.42)' }}>
                            <SkeletonBlock height={12} width={110} />
                            <SkeletonBlock height={30} width="45%" />
                            <SkeletonBlock height={18} width="70%" />
                        </div>
                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                            {Array.from({ length: 8 }).map((_, index) => (
                                <SkeletonBlock key={index} height={118} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ maxWidth: 820 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(194,52,10,0.08)', border: '1px solid rgba(194,52,10,0.12)', marginBottom: 12 }}>
                                    <TrendingUp size={14} style={{ color: PRIMARY }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: PRIMARY }}>Campaign performance</span>
                                </div>
                                <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.04em', fontWeight: 800, color: TEXT }}>
                                    Your campaign performance dashboard
                                </h1>
                                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: MUTED, maxWidth: 820 }}>
                                    Track your ongoing collaborations, uploaded media links, campaign age, and revenue from clicks and conversions. Expand any row to compare Today, 10, 20, and 30-day windows.
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
                                    <BarChart3 size={14} />
                                    Open collaborations
                                </Link>
                            </div>
                        </div>

                        {error && (
                            <div style={{ borderRadius: 16, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(254,242,242,0.9)', padding: 16, color: '#991B1B', fontSize: 14 }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                            {summaryCards.map((card) => (
                                <StatCard key={card.label} label={card.label} value={card.value} hint={card.hint} tone={card.tone} />
                            ))}
                        </div>

                        <SectionCard title="Campaign table" subtitle="All ongoing collaborations with uploaded media links and expandable performance analytics." icon={<Users size={16} />}>
                            {campaigns.length === 0 ? (
                                <div style={{ padding: '44px 0', textAlign: 'center', color: MUTED }}>
                                    No ongoing collaborations to display yet.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', minWidth: 980, borderCollapse: 'separate', borderSpacing: 0 }}>
                                        <thead>
                                            <tr>
                                                {['Campaign Name', 'Brand', 'Price / Budget', 'Uploaded Media Link', 'Days Ran', 'Analytics'].map((heading) => (
                                                    <th key={heading} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${BORDER}` }}>
                                                        {heading}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaigns.map((item) => {
                                                const expanded = item.campaignId === expandedCampaignId;
                                                const windowMetrics = selectedMetrics && expanded ? selectedMetrics : item.timeframes['30days'];
                                                const mediaHref = item.uploadedMediaLink || windowMetrics?.mediaLink || null;
                                                return (
                                                    <tbody key={item.campaignId}>
                                                        <tr style={{ background: expanded ? 'rgba(194,52,10,0.04)' : 'transparent' }}>
                                                            <td style={{ padding: '14px 12px', borderBottom: `1px solid ${BORDER}` }}>
                                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT }}>{item.name}</p>
                                                                <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>{titleCase(item.lifecycleStatus)}</p>
                                                            </td>
                                                            <td style={{ padding: '14px 12px', borderBottom: `1px solid ${BORDER}` }}>
                                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{item.brand}</p>
                                                                <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>{item.username ? `@${item.username}` : '—'}</p>
                                                            </td>
                                                            <td style={{ padding: '14px 12px', borderBottom: `1px solid ${BORDER}` }}>
                                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{money(item.price)}</p>
                                                                <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>Campaign budget</p>
                                                            </td>
                                                            <td style={{ padding: '14px 12px', borderBottom: `1px solid ${BORDER}` }}>
                                                                {mediaHref ? (
                                                                    <a href={mediaHref} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>
                                                                        Open media
                                                                        <ExternalLink size={14} />
                                                                    </a>
                                                                ) : (
                                                                    <span style={{ color: MUTED }}>No media link yet</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '14px 12px', borderBottom: `1px solid ${BORDER}` }}>
                                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{item.daysRan}/30</p>
                                                                <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: 'rgba(237,217,188,0.7)', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${item.progressPercent}%`, height: '100%', borderRadius: 999, background: PRIMARY }} />
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '14px 12px', borderBottom: `1px solid ${BORDER}` }}>
                                                                <GlowButton
                                                                    variant="outline"
                                                                    onClick={() => setExpandedCampaignId(expanded ? null : item.campaignId)}
                                                                    style={{ padding: '9px 12px', borderRadius: 12 }}
                                                                >
                                                                    {expanded ? 'Hide' : 'View'} Analytics
                                                                </GlowButton>
                                                            </td>
                                                        </tr>

                                                        {expanded && windowMetrics ? (
                                                            <tr>
                                                                <td colSpan={6} style={{ padding: '18px 12px 24px', borderBottom: `1px solid ${BORDER}` }}>
                                                                    <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.78)', padding: 18 }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                                                            <div>
                                                                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>View Analytics</p>
                                                                                <h3 style={{ margin: '6px 0 0', fontSize: 20, color: TEXT, fontWeight: 800 }}>{item.name}</h3>
                                                                                <p style={{ margin: '6px 0 0', fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                                                                                    Metrics are factual and switch instantly between Today, 10, 20, and 30-day windows.
                                                                                </p>
                                                                            </div>

                                                                            <div style={{ display: 'inline-flex', gap: 8, padding: 6, borderRadius: 999, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)' }}>
                                                                                {([
                                                                                    { key: 'today', label: 'Today' },
                                                                                    { key: '10days', label: '10 Days' },
                                                                                    { key: '20days', label: '20 Days' },
                                                                                    { key: '30days', label: '30 Days' },
                                                                                ] as { key: PerformanceWindowKey; label: string }[]).map((window) => {
                                                                                    const active = selectedWindow === window.key;
                                                                                    return (
                                                                                        <button
                                                                                            key={window.key}
                                                                                            type="button"
                                                                                            onClick={() => setSelectedWindow(window.key)}
                                                                                            style={{
                                                                                                border: 'none',
                                                                                                background: active ? 'rgba(194,52,10,0.14)' : 'transparent',
                                                                                                color: active ? PRIMARY : MUTED,
                                                                                                borderRadius: 999,
                                                                                                padding: '8px 12px',
                                                                                                fontSize: 12,
                                                                                                fontWeight: 800,
                                                                                                cursor: 'pointer',
                                                                                            }}
                                                                                        >
                                                                                            {window.label}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                        <div style={{ marginTop: 18, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                                                                            <SmallMetric label="Likes" value={windowMetrics.likes.toLocaleString()} tone={PRIMARY} />
                                                                            <SmallMetric label="Comments" value={windowMetrics.comments.toLocaleString()} tone="#d97706" />
                                                                            <SmallMetric label="Shares / Saves" value={`${windowMetrics.shares.toLocaleString()} / ${windowMetrics.saves.toLocaleString()}`} tone="#0284c7" />
                                                                            <SmallMetric label="Engagement Rate" value={pct(windowMetrics.engagementRate)} tone="#059669" />
                                                                            <SmallMetric label="Views / Impressions" value={`${windowMetrics.views.toLocaleString()} / ${windowMetrics.impressions.toLocaleString()}`} tone={TEXT} />
                                                                            <SmallMetric label="View Rate" value={pct(windowMetrics.viewRate)} tone="#7C3AED" />
                                                                            <SmallMetric label="Posts Analyzed" value={String(windowMetrics.postsAnalyzed)} tone={TEXT} />
                                                                            <SmallMetric label="Posting Frequency" value={`${windowMetrics.postsPerWeek.toFixed(2)} / week`} tone="#0f766e" />
                                                                        </div>

                                                                        <div style={{ marginTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                                                                            <SmallMetric label="Clicks" value={windowMetrics.totalClicks.toLocaleString()} tone={PRIMARY} />
                                                                            <SmallMetric label="Unique Visitors" value={windowMetrics.uniqueVisitors.toLocaleString()} tone="#0f766e" />
                                                                            <SmallMetric label="Conversions" value={windowMetrics.conversions.toLocaleString()} tone="#b45309" />
                                                                            <SmallMetric label="Revenue" value={money(windowMetrics.revenue)} tone="#059669" />
                                                                            <SmallMetric label="ROAS" value={windowMetrics.roas != null ? `${windowMetrics.roas.toFixed(2)}x` : '—'} tone="#0284c7" />
                                                                            <SmallMetric label="CPA" value={windowMetrics.cpa != null ? money(windowMetrics.cpa) : '—'} tone="#d97706" />
                                                                        </div>

                                                                        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.82)', border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontWeight: 700 }}>
                                                                                <Clock3 size={14} />
                                                                                Days Ran: {item.daysRan}/30
                                                                            </span>
                                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.82)', border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontWeight: 700 }}>
                                                                                Campaign Cost: {money(windowMetrics.campaignCost)}
                                                                            </span>
                                                                            {windowMetrics.hasMatchedMedia ? (
                                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', color: '#059669', fontSize: 13, fontWeight: 700 }}>
                                                                                    Uploaded media matched
                                                                                </span>
                                                                            ) : (
                                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', color: '#b45309', fontSize: 13, fontWeight: 700 }}>
                                                                                    <AlertCircle size={14} />
                                                                                    No matched media yet
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : null}
                                                    </tbody>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SectionCard>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
