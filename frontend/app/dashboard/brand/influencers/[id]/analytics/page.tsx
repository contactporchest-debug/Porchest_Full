'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    BarChart3,
    Camera,
    CheckCircle2,
    Globe2,
    Heart,
    Loader2,
    MessageCircle,
    PieChart as PieChartIcon,
    RefreshCw,
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
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GlassCard, GlowButton } from '@/components/ui';
import { brandAPI } from '@/lib/api';

type AnalyticsPost = {
    postId: string;
    timestamp: string;
    type: 'photo' | 'video' | 'reel' | 'story' | string;
    likes: number;
    comments: number;
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
    };
    trends: {
        engagement_rate_over_time: Array<{ date: string; label: string; engagementRate: number }>;
        follower_count_over_time: Array<{ date: string; label: string; followers: number }>;
        posting_frequency_over_time: Array<{ label: string; postsCount: number }>;
    };
    content_distribution: {
        photo_count: number;
        video_count: number;
        reel_count: number;
        story_count: number;
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
    cream: 'rgba(255,255,255,0.45)',
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

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function MetricCard({ label, value, tone, note }: { label: string; value: string; tone: string; note?: string }) {
    return (
        <GlassCard padding="18px" noHover>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            <p style={{ marginTop: 10, fontSize: 26, fontWeight: 800, color: tone, letterSpacing: '-0.03em' }}>{value}</p>
            {note ? <p style={{ marginTop: 8, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{note}</p> : null}
        </GlassCard>
    );
}

function ChartShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <GlassCard padding="24px">
            <div style={{ marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
                {subtitle ? <p style={{ marginTop: 6, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{subtitle}</p> : null}
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

export default function BrandInfluencer60DayAnalyticsPage() {
    const params = useParams();
    const influencerId = typeof params?.id === 'string' ? params.id : '';
    const [data, setData] = useState<BrandInfluencerAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'photos' | 'reels' | 'videos'>('all');

    const load = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError('');

        try {
            const response = await brandAPI.getInfluencer60DayAnalytics(influencerId);
            setData(response.data || null);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.response?.data?.error || 'Unable to fetch analytics.');
            setData(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void load();
    }, [influencerId]);

    const summary = data?.summary;
    const influencer = data?.influencer;
    const posts = useMemo(() => (Array.isArray(data?.posts) ? data!.posts : []).filter((post) => typeMatches(filter, post.type)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [data?.posts, filter]);
    const contentData = [
        { name: 'Photo', value: data?.content_distribution.photo_count || 0 },
        { name: 'Video', value: data?.content_distribution.video_count || 0 },
        { name: 'Reel', value: data?.content_distribution.reel_count || 0 },
        { name: 'Story', value: data?.content_distribution.story_count || 0 },
    ].filter((item) => item.value > 0);

    const genders = data?.demographics.genders || [];
    const ages = data?.demographics.ages || [];
    const locations = data?.demographics.locations || [];

    const summaryCards = [
        {
            label: 'Avg Engagement Rate (60d)',
            value: formatPercent(summary?.average_engagement_rate, 2),
            tone: toneForMetric(summary?.average_engagement_rate || 0, 'engagement'),
            note: 'Average engagement across posts in the last 60 days.',
        },
        {
            label: 'Avg Likes',
            value: formatCompact(summary?.average_likes),
            tone: COLORS.ink,
            note: 'Average likes per post in the selected window.',
        },
        {
            label: 'Avg Comments',
            value: formatCompact(summary?.average_comments),
            tone: COLORS.ink,
            note: 'Average comments per post in the selected window.',
        },
        {
            label: 'Follower Growth',
            value: formatPercent(summary?.follower_growth_rate, 1),
            tone: toneForMetric(summary?.follower_growth_rate || 0, 'growth'),
            note: 'Follower change over the last 60 days.',
        },
        {
            label: 'Authenticity Score',
            value: formatNumber(summary?.authenticity_score),
            tone: toneForMetric(summary?.authenticity_score || 0, 'authenticity'),
            note: 'Heuristic score based on engagement, stability, and growth.',
        },
    ];

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['brand']}>
                <DashboardLayout>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: COLORS.orange }}>
                        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
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
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Influencer Analytics</p>
                        <h1 style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: COLORS.ink }}>Unable to load analytics</h1>
                        <p style={{ marginTop: 8, fontSize: 14, color: COLORS.muted, lineHeight: 1.7 }}>{error || 'This influencer analytics report is not available right now.'}</p>
                        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Link href="/dashboard/brand/influencers" style={{ textDecoration: 'none' }}>
                                <GlowButton variant="outline">
                                    <ArrowLeft size={14} />
                                    Back to Influencers
                                </GlowButton>
                            </Link>
                            <GlowButton onClick={() => void load()} loading={refreshing}>
                                <RefreshCw size={14} />
                                Retry
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
                                <Link href={`/dashboard/brand/influencers/${influencer.userId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.orange, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                                    <ArrowLeft size={14} />
                                    Back to profile
                                </Link>
                                <p style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Influencer Analytics</p>
                                <h1 style={{ marginTop: 8, fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: COLORS.ink }}>{influencer.name}</h1>
                                <p style={{ marginTop: 8, fontSize: 14, color: COLORS.muted, lineHeight: 1.7 }}>
                                    A 60-day performance snapshot with engagement, content, follower growth, authenticity, and audience demographics.
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
                                <GlowButton variant="outline" onClick={() => void load(true)} loading={refreshing}>
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
                        <ChartShell title="Engagement Rate" subtitle="Daily engagement rate across the last 60 days.">
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

                        <ChartShell title="Follower Count" subtitle="Snapshot trend for the same 60-day window.">
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
                        <ChartShell title="Posts per Week" subtitle="Posting activity grouped into weekly buckets.">
                            {Array.isArray(data.trends.posting_frequency_over_time) && data.trends.posting_frequency_over_time.length ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={data.trends.posting_frequency_over_time}>
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

                        <ChartShell title="Content Distribution" subtitle="How the last 60 days of content is split by post type.">
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
                        <ChartShell title="Audience Locations" subtitle="Top audience regions available in the stored insights.">
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

                        <ChartShell title="Gender Split" subtitle="Audience gender distribution from profile insights.">
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

                    <ChartShell title="Age Ranges" subtitle="Audience age distribution across the stored demographic insight set.">
                        {ages.length ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={ages}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                    <XAxis dataKey="range" tick={{ fontSize: 12, fill: COLORS.muted }} />
                                    <YAxis tick={{ fontSize: 12, fill: COLORS.muted }} />
                                    <Tooltip />
                                    <Bar dataKey="percent" fill={COLORS.orange} radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState title="No age insights available" copy="Age buckets will show up once demographic data exists for this influencer." />
                        )}
                    </ChartShell>

                    <GlassCard padding="24px">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Posts</p>
                                <h2 style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: COLORS.ink }}>Last 60 days</h2>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {(['all', 'photos', 'reels', 'videos'] as const).map((nextFilter) => (
                                    <button
                                        key={nextFilter}
                                        onClick={() => setFilter(nextFilter)}
                                        style={{
                                            borderRadius: 999,
                                            border: `1px solid ${filter === nextFilter ? COLORS.orange : COLORS.border}`,
                                            background: filter === nextFilter ? 'rgba(194,52,10,0.1)' : 'rgba(255,255,255,0.6)',
                                            color: filter === nextFilter ? COLORS.orange : COLORS.muted,
                                            padding: '8px 12px',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {nextFilter === 'all' ? 'All' : nextFilter.charAt(0).toUpperCase() + nextFilter.slice(1)}
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
                                                    {formatDate(post.timestamp)}
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
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
