'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    BadgeDollarSign,
    BarChart3,
    CheckCircle2,
    Globe2,
    Heart,
    PieChart as PieChartIcon,
    Radar,
    RefreshCw,
    Search,
    Sparkles,
    Star,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    Radar as RechartsRadar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GlassCard, GlowButton } from '@/components/ui';
import { brandAPI } from '@/lib/api';

type InfluencerListItem = {
    influencerId: string;
    userId: string;
    fullName?: string;
    username?: string | null;
    followers?: number;
    profilePictureUrl?: string | null;
    niche?: string | null;
    country?: string | null;
    verified?: boolean;
    metrics?: {
        finalScore?: number;
        ratingTier?: string;
        engagementRate?: number;
    };
};

type AnalyticsPost = {
    postId: string;
    timestamp: string;
    type: 'photo' | 'video' | 'reel' | 'story' | string;
    likes: number;
    comments: number;
    shares?: number;
    saves?: number;
    engagement_rate: number;
    reach: number;
    impressions: number;
    permalink?: string | null;
    caption?: string | null;
};

type BrandInfluencerAnalytics = {
    influencerId: string;
    period_days: number;
    influencer: {
        id: string;
        userId: string;
        name: string;
        username: string | null;
        profilePictureUrl: string | null;
        followers: number;
        verified: boolean;
        platform: string;
    };
    summary: {
        average_engagement_rate: number;
        average_likes: number;
        average_comments: number;
        total_posts: number;
        follower_growth_rate: number;
        authenticity_score: number;
        average_views?: number;
        view_rate?: number;
        cost_per_view?: number | null;
        cost_per_engagement?: number | null;
        estimated_cost_per_post?: number | null;
        estimated_cost_per_reel?: number | null;
        estimated_media_value?: number | null;
        predicted_roi?: number | null;
        final_score?: number;
        rating_tier?: string;
        consistency_score?: number;
    };
    trends: {
        engagement_rate_over_time: Array<{ date: string; label: string; engagementRate: number }>;
        follower_count_over_time: Array<{ date: string; label: string; followers: number }>;
        posts_per_week?: Array<{ label: string; postsCount: number }>;
        posting_frequency_over_time?: Array<{ label: string; postsCount: number }>;
    };
    content_distribution: {
        photo_count: number;
        video_count: number;
        reel_count: number;
        story_count: number;
    };
    engagement_breakdown?: Array<{ name: string; value: number }>;
    radar?: Array<{ metric: string; value: number }>;
    roi?: {
        predicted_roi: number | null;
        estimated_media_value: number | null;
        final_score: number;
        rating_tier: string;
    };
    demographics: {
        locations: Array<{ region: string; percent: number }>;
        genders: Array<{ gender: string; percent: number }>;
        ages: Array<{ range: string; percent: number }>;
    };
    posts: AnalyticsPost[];
};

const COLORS = {
    ink: '#1A0A00',
    muted: '#7A5030',
    border: '#EDD9BC',
    orange: '#C2340A',
    green: '#059669',
    amber: '#b45309',
    red: '#dc2626',
};

const PIE_COLORS = ['#C2340A', '#FF6B1A', '#C4A882', '#EDD9BC', '#E8400A'];

function formatNumber(value: number | null | undefined, digits = 0) {
    if (value == null || Number.isNaN(value)) return '—';
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatPercent(value: number | null | undefined, digits = 1) {
    if (value == null || Number.isNaN(value)) return '—';
    return `${Number(value).toFixed(digits)}%`;
}

function formatCurrency(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value));
}

