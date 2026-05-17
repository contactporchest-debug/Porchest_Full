'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import {
    BadgeDollarSign,
    BarChart3,
    CircleAlert,
    CheckCircle2,
    Globe2,
    Heart,
    PieChart as PieChartIcon,
    Radar,
    RefreshCw,
    TrendingUp,
    Users,
    Send,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
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
import { GlassCard } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { influencerAPI } from '@/lib/api';

type InfluencerProfile = {
    _id?: string;
    fullName?: string;
    bio?: string;
    igBio?: string;
    igUsername?: string;
    instagramUsername?: string;
    profilePictureUrl?: string;
    instagramDPURL?: string;
    followersCount?: number;
    igFollowersCount?: number;
    verified?: boolean;
    instagramConnected?: boolean;
    instagramConnectionStatus?: string;
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

type Influencer60DayAnalytics = {
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value));
}

function formatCompact(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '—';
    const abs = Math.abs(Number(value));
    if (abs >= 1_000_000) return `${(Number(value) / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(Number(value) / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
    return Number(value).toLocaleString();
}

function toneForRatingTier(tier?: string) {
    const normalized = String(tier || '').toLowerCase();
    if (normalized === 'elite') return COLORS.green;
    if (normalized === 'good') return '#0284c7';
    if (normalized === 'average') return COLORS.amber;
    return COLORS.red;
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

function HelpBubble({ text }: { text: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ position: 'relative', flexShrink: 0 }} onMouseLeave={() => setOpen(false)}>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-label={text}
                title={text}
                style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: '1px solid rgba(122,80,48,0.20)',
                    background: 'rgba(255,255,255,0.75)',
                    color: COLORS.muted,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                }}
            >
                !
            </button>
            {open ? (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        zIndex: 20,
                        width: 240,
                        borderRadius: 12,
                        border: `1px solid ${COLORS.border}`,
                        background: 'rgba(255,255,255,0.96)',
                        boxShadow: '0 18px 36px rgba(26,10,0,0.12)',
                        padding: 12,
                        color: COLORS.muted,
                        fontSize: 12,
                        lineHeight: 1.6,
                    }}
                >
                    {text}
                </div>
            ) : null}
        </div>
    );
}

function MetricCard({ label, value, tone, note, helpText, accent }: { label: string; value: string; tone: string; note?: string; helpText?: string; accent?: string }) {
    return (
        <GlassCard
            padding="18px"
            noHover
            style={{
                borderColor: accent || undefined,
                boxShadow: accent ? `0 0 0 1px ${accent} inset, 0 2px 16px rgba(26,10,0,0.06)` : undefined,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                {helpText ? <HelpBubble text={helpText} /> : null}
            </div>
            <p style={{ marginTop: 10, fontSize: 26, fontWeight: 800, color: tone, letterSpacing: '-0.03em' }}>{value}</p>
            {note ? <p style={{ marginTop: 8, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{note}</p> : null}
        </GlassCard>
    );
}

function ChartShell({ title, subtitle, icon, helpText, accent, children }: { title: string; subtitle?: string; icon?: React.ReactNode; helpText?: string; accent?: string; children: React.ReactNode }) {
    return (
        <GlassCard
            padding="24px"
            style={{
                borderColor: accent || undefined,
                boxShadow: accent ? `0 0 0 1px ${accent} inset, 0 2px 16px rgba(26,10,0,0.06)` : undefined,
            }}
        >
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
                        {helpText ? <HelpBubble text={helpText} /> : null}
                    </div>
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
        <GlassCard padding="24px" noHover>
            <div style={{ borderRadius: 18, border: `1px dashed ${COLORS.border}`, background: 'rgba(255,255,255,0.45)', padding: 24, textAlign: 'center' }}>
                <BarChart3 size={34} style={{ color: COLORS.border, margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.ink }}>{title}</p>
                <p style={{ marginTop: 6, fontSize: 13, color: COLORS.muted, lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{copy}</p>
            </div>
        </GlassCard>
    );
}

export default function InfluencerInstagramAnalyticsPage() {
    const { data: profile, loading: profileLoading } = useApi<InfluencerProfile>('/profile/influencer/me');
    const [analytics, setAnalytics] = useState<Influencer60DayAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadAnalytics() {
            setLoading(true);
            setError('');
            try {
                const response = await influencerAPI.getInstagram60DayAnalytics();
                if (!cancelled) {
                    setAnalytics(response.data || null);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setAnalytics(null);
                    setError(err?.response?.data?.message || err?.message || 'Unable to load Instagram analytics.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadAnalytics();
        return () => {
            cancelled = true;
        };
    }, []);

    const summary = analytics?.summary;
    const influencer = analytics?.influencer;
    const authenticityLow = (summary?.authenticity_score ?? 0) < 50;
    const costPerEngagementHigh = summary?.cost_per_engagement != null && summary.cost_per_engagement >= 0.12;
    const totalPosts = summary?.total_posts ?? 0;

    const summaryCards = summary ? [
        {
            label: 'Final Score',
            value: formatNumber(summary.final_score ?? analytics?.roi?.final_score),
            tone: toneForRatingTier(summary.rating_tier || analytics?.roi?.rating_tier),
            note: 'A blended score based on engagement, growth, authenticity, consistency, and cost efficiency.',
            helpText: 'This helps you compare your overall Instagram performance at a glance.',
        },
        {
            label: 'Rating Tier',
            value: summary.rating_tier || analytics?.roi?.rating_tier || 'Needs Review',
            tone: toneForRatingTier(summary.rating_tier || analytics?.roi?.rating_tier),
            note: 'A simple label that translates the score into a quick signal.',
            helpText: 'Elite is strongest, Good is healthy, Average is mixed, and Needs Review means closer inspection is needed.',
        },
        {
            label: 'Avg Engagement Rate (60d)',
            value: formatPercent(summary.average_engagement_rate, 2),
            tone: toneForMetric(summary.average_engagement_rate || 0, 'engagement'),
            note: 'Average engagement across posts in the last 60 days.',
            helpText: 'Shows how much the audience usually interacts with each post.',
        },
        {
            label: 'Average Views',
            value: formatCompact(summary.average_views),
            tone: COLORS.ink,
            note: 'Average views across the last 60 days of tracked posts.',
            helpText: 'This is the average view count per post in the selected period.',
        },
        {
            label: 'Posts Analyzed',
            value: formatNumber(totalPosts),
            tone: COLORS.ink,
            note: 'Number of posts included in the 60-day window.',
            helpText: 'This is the sample size behind the report. More posts usually means more reliable averages.',
        },
        {
            label: 'View Rate',
            value: formatPercent(summary.view_rate, 2),
            tone: '#0284c7',
            note: 'Average views as a share of the current follower base.',
            helpText: 'A simple way to see how much of the follower base actually sees the content.',
        },
        {
            label: 'Growth Rate',
            value: formatPercent(summary.follower_growth_rate, 1),
            tone: toneForMetric(summary.follower_growth_rate || 0, 'growth'),
            note: 'Follower change measured across the last 60 days.',
            helpText: 'Positive numbers mean the audience grew. Negative numbers mean the audience shrank.',
        },
        {
            label: 'Cost / View',
            value: formatCurrency(summary.cost_per_view),
            tone: COLORS.amber,
            note: 'Estimated cost efficiency based on stored pricing and performance data.',
            helpText: 'How much the expected campaign budget would pay for one view.',
        },
        {
            label: 'Cost / Engagement',
            value: formatCurrency(summary.cost_per_engagement),
            tone: COLORS.amber,
            note: 'Estimated cost per interaction in the last 60 days.',
            helpText: 'How much the expected campaign budget would pay for one like, comment, share, or save.',
            accent: costPerEngagementHigh ? 'rgba(245,158,11,0.35)' : undefined,
        },
    ] : [];

    const radarData = analytics?.radar || [
        { metric: 'Engagement', value: Math.min((summary?.average_engagement_rate || 0) * 12, 100) },
        { metric: 'View Rate', value: Math.min((summary?.view_rate || 0) * 8, 100) },
        { metric: 'Authenticity', value: summary?.authenticity_score || 0 },
        { metric: 'Growth', value: Math.max((summary?.follower_growth_rate || 0) > 0 ? Math.min((summary?.follower_growth_rate || 0) * 2, 100) : 0, 0) },
        { metric: 'Cost Efficiency', value: Math.max(0, 100 - ((summary?.cost_per_view || 0) / 0.05) * 100) },
        { metric: 'Consistency', value: summary?.consistency_score || 0 },
    ];

    const engagementBreakdown = analytics?.engagement_breakdown || [
        { name: 'Likes', value: summary?.average_likes || 0 },
        { name: 'Comments', value: summary?.average_comments || 0 },
        { name: 'Shares', value: 0 },
        { name: 'Saves', value: 0 },
    ].filter((item) => item.value > 0);

    const contentData = [
        { name: 'Photo', value: analytics?.content_distribution.photo_count || 0 },
        { name: 'Video', value: analytics?.content_distribution.video_count || 0 },
        { name: 'Reel', value: analytics?.content_distribution.reel_count || 0 },
        { name: 'Story', value: analytics?.content_distribution.story_count || 0 },
    ].filter((item) => item.value > 0);

    const engagementTrendNegative = (analytics?.trends.engagement_rate_over_time || []).length >= 2
        ? analytics!.trends.engagement_rate_over_time[0].engagementRate > analytics!.trends.engagement_rate_over_time[analytics!.trends.engagement_rate_over_time.length - 1].engagementRate
        : false;
    const followerTrendNegative = (analytics?.trends.follower_count_over_time || []).length >= 2
        ? analytics!.trends.follower_count_over_time[0].followers > analytics!.trends.follower_count_over_time[analytics!.trends.follower_count_over_time.length - 1].followers
        : false;

    const roi = analytics?.roi || {
        predicted_roi: summary?.predicted_roi ?? null,
        estimated_media_value: summary?.estimated_media_value ?? null,
        final_score: summary?.final_score ?? 0,
        rating_tier: summary?.rating_tier || 'Needs Review',
    };

    if (loading || profileLoading) {
        return (
            <ProtectedRoute allowedRoles={['influencer']}>
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
                        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                            {Array.from({ length: 9 }).map((_, index) => (
                                <GlassCard key={index} padding="18px" noHover>
                                    <SkeletonBox height={12} width={110} />
                                    <SkeletonBox height={30} width="70%" style={{ marginTop: 12 }} />
                                    <SkeletonBox height={12} width="90%" style={{ marginTop: 12 }} />
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <GlassCard padding="28px">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div style={{ maxWidth: 820, display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <div style={{ width: 88, height: 88, borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,0.72)', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.orange, fontSize: 28, fontWeight: 800, flexShrink: 0 }}>
                                    {(() => {
                                        const avatar = profile?.profilePictureUrl || profile?.instagramDPURL || influencer?.profilePictureUrl || null;
                                        const fallback = (influencer?.name || profile?.fullName || 'IG').trim().slice(0, 2).toUpperCase();
                                        return avatar ? (
                                            <img
                                                src={avatar}
                                                alt={influencer?.name || profile?.fullName || 'Influencer'}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : fallback;
                                    })()}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Instagram Analytics</p>
                                    <h1 style={{ marginTop: 8, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: COLORS.ink }}>
                                        {profile?.fullName || influencer?.name || 'Your profile'}
                                    </h1>
                                    <p style={{ marginTop: 8, fontSize: 14, color: COLORS.muted, lineHeight: 1.7 }}>
                                        A clean 60-day snapshot with engagement, content, follower growth, authenticity, and audience demographics.
                                    </p>
                                    <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.6)', border: `1px solid ${COLORS.border}`, color: COLORS.ink, fontSize: 13, fontWeight: 700 }}>
                                            <Users size={14} />
                                            {formatCompact(influencer?.followers || profile?.followersCount || profile?.igFollowersCount)} followers
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: COLORS.green, fontSize: 13, fontWeight: 700 }}>
                                            <CheckCircle2 size={14} />
                                            {profile?.instagramConnected || profile?.instagramConnectionStatus === 'connected' ? 'Connected' : 'Visible'}
                                        </span>
                                        {profile?.instagramUsername || influencer?.username ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.6)', border: `1px solid ${COLORS.border}`, color: COLORS.ink, fontSize: 13, fontWeight: 700 }}>
                                                @{profile?.instagramUsername || influencer?.username}
                                            </span>
                                        ) : null}
                                        {summary ? (
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '8px 12px',
                                                    borderRadius: 999,
                                                    background: authenticityLow ? 'rgba(220,38,38,0.08)' : 'rgba(16,185,129,0.12)',
                                                    border: `1px solid ${authenticityLow ? 'rgba(220,38,38,0.22)' : 'rgba(16,185,129,0.22)'}`,
                                                    color: authenticityLow ? COLORS.red : COLORS.green,
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {authenticityLow ? <CircleAlert size={14} /> : <CheckCircle2 size={14} />}
                                                Authenticity {formatPercent(summary.authenticity_score, 0)}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'inline-flex', gap: 8, padding: 6, borderRadius: 999, border: `1px solid ${COLORS.border}`, background: 'rgba(255,255,255,0.6)', color: COLORS.orange, fontSize: 12, fontWeight: 800 }}>
                                <RefreshCw size={14} />
                                Last 60 Days
                            </div>
                        </div>
                    </GlassCard>

                    {error ? (
                        <GlassCard padding="24px">
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Instagram Analytics</p>
                            <h2 style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: COLORS.ink }}>Unable to load analytics</h2>
                            <p style={{ marginTop: 8, fontSize: 14, color: COLORS.muted, lineHeight: 1.7 }}>{error}</p>
                        </GlassCard>
                    ) : null}

                    {!summary ? (
                        <EmptyState title="No analytics yet" copy="We could not find enough Instagram analytics for the last 60 days. Connect or sync your profile data and try again." />
                    ) : (
                        <>
                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                {summaryCards.map((card) => (
                                    <MetricCard key={card.label} label={card.label} value={card.value} tone={card.tone} note={card.note} helpText={card.helpText} accent={card.accent} />
                                ))}
                            </div>

                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
                                <ChartShell title="Instagram Score Radar" subtitle="A normalized view of your 60-day fit across core performance factors." icon={<Radar size={16} />} helpText="Each axis shows how this profile is performing relative to healthy brand-review benchmarks." accent={authenticityLow ? 'rgba(220,38,38,0.25)' : undefined}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.muted, fontSize: 12, fontWeight: 700 }} />
                                            <RechartsRadar dataKey="value" stroke={COLORS.orange} fill={COLORS.orange} fillOpacity={0.22} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </ChartShell>

                                <ChartShell title="ROI / EMV" subtitle="A brand-friendly estimate of current commercial value." icon={<BadgeDollarSign size={16} />} helpText="These values are estimates based on your 60-day data and stored pricing assumptions.">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
                                        <MetricCard label="Predicted ROI" value={formatPercent(roi.predicted_roi, 1)} tone={(roi.predicted_roi || 0) >= 0 ? COLORS.green : COLORS.red} note="Estimated return on a hypothetical campaign budget." />
                                        <MetricCard label="Estimated Media Value" value={formatCurrency(roi.estimated_media_value)} tone="#0284c7" note="Approximate media value using reach and views from the 60-day window." />
                                        <MetricCard label="Final Score" value={formatNumber(roi.final_score)} tone={toneForRatingTier(roi.rating_tier)} note="The same blended score brands use to compare creators quickly." />
                                        <MetricCard label="Rating Tier" value={roi.rating_tier || 'Needs Review'} tone={toneForRatingTier(roi.rating_tier)} note="Simple label for fast decision-making." />
                                    </div>
                                </ChartShell>
                            </div>

                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
                                <ChartShell title="Engagement Trend" subtitle="Average engagement rate over the 60-day window." icon={<TrendingUp size={16} />} helpText="Hover the line points to see the exact date and value.">
                                    {analytics?.trends.engagement_rate_over_time?.length ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={analytics.trends.engagement_rate_over_time}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,80,48,0.12)" />
                                                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 12 }} />
                                                <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="engagementRate" stroke={COLORS.orange} strokeWidth={2.5} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No engagement trend" copy="No recent posts were available for the selected 60-day period." />
                                    )}
                                </ChartShell>

                                <ChartShell title="Follower Trend" subtitle="How the audience base moved over time." icon={<Users size={16} />} helpText="This shows the audience trend across the same 60-day window.">
                                    {analytics?.trends.follower_count_over_time?.length ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={analytics.trends.follower_count_over_time}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,80,48,0.12)" />
                                                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 12 }} />
                                                <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="followers" stroke={followerTrendNegative ? COLORS.red : COLORS.green} strokeWidth={2.5} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No follower trend" copy="We need historical snapshots to draw the follower trend for the selected period." />
                                    )}
                                </ChartShell>
                            </div>

                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
                                <ChartShell title="Posts per Week" subtitle="Posting cadence across the last 60 days." icon={<BarChart3 size={16} />} helpText="This helps you see how consistently the profile posts.">
                                    {analytics?.trends.posts_per_week?.length ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={analytics.trends.posts_per_week}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,80,48,0.12)" />
                                                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 12 }} />
                                                <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} />
                                                <Tooltip />
                                                <Bar dataKey="postsCount" fill={COLORS.orange} radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No posts in this window" copy="There were no recent posts in the selected 60-day period." />
                                    )}
                                </ChartShell>

                                <ChartShell title="Content Distribution" subtitle="How the profile posts content over the 60-day window." icon={<PieChartIcon size={16} />} helpText="The donut shows the post types that make up the selected time period.">
                                    {contentData.length ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie data={contentData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                                                    {contentData.map((entry, index) => (
                                                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No content mix yet" copy="We need recent posts to show the content distribution chart." />
                                    )}
                                </ChartShell>
                            </div>

                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
                                <ChartShell title="Demographics" subtitle="Audience breakdown from the same 60-day source data." icon={<Globe2 size={16} />} helpText="These charts summarize where the audience is, who they are, and age ranges.">
                                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                        <div>
                                            <p style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Locations</p>
                                            {analytics?.demographics.locations?.length ? (
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <PieChart>
                                                        <Pie data={analytics.demographics.locations.slice(0, 5)} dataKey="percent" nameKey="region" innerRadius={56} outerRadius={90} paddingAngle={3}>
                                                            {analytics.demographics.locations.slice(0, 5).map((entry, index) => (
                                                                <Cell key={entry.region} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="No location data" copy="Audience location data is not available for this profile yet." />
                                            )}
                                        </div>

                                        <div>
                                            <p style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gender</p>
                                            {analytics?.demographics.genders?.length ? (
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <PieChart>
                                                        <Pie data={analytics.demographics.genders} dataKey="percent" nameKey="gender" innerRadius={56} outerRadius={90} paddingAngle={3}>
                                                            {analytics.demographics.genders.map((entry, index) => (
                                                                <Cell key={entry.gender} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState title="No gender data" copy="Audience gender data is not available for this profile yet." />
                                            )}
                                        </div>
                                    </div>
                                </ChartShell>

                                <ChartShell title="Engagement Breakdown" subtitle="What the audience interacts with most." icon={<Heart size={16} />} helpText="This bar chart shows the total likes, comments, shares, and saves in the 60-day window.">
                                    {engagementBreakdown.length ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={engagementBreakdown}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,80,48,0.12)" />
                                                <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 12 }} />
                                                <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} />
                                                <Tooltip />
                                                <Bar dataKey="value" fill={COLORS.orange} radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No engagement breakdown" copy="There is not enough post activity to show engagement breakdown yet." />
                                    )}
                                </ChartShell>
                            </div>

                            <ChartShell title="Recent Posts" subtitle="Latest posts used in the 60-day report." icon={<Send size={16} />} helpText="Each row is a recent post and the engagement it contributed to this report.">
                                {analytics.posts?.length ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: `1px solid ${COLORS.border}` }}>
                                                    <th style={{ padding: '12px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.muted }}>Date</th>
                                                    <th style={{ padding: '12px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.muted }}>Type</th>
                                                    <th style={{ padding: '12px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.muted }}>Likes</th>
                                                    <th style={{ padding: '12px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.muted }}>Comments</th>
                                                    <th style={{ padding: '12px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.muted }}>Engagement</th>
                                                    <th style={{ padding: '12px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.muted }}>Reach / Impressions</th>
                                                    <th style={{ padding: '12px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.muted }}>Views</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics.posts.slice(0, 12).map((post) => (
                                                    <tr key={post.postId} style={{ borderBottom: `1px solid rgba(237,217,188,0.55)` }}>
                                                        <td style={{ padding: '12px 10px', fontSize: 13, color: COLORS.ink }}>{new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: 13, color: COLORS.ink }}>{post.type}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: 13, color: COLORS.ink }}>{formatNumber(post.likes)}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: 13, color: COLORS.ink }}>{formatNumber(post.comments)}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: 13, color: COLORS.ink }}>{formatPercent(post.engagement_rate, 2)}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: 13, color: COLORS.ink }}>{formatNumber(post.reach)} / {formatNumber(post.impressions)}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: 13, color: COLORS.ink }}>{formatNumber(post.impressions)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <EmptyState title="No recent posts" copy="There are no posts in the last 60 days to display here." />
                                )}
                            </ChartShell>
                        </>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