function formatCompact(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '—';
    const abs = Math.abs(Number(value));
    if (abs >= 1_000_000) return `${(Number(value) / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(Number(value) / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
    return Number(value).toLocaleString();
}

function toneForMetric(value: number, type: 'engagement' | 'growth' | 'authenticity') {
    if (type === 'growth') {
        if (value >= 5) return COLORS.green;
        if (value >= 0) return COLORS.amber;
        return COLORS.red;
    }
    if (type === 'authenticity') {
        if (value >= 75) return COLORS.green;
        if (value >= 50) return COLORS.amber;
        return COLORS.red;
    }
    if (value >= 6) return COLORS.green;
    if (value >= 3) return COLORS.amber;
    return COLORS.red;
}

function toneForRatingTier(tier?: string) {
    const normalized = String(tier || '').toLowerCase();
    if (normalized === 'elite') return COLORS.green;
    if (normalized === 'good') return '#0284c7';
    if (normalized === 'average') return COLORS.amber;
    return COLORS.red;
}

function MetricCard({ label, value, tone, note }: { label: string; value: string; tone: string; note?: string }) {
    return (
        <GlassCard padding="18px" noHover>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            <p style={{ marginTop: 10, fontSize: 26, fontWeight: 800, color: tone, letterSpacing: '-0.03em' }}>{value}</p>
            {note ? <p style={{ marginTop: 8, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{note}</p> : null}
        </GlassCard>
    );
}

function ChartShell({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <GlassCard padding="24px">
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
                    {subtitle ? <p style={{ marginTop: 6, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{subtitle}</p> : null}
                </div>
                {icon ? <div style={{ color: COLORS.muted, flexShrink: 0 }}>{icon}</div> : null}
            </div>
            {children}
        </GlassCard>
    );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
    return (
        <div style={{ borderRadius: 18, border: `1px dashed ${COLORS.border}`, background: 'rgba(255,255,255,0.45)', padding: 24, textAlign: 'center' }}>
            <BarChart3 size={34} style={{ color: COLORS.border, margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.ink }}>{title}</p>
            <p style={{ marginTop: 6, fontSize: 13, color: COLORS.muted, lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{copy}</p>
        </div>
    );
}

function SkeletonBox({ height = 18, width = '100%', radius = 10, style }: { height?: number; width?: string | number; radius?: number; style?: CSSProperties }) {
    return (
        <div
            style={{
                height,
                width,
                borderRadius: radius,
                background: 'linear-gradient(90deg, rgba(237,217,188,0.22), rgba(255,255,255,0.72), rgba(237,217,188,0.22))',
                backgroundSize: '200% 100%',
                animation: 'pulse 1.4s ease-in-out infinite',
                ...style,
            }}
        />
    );
}

function typeLabel(type: string) {
    const value = String(type || '').toLowerCase();
    if (value === 'reel') return 'Reel';
    if (value === 'video') return 'Video';
    if (value === 'story') return 'Story';
    return 'Photo';
}

function typeMatches(filter: string, type: string) {
    if (filter === 'all') return true;
    if (filter === 'photos') return String(type).toLowerCase() === 'photo';
    if (filter === 'reels') return String(type).toLowerCase() === 'reel';
    if (filter === 'videos') return String(type).toLowerCase() === 'video';
    return true;
}

export default function BrandAnalyticsPage() {
    const searchParams = useSearchParams();
    const targetInfluencerId = searchParams.get('influencerId') || '';
    const [influencers, setInfluencers] = useState<InfluencerListItem[]>([]);
    const [selectedId, setSelectedId] = useState('');
    const [search, setSearch] = useState('');
    const [data, setData] = useState<BrandInfluencerAnalytics | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadInfluencers = useCallback(async (nextSearch = '') => {
        setLoadingList(true);
        try {
            const response = await brandAPI.getInfluencers(nextSearch ? { search: nextSearch } : undefined);
            const nextInfluencers = response.data?.influencers || [];
            setInfluencers(nextInfluencers);
            setSelectedId((current) => {
                if (targetInfluencerId && nextInfluencers.some((item: InfluencerListItem) => item.influencerId === targetInfluencerId)) return targetInfluencerId;
                if (current && nextInfluencers.some((item: InfluencerListItem) => item.influencerId === current)) return current;
                return nextInfluencers[0]?.influencerId || '';
            });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load influencers.');
            setInfluencers([]);
            setSelectedId('');
        } finally {
            setLoadingList(false);
        }
    }, [targetInfluencerId]);

    const loadDetail = useCallback(async (id: string, silent = false) => {
        if (!id) return;
        if (!silent) setLoadingDetail(true);
        else setRefreshing(true);
        try {
            const response = await brandAPI.getInfluencer60DayAnalytics(id);
            setData(response.data || null);
            setError('');
        } catch (err: any) {
            setData(null);
            setError(err?.response?.data?.message || 'Unable to fetch analytics.');
        } finally {
            setLoadingDetail(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadInfluencers();
    }, [loadInfluencers]);

    useEffect(() => {
        if (selectedId) void loadDetail(selectedId);
    }, [selectedId, loadDetail]);

    const selectedInfluencer = useMemo(
        () => influencers.find((item) => item.influencerId === selectedId) || null,
        [influencers, selectedId]
    );

    const summary = data?.summary;
    const influencer = data?.influencer;
    const [filter, setFilter] = useState<'all' | 'photos' | 'reels' | 'videos'>('all');
    const postsSource = data?.posts ?? [];
    const posts = useMemo(
        () =>
            [...postsSource]
                .filter((post) => typeMatches(filter, post.type))
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [postsSource, filter]
    );

    const contentData = [
        { name: 'Photo', value: data?.content_distribution.photo_count || 0 },
        { name: 'Video', value: data?.content_distribution.video_count || 0 },
        { name: 'Reel', value: data?.content_distribution.reel_count || 0 },
        { name: 'Story', value: data?.content_distribution.story_count || 0 },
    ].filter((item) => item.value > 0);

    const genders = data?.demographics.genders || [];
    const ages = data?.demographics.ages || [];
    const locations = data?.demographics.locations || [];

    const summaryCards = summary ? [
        {
            label: 'Final Score',
            value: formatNumber(summary.final_score ?? data?.roi?.final_score),
            tone: toneForRatingTier(summary.rating_tier || data?.roi?.rating_tier),
            note: 'Overall evaluation across engagement, growth, authenticity, consistency, and cost efficiency.',
        },
        {
            label: 'Rating Tier',
            value: summary.rating_tier || data?.roi?.rating_tier || 'Needs Review',
            tone: toneForRatingTier(summary.rating_tier || data?.roi?.rating_tier),
            note: 'A quick brand-friendly signal of how strong the influencer looks right now.',
        },
        {
            label: 'Avg Engagement Rate (60d)',
            value: formatPercent(summary.average_engagement_rate, 2),
            tone: toneForMetric(summary.average_engagement_rate || 0, 'engagement'),
            note: 'Average engagement across posts in the last 60 days.',
        },
        {
            label: 'Average Views',
            value: formatCompact(summary.average_views),
            tone: COLORS.ink,
            note: 'Average views across the last 60 days of tracked posts.',
        },
        {
            label: 'Posts Analyzed',
            value: formatNumber(summary.total_posts),
            tone: COLORS.ink,
            note: 'Number of posts included in the 60-day analytics window.',
        },
        {
            label: 'View Rate',
            value: formatPercent(summary.view_rate, 2),
            tone: '#0284c7',
            note: 'Average views as a share of the current follower base.',
        },
        {
            label: 'Growth Rate',
            value: formatPercent(summary.follower_growth_rate, 1),
            tone: toneForMetric(summary.follower_growth_rate || 0, 'growth'),
            note: 'Follower change measured across the last 60 days.',
        },
        {
            label: 'Cost / View',
            value: formatCurrency(summary.cost_per_view),
            tone: COLORS.amber,
            note: 'Estimated cost efficiency based on stored pricing and performance data.',
        },
        {
            label: 'Cost / Engagement',
            value: formatCurrency(summary.cost_per_engagement),
            tone: COLORS.amber,
            note: 'Estimated cost per interaction in the 60-day window.',
        },
    ] : [];

    const radarData = data?.radar || [
        { metric: 'Engagement', value: Math.min((summary?.average_engagement_rate || 0) * 12, 100) },
        { metric: 'View Rate', value: Math.min((summary?.view_rate || 0) * 8, 100) },
        { metric: 'Authenticity', value: summary?.authenticity_score || 0 },
        { metric: 'Growth', value: Math.max((summary?.follower_growth_rate || 0) > 0 ? Math.min((summary?.follower_growth_rate || 0) * 2, 100) : 20, 0) },
        { metric: 'Cost Efficiency', value: Math.max(0, 100 - ((summary?.cost_per_view || 0) / 0.05) * 100) },
        { metric: 'Consistency', value: summary?.consistency_score || 0 },
    ];

    const engagementBreakdown = data?.engagement_breakdown || [
        { name: 'Likes', value: summary?.average_likes || 0 },
        { name: 'Comments', value: summary?.average_comments || 0 },
        { name: 'Shares', value: 0 },
        { name: 'Saves', value: 0 },
    ].filter((item) => item.value > 0);

    const roi = data?.roi || {
        predicted_roi: summary?.predicted_roi ?? null,
        estimated_media_value: summary?.estimated_media_value ?? null,
        final_score: summary?.final_score ?? 0,
        rating_tier: summary?.rating_tier || 'Needs Review',
    };

    const handleRefresh = async () => {
        if (!selectedId) return;
        await loadDetail(selectedId, true);
    };

    const handleSearch = () => void loadInfluencers(search);

    if (loadingList || (loadingDetail && !data)) {
        return (
            <ProtectedRoute allowedRoles={['brand']}>
                <DashboardLayout>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <GlassCard padding="28px">
                            <SkeletonBox height={12} width={120} />
                            <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                                <SkeletonBox height={32} width="52%" />
                                <SkeletonBox height={18} width="82%" />
                                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <SkeletonBox height={34} width={126} radius={999} />
                                    <SkeletonBox height={34} width={132} radius={999} />
                                    <SkeletonBox height={34} width={150} radius={999} />
                                </div>
                            </div>
                        </GlassCard>
                        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '320px minmax(0,1fr)' }}>
                            <GlassCard padding="24px">
                                <SkeletonBox height={14} width={120} />
                                <SkeletonBox height={44} style={{ marginTop: 14 }} />
                                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <SkeletonBox key={index} height={72} />
                                    ))}
                                </div>
                            </GlassCard>
                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                {Array.from({ length: 9 }).map((_, index) => (
                                    <GlassCard key={index} padding="18px" noHover>
                                        <SkeletonBox height={12} width={110} />
                                        <SkeletonBox height={30} width="70%" style={{ marginTop: 12 }} />
                                        <SkeletonBox height={12} width="90%" style={{ marginTop: 12 }} />
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (error || !data || !influencer) {
        return (
            <ProtectedRoute allowedRoles={['brand']}>
                <DashboardLayout>
                    <GlassCard padding="24px">
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand Analytics</p>
                        <h1 style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: COLORS.ink }}>Unable to load analytics</h1>
                        <p style={{ marginTop: 8, fontSize: 14, color: COLORS.muted, lineHeight: 1.7 }}>{error || 'Select an influencer to view the 60-day analytics report.'}</p>
                        <div style={{ marginTop: 16 }}>
                            <GlowButton onClick={() => void loadInfluencers(search)}>
                                <RefreshCw size={14} />
                                Try again
                            </GlowButton>
                        </div>
                    </GlassCard>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <GlassCard padding="28px">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div style={{ maxWidth: 820 }}>
                                <Link href="/dashboard/brand/influencers" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.orange, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                                    <ArrowLeft size={14} />
                                    Back to influencers
                                </Link>
                                <p style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand Analytics</p>
                                <h1 style={{ marginTop: 8, fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: COLORS.ink }}>60-Day Influencer Analytics</h1>
                                <p style={{ marginTop: 8, fontSize: 14, color: COLORS.muted, lineHeight: 1.7 }}>
                                    Brand evaluation is now focused on the last 60 days only. Pick an influencer to review the same report used throughout the portal.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <GlowButton variant="outline" onClick={handleRefresh} loading={refreshing || loadingDetail} disabled={!selectedId}>
                                    <RefreshCw size={14} />
                                    Refresh 60d Data
                                </GlowButton>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(194,52,10,0.08)', border: '1px solid rgba(194,52,10,0.18)', color: COLORS.orange, fontSize: 13, fontWeight: 800 }}>
                                    <Star size={14} />
                                    Last 60 Days Only
                                </span>
                            </div>
                        </div>
                    </GlassCard>

                    <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
                        <GlassCard padding="24px">
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Influencer Selector</p>
                            <p style={{ marginTop: 6, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>Choose a creator to view their 60-day performance report.</p>
                            <div style={{ position: 'relative', marginTop: 14 }}>
                                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted }} />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') handleSearch();
                                    }}
                                    placeholder="Search influencer"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 40px',
                                        borderRadius: 12,
                                        border: '1px solid #EDD9BC',
                                        background: 'rgba(255,255,255,0.6)',
                                        fontSize: 14,
                                        color: COLORS.ink,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        transition: 'border-color 0.15s',
                                    }}
                                    onFocus={(event) => { event.currentTarget.style.borderColor = '#C2340A'; }}
                                    onBlur={(event) => { event.currentTarget.style.borderColor = '#EDD9BC'; }}
                                />
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <GlowButton fullWidth onClick={handleSearch}>
                                    <Search size={14} />
                                    Search
                                </GlowButton>
                            </div>

                            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 680, overflowY: 'auto', paddingRight: 4 }}>
                                {loadingList ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <GlassCard key={index} padding="16px" noHover>
                                            <SkeletonBox height={12} width="58%" />
                                            <SkeletonBox height={12} width="78%" style={{ marginTop: 10 }} />
                                            <SkeletonBox height={10} width="48%" style={{ marginTop: 12 }} />
                                        </GlassCard>
                                    ))
                                ) : influencers.length === 0 ? (
                                    <EmptyState title="No influencers found" copy="Profiles will appear here once influencer data is available in the platform." />
                                ) : (
                                    influencers.map((item) => {
                                        const active = item.influencerId === selectedId;
                                        return (
                                            <button
                                                key={item.influencerId}
                                                onClick={() => setSelectedId(item.influencerId)}
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '16px',
                                                    borderRadius: 16,
                                                    border: active ? '1px solid #C2340A' : '1px solid #EDD9BC',
                                                    background: active ? 'rgba(194,52,10,0.05)' : 'rgba(255,255,255,0.6)',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit',
                                                    transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={(event) => { if (!active) event.currentTarget.style.background = '#fff'; }}
                                                onMouseLeave={(event) => { if (!active) event.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.fullName || 'Influencer'}
                                                        </p>
                                                        <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.username ? `@${item.username}` : 'No username'} {item.niche ? `• ${item.niche}` : ''}
                                                        </p>
                                                    </div>
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <p style={{ fontWeight: 800, fontSize: 20, color: COLORS.ink, margin: 0 }}>{formatNumber(item.metrics?.finalScore)}</p>
                                                        <p style={{ fontSize: 10, color: toneForRatingTier(item.metrics?.ratingTier), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 0' }}>
                                                            {item.metrics?.ratingTier || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: COLORS.muted, fontWeight: 500, gap: 10 }}>
                                                    <span>{formatNumber(item.followers)} followers</span>
                                                    <span>{item.country || 'Global'}</span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </GlassCard>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {!selectedInfluencer ? (
                                <EmptyState title="Select an influencer" copy="Choose a creator from the list to review their 60-day analytics profile, scoring, and cost efficiency." />
                            ) : (
                                <>
                                    <GlassCard padding="28px">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                            <div style={{ maxWidth: 820 }}>
                                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected Influencer</p>
                                                <h2 style={{ marginTop: 8, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: COLORS.ink }}>
                                                    {influencer.name}
                                                </h2>
                                                <p style={{ marginTop: 8, fontSize: 14, color: COLORS.muted, lineHeight: 1.7 }}>
                                                    A clean 60-day snapshot with engagement, content, follower growth, authenticity, and audience demographics.
                                                </p>
                                                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.6)', border: `1px solid ${COLORS.border}`, color: COLORS.ink, fontSize: 13, fontWeight: 700 }}>
                                                        <Users size={14} />
                                                        {formatCompact(influencer.followers)} followers
                                                    </span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: COLORS.green, fontSize: 13, fontWeight: 700 }}>
                                                        <CheckCircle2 size={14} />
                                                        {influencer.verified ? 'Verified' : 'Profile visible'}
                                                    </span>
                                                    {influencer.username ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.6)', border: `1px solid ${COLORS.border}`, color: COLORS.ink, fontSize: 13, fontWeight: 700 }}>
                                                            @{influencer.username}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                <GlowButton variant="outline" onClick={() => void loadDetail(selectedId, true)} loading={refreshing || loadingDetail}>
                                                    <RefreshCw size={14} />
                                                    Refresh
                                                </GlowButton>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(194,52,10,0.08)', border: '1px solid rgba(194,52,10,0.18)', color: COLORS.orange, fontSize: 13, fontWeight: 800 }}>
                                                    <Star size={14} />
                                                    Last 60 Days
                                                </span>
                                            </div>
                                        </div>
                                    </GlassCard>

                                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                        {summaryCards.map((card) => (
                                            <MetricCard key={card.label} label={card.label} value={card.value} tone={card.tone} note={card.note} />
                                        ))}
                                    </div>

                                    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                                        <ChartShell title="Influencer Score Radar" subtitle="A normalized view of the influencer's 60-day fit across core decision factors." icon={<Radar size={16} />}>
                                            {radarData.length ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <RadarChart data={radarData}>
                                                        <PolarGrid stroke={COLORS.border} />
                                                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: COLORS.muted, fontWeight: 700 }} />
                                                        <Tooltip />
                                                        <RechartsRadar dataKey="value" stroke={COLORS.orange} fill={COLORS.orange} fillOpacity={0.22} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="Radar unavailable" copy="The score radar will appear once enough 60-day performance data exists." />
                                            )}
                                        </ChartShell>

                                        <ChartShell title="ROI / EMV" subtitle="A brand-friendly estimate of the creator's current commercial value." icon={<Sparkles size={16} />}>
                                            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                                                <MetricCard label="Predicted ROI" value={formatPercent(roi?.predicted_roi, 1)} tone={toneForMetric(roi?.predicted_roi || 0, 'growth')} note="Estimated return on the campaign budget." />
                                                <MetricCard label="Estimated Media Value" value={formatCurrency(roi?.estimated_media_value)} tone="#0284c7" note="Approximate media value using stored audience and reach signals." />
                                                <MetricCard label="Final Score" value={formatNumber(roi?.final_score)} tone={toneForRatingTier(roi?.rating_tier)} note="Overall score used to compare creators quickly." />
                                                <MetricCard label="Rating Tier" value={roi?.rating_tier || 'Needs Review'} tone={toneForRatingTier(roi?.rating_tier)} note="Simple label for brand decision-making." />
                                            </div>
                                        </ChartShell>
                                    </div>

                                    <ChartShell title="Cost Efficiency" subtitle="Budget signals brands can compare quickly before outreach." icon={<BadgeDollarSign size={16} />}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                                            <MetricCard label="Cost / View" value={formatCurrency(summary.cost_per_view)} tone={COLORS.amber} note="Estimated cost per view for the current 60-day performance window." />
                                            <MetricCard label="Cost / Engagement" value={formatCurrency(summary.cost_per_engagement)} tone={COLORS.amber} note="Estimated cost for each engagement signal." />
                                            <MetricCard label="Estimated Cost / Post" value={formatCurrency(summary.estimated_cost_per_post)} tone={COLORS.green} note="Stored average post price, if available." />
                                            <MetricCard label="Estimated Cost / Reel" value={formatCurrency(summary.estimated_cost_per_reel)} tone={COLORS.green} note="Stored average reel price, if available." />
                                        </div>
                                    </ChartShell>

                                    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                                        <ChartShell title="Engagement Rate" subtitle="Daily engagement rate across the last 60 days." icon={<TrendingUp size={16} />}>
                                            {Array.isArray(data.trends.engagement_rate_over_time) && data.trends.engagement_rate_over_time.length ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <LineChart data={data.trends.engagement_rate_over_time}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                        <YAxis tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                        <Tooltip />
                                                        <Line type="monotone" dataKey="engagementRate" stroke={COLORS.orange} strokeWidth={3} dot={{ r: 3 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="No engagement data yet" copy="There are no posts in the last 60 days to chart engagement performance." />
                                            )}
                                        </ChartShell>

                                        <ChartShell title="Follower Count" subtitle="Snapshot trend for the same 60-day window." icon={<Users size={16} />}>
                                            {Array.isArray(data.trends.follower_count_over_time) && data.trends.follower_count_over_time.length ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <LineChart data={data.trends.follower_count_over_time}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                        <YAxis tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                        <Tooltip />
                                                        <Line type="monotone" dataKey="followers" stroke="#0284c7" strokeWidth={3} dot={{ r: 3 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="No follower trend available" copy="Follower snapshots will appear once the influencer profile has enough stored data." />
                                            )}
                                        </ChartShell>
                                    </div>

                                    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                                        <ChartShell title="Posts per Week" subtitle="Posting activity grouped into weekly buckets." icon={<BarChart3 size={16} />}>
                                            {(data.trends.posts_per_week || data.trends.posting_frequency_over_time)?.length ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <BarChart data={data.trends.posts_per_week || data.trends.posting_frequency_over_time}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                        <YAxis tick={{ fontSize: 12, fill: COLORS.muted }} allowDecimals={false} />
                                                        <Tooltip />
                                                        <Bar dataKey="postsCount" fill={COLORS.orange} radius={[8, 8, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="No posting activity found" copy="This influencer has no tracked posts in the last 60 days." />
                                            )}
                                        </ChartShell>

                                        <ChartShell title="Content Distribution" subtitle="How the last 60 days of content is split by post type." icon={<PieChartIcon size={16} />}>
                                            {contentData.length ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <PieChart>
                                                        <Pie data={contentData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                                                            {contentData.map((entry, index) => (
                                                                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="No content data yet" copy="Content type breakdown will appear once this influencer has posts within the selected period." />
                                            )}
                                        </ChartShell>
                                    </div>

                                    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                                        <ChartShell title="Audience Locations" subtitle="Top audience regions available in the stored insights." icon={<Globe2 size={16} />}>
                                            {locations.length ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <BarChart data={locations.slice().reverse()} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                                        <XAxis type="number" tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                        <YAxis type="category" dataKey="region" tick={{ fontSize: 12, fill: COLORS.muted }} width={60} />
                                                        <Tooltip />
                                                        <Bar dataKey="percent" fill={COLORS.orange} radius={[0, 8, 8, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="No location insights available" copy="Audience location data will appear when the backend has demographic insights for this influencer." />
                                            )}
                                        </ChartShell>

                                        <ChartShell title="Gender Split" subtitle="Audience gender distribution from profile insights." icon={<Users size={16} />}>
                                            {genders.length ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <PieChart>
                                                        <Pie data={genders} dataKey="percent" nameKey="gender" innerRadius={70} outerRadius={100}>
                                                            {genders.map((entry, index) => (
                                                                <Cell key={entry.gender} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="No gender insights available" copy="Gender distribution will appear when the backend has audience insight data." />
                                            )}
                                        </ChartShell>
                                    </div>

                                    <ChartShell title="Age Ranges" subtitle="Audience age distribution across the stored demographic insight set." icon={<Users size={16} />}>
                                        {ages.length ? (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={ages} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
                                                    <XAxis type="number" tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                    <YAxis type="category" dataKey="range" tick={{ fontSize: 12, fill: COLORS.muted }} width={72} />
                                                    <Tooltip />
                                                    <Bar dataKey="percent" fill={COLORS.orange} radius={[0, 8, 8, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <EmptyState title="No age insights available" copy="Age buckets will show up once demographic data exists for this influencer." />
                                        )}
                                    </ChartShell>

                                    <ChartShell title="Engagement Breakdown" subtitle="Average likes, comments, shares, and saves across the selected window." icon={<Heart size={16} />}>
                                        {engagementBreakdown.length ? (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={engagementBreakdown}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                    <YAxis tick={{ fontSize: 12, fill: COLORS.muted }} />
                                                    <Tooltip />
                                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                        {engagementBreakdown.map((entry, index) => (
                                                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <EmptyState title="No engagement breakdown yet" copy="Interaction mix will appear once there are posts in the 60-day window." />
                                        )}
                                    </ChartShell>

                                    <GlassCard padding="24px">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Posts</p>
                                                <h2 style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: COLORS.ink }}>Last 60 days</h2>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {[
                                                    { key: 'all', label: 'All' },
                                                    { key: 'photos', label: 'Photos' },
                                                    { key: 'reels', label: 'Reels' },
                                                    { key: 'videos', label: 'Videos' },
                                                ].map((item) => (
                                                    <button
                                                        key={item.key}
                                                        type="button"
                                                        onClick={() => setFilter(item.key as 'all' | 'photos' | 'reels' | 'videos')}
                                                        style={{
                                                            border: '1px solid',
                                                            borderColor: filter === item.key ? COLORS.orange : COLORS.border,
                                                            background: filter === item.key ? 'rgba(194,52,10,0.1)' : 'rgba(255,255,255,0.65)',
                                                            color: filter === item.key ? COLORS.orange : COLORS.ink,
                                                            borderRadius: 999,
                                                            padding: '8px 12px',
                                                            fontSize: 12,
                                                            fontWeight: 800,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 16, overflowX: 'auto' }}>
                                            {posts.length ? (
                                                <table style={{ width: '100%', minWidth: 860, borderCollapse: 'separate', borderSpacing: 0 }}>
                                                    <thead>
                                                        <tr>
                                                            {['Date', 'Type', 'Likes', 'Comments', 'Engagement Rate', 'Reach / Impressions'].map((heading) => (
                                                                <th key={heading} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${COLORS.border}` }}>
                                                                    {heading}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {posts.map((post) => (
                                                            <tr key={post.postId}>
                                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: COLORS.ink, fontWeight: 700 }}>
                                                                    {new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </td>
                                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: COLORS.muted }}>
                                                                    {typeLabel(post.type)}
                                                                </td>
                                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: COLORS.muted }}>
                                                                    {formatNumber(post.likes)}
                                                                </td>
                                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: COLORS.muted }}>
                                                                    {formatNumber(post.comments)}
                                                                </td>
                                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: COLORS.muted }}>
                                                                    {formatPercent(post.engagement_rate, 2)}
                                                                </td>
                                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: COLORS.muted }}>
                                                                    {formatCompact(post.reach)} / {formatCompact(post.impressions)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <EmptyState title="No posts in the last 60 days" copy="There are no tracked posts for this influencer in the selected period." />
                                            )}
                                        </div>
                                    </GlassCard>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
