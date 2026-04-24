'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Instagram, Zap, Users, TrendingUp, BarChart2, Activity, Heart, MessageCircle,
    Star, Target, Clock, Eye, Bookmark, Search, AlertCircle, ExternalLink, ArrowUpRight,
    ArrowDownRight, Minus, Lightbulb, ChevronDown,
} from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
    ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
    AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
    ScatterChart, Scatter, RadialBarChart, RadialBar, PieChart, Pie, Cell,
    ReferenceLine,
} from 'recharts';

/* ─── Color palette ─────────────────────────────────────────── */
const C = {
    purple: '#7B3FF2',
    violet: '#A855F7',
    pink: '#fb7185',
    amber: '#f59e0b',
    teal: '#14b8a6',
    blue: '#60a5fa',
    green: '#4ade80',
    red: '#f87171',
    indigo: '#6366f1',
    lavender: '#a78bfa',
};

const SURFACE = '#ffffff';
const SURFACE_ALT = '#f8fafc';
const BORDER = 'rgba(148, 163, 184, 0.22)';
const BORDER_STRONG = 'rgba(148, 163, 184, 0.34)';
const TEXT = '#0f172a';
const MUTED = '#64748b';

/* ─── Recharts custom tooltip ────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(123,63,242,0.18)',
            borderRadius: 14, padding: '12px 16px', fontSize: 12, color: TEXT,
            boxShadow: '0 20px 40px rgba(15,23,42,0.14)',
        }}>
            {label && <p style={{ color: MUTED, marginBottom: 6, fontSize: 11 }}>{label}</p>}
            {payload.map((e: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color || C.purple }} />
                    <span style={{ color: MUTED, fontSize: 11 }}>{e.name}:</span>
                    <span style={{ fontWeight: 700, color: TEXT }}>
                        {typeof e.value === 'number' ? e.value.toLocaleString() : e.value}
                        {e.unit || ''}
                    </span>
                </div>
            ))}
        </div>
    );
};

/* ─── Data builders (real data only) ──────────────────────────── */
const formatDay = (value: string | Date) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const makeEngagementTrend = (mediaArr: any[], followersCount: number, days: number) =>
    mediaArr
        .filter((m) => m?.timestamp)
        .map((m) => {
            const likes = m.likeCount || 0;
            const comments = m.commentsCount || 0;
            const base = followersCount > 0 ? ((likes + comments) / followersCount) * 100 : 0;
            return {
                ts: new Date(m.timestamp).getTime(),
                date: formatDay(m.timestamp),
                rate: +base.toFixed(2),
            };
        })
        .filter((m) => m.ts >= Date.now() - days * 86400000)
        .sort((a, b) => a.ts - b.ts)
        .slice(-12);

const makeLikesCommentsTrend = (mediaArr: any[], days: number) =>
    mediaArr
        .filter((m) => m?.timestamp)
        .map((m) => ({
            ts: new Date(m.timestamp).getTime(),
            date: formatDay(m.timestamp),
            likes: m.likeCount || 0,
            comments: m.commentsCount || 0,
        }))
        .filter((m) => m.ts >= Date.now() - days * 86400000)
        .sort((a, b) => a.ts - b.ts)
        .slice(-12);

const makePostingCadence = (mediaArr: any[], days: number) => {
    const dailyCounts = new Map();

    mediaArr
        .filter((m) => m?.timestamp)
        .forEach((m) => {
            const key = new Date(m.timestamp).toISOString().slice(0, 10);
            dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1);
        });

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        data.push({
            date: formatDay(d),
            posts: dailyCounts.get(key) || 0,
        });
    }
    return data;
};

const makeMediaScatter = (mediaArr: any[]) =>
    mediaArr.slice(0, 12).map((m, i) => ({
        name: `Post ${i + 1}`,
        likes: m.likeCount || 0,
        comments: m.commentsCount || 0,
        engagement: (m.likeCount || 0) + (m.commentsCount || 0),
    }));

const makeQualityGauge = (score: number) => [
    { name: 'Score', value: score, fill: score >= 75 ? C.green : score >= 50 ? C.violet : score >= 25 ? C.amber : C.red },
    { name: 'Remaining', value: 100 - score, fill: 'rgba(148, 163, 184, 0.18)' },
];

/* ─── Types ─────────────────────────────────────────────────── */
interface DerivedMetrics {
    followersCount?: number; avgLikes?: number; avgComments?: number;
    engagementRate?: number; growthRate?: number; postsLast7Days?: number;
    postsLast30Days?: number; efficiencyRate?: number; qualityScore?: number;
    scoreLabel?: string; topPostScore?: number; topReelScore?: number;
    likeToCommentRatio?: number | null; postsAnalyzed?: number; lastSyncedAt?: string;
    avgViews?: number; avgReach?: number; averageEngagement?: number; averageReach?: number;
    viewRate?: number; postingFrequency?: number; consistencyScore?: number;
    authenticityScore?: number; engagementQualityScore?: number; viralityScore?: number;
    influencerScore?: number; costPerView?: number | null; costPerEngagement?: number | null;
    accountReach?: number; accountImpressions?: number; profileViews?: number; websiteClicks?: number;
}
interface IGConnection {
    followersCount?: number; followsCount?: number; mediaCount?: number;
    username?: string; profilePictureURL?: string; lastSyncedAt?: string; isConnected?: boolean;
}
interface PostLookupResult {
    media: { caption?: string; permalink?: string; mediaType?: string; timestamp?: string; likeCount?: number; commentsCount?: number; thumbnailUrl?: string; mediaUrl?: string; };
    insight?: { reach?: number; impressions?: number; saved?: number; videoViews?: number; };
    postMetrics: { engagementTotal?: number; engagementRateByFollowers?: number; engagementRateByReach?: number | null; engagementPerImpression?: number | null; likeToCommentRatio?: number | null; savesPerReach?: number | null; commentRate?: number; };
    comments?: { text: string; username: string; timestamp: string }[];
}

/* ─── Helpers ───────────────────────────────────────────────── */
const fmt = (v: number | null | undefined, suffix = '', d = 1) => v != null ? `${v.toFixed(d)}${suffix}` : '—';
const fmtMoney = (v: number | null | undefined, d = 4) => v != null ? `$${v.toFixed(d)}` : '—';
const fmtK = (v: number | null | undefined) => {
    if (v == null) return '—';
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return String(v);
};

/* ─── Shared small components ────────────────────────────────── */
const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, marginTop: 36 }}>
            <div style={{ width: 3, height: 20, borderRadius: 4, background: 'linear-gradient(180deg,#A855F7,#7B3FF2)' }} />
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</h3>
        {icon && <div style={{ marginLeft: 'auto', color: MUTED }}>{icon}</div>}
    </div>
);

const ChartCard = ({ children, title, subtitle, style }: { children: React.ReactNode; title?: string; subtitle?: string; style?: React.CSSProperties }) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 24, padding: 24, boxShadow: '0 18px 34px rgba(15,23,42,0.05)', ...style }}>
        {title && <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: TEXT, marginBottom: 2 }}>{title}</p>}
        {subtitle && <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>{subtitle}</p>}
        {children}
    </motion.div>
);

const StatChip = ({ label, value, color = C.lavender }: { label: string; value: string; color?: string }) => (
    <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: 12, background: SURFACE_ALT, border: `1px solid ${BORDER}` }}>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color }}>{value}</p>
        <p style={{ fontSize: 10, color: MUTED, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    </div>
);

const TimePill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{
        padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        background: active ? 'linear-gradient(135deg,#7B3FF2,#A855F7)' : SURFACE_ALT,
        border: active ? 'none' : `1px solid ${BORDER}`,
        color: active ? '#fff' : MUTED,
        fontFamily: 'inherit', transition: 'all 200ms ease',
        boxShadow: active ? '0 14px 26px rgba(123,63,242,0.18)' : 'none',
    }}>{label}</button>
);

const InsightCard = ({ text, icon }: { text: string; icon?: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.15)' }}>
        <div style={{ color: C.lavender, flexShrink: 0, marginTop: 1 }}>{icon || <Lightbulb size={14} />}</div>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{text}</p>
    </div>
);

const EmptyChartState = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, textAlign: 'center', color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
        <div>{text}</div>
    </div>
);

/* ─── Main Component ─────────────────────────────────────────── */
export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<DerivedMetrics | null>(null);
    const [connection, setConnection] = useState<IGConnection | null>(null);
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<7 | 30 | 60>(30);
    const [postUrl, setPostUrl] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupResult, setLookupResult] = useState<PostLookupResult | null>(null);
    const [lookupError, setLookupError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [analyticsRes, profileRes, mediaRes] = await Promise.all([
                influencerAPI.getInstagramAnalytics(),
                influencerAPI.getInstagramProfile(),
                influencerAPI.getInstagramMedia(),
            ]);
            setAnalytics(analyticsRes.data.analytics || null);
            setConnection(profileRes.data.connection || null);
            setMedia(mediaRes.data.media || []);
        } catch { toast.error('Failed to load analytics'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleLookup = async () => {
        if (!postUrl.trim()) return toast.error('Enter a post URL');
        setLookupLoading(true); setLookupResult(null); setLookupError('');
        try {
            const res = await influencerAPI.lookupPost(postUrl.trim());
            setLookupResult(res.data);
        } catch (err: any) {
            setLookupError(err?.response?.data?.message || 'Post not found. Refresh sync and try again.');
        } finally { setLookupLoading(false); }
    };

    /* Memoized chart data — regenerates when timeRange or analytics changes */
    const followerData: any[] = [];

    const engagementData = useMemo(() =>
        makeEngagementTrend(media, analytics?.followersCount ?? connection?.followersCount ?? 0, timeRange),
        [timeRange, media, analytics?.followersCount, connection?.followersCount]);

    const likesCommentsData = useMemo(() =>
        makeLikesCommentsTrend(media, timeRange),
        [timeRange, media]);

    const cadenceData = useMemo(() => makePostingCadence(media, timeRange), [timeRange, media]);

    const mediaScatter = useMemo(() => makeMediaScatter(media), [media]);

    const qualityGauge = useMemo(() => makeQualityGauge(analytics?.qualityScore ?? 0), [analytics?.qualityScore]);

    const radialData = useMemo(() => [
        { name: 'Efficiency', value: Math.min(100, Math.round(((analytics?.efficiencyRate ?? 0) / 50) * 100)), fill: C.teal },
    ], [analytics?.efficiencyRate]);

    /* Actionable insights generation */
    const insights = useMemo(() => {
        const list: string[] = [];
        const er = analytics?.engagementRate ?? 0;
        const p7 = analytics?.postsLast7Days ?? 0;
        const qs = analytics?.qualityScore ?? 0;
        const ratio = analytics?.likeToCommentRatio ?? null;
        if (er < 2) list.push('Your engagement rate is below 2%. Try posting more interactive content like polls, questions, or carousels to boost audience interaction.');
        else if (er >= 6) list.push('🔥 Excellent engagement rate! Keep your current content strategy — your audience is very active.');
        if (p7 < 2) list.push('You\'ve posted fewer than 2 times this week. Consistent posting (3-5×/week) significantly improves algorithmic reach on Instagram.');
        if (p7 >= 5) list.push('Great posting frequency this week! Maintain consistency and vary your content types to keep engagement high.');
        if (qs >= 75) list.push('Your quality score is excellent. Your content resonates well with your audience — maintain this standard.');
        else if (qs < 40) list.push('Your quality score is low. Focus on creating high-quality visuals and compelling captions to improve performance.');
        if (ratio != null && ratio > 30) list.push(`Your like-to-comment ratio is ${ratio.toFixed(1)}x — very high. Consider asking questions in your captions to drive more comments.`);
        if (list.length === 0) list.push('Connect more posts and let your data accumulate to receive personalized actionable insights based on your performance trends.');
        return list;
    }, [analytics]);

    const isConnected = connection?.isConnected;

    if (loading) return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: MUTED, flexDirection: 'column', gap: 14 }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: C.violet }} />
                    <p style={{ fontSize: 14 }}>Loading your analytics...</p>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    if (!isConnected) return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ textAlign: 'center', padding: '80px 20px', background: SURFACE, borderRadius: 28, border: '1px solid rgba(168,85,247,0.15)', boxShadow: '0 18px 34px rgba(15,23,42,0.05)' }}>
                    <Instagram size={48} style={{ color: C.lavender, margin: '0 auto 16px' }} />
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: TEXT, marginBottom: 8 }}>Instagram Not Connected</h2>
                    <p style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>Connect your Instagram account to unlock all analytics and charts.</p>
                    <a href="/dashboard/influencer/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 99, background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                        <Instagram size={14} /> Go to Profile → Connect
                    </a>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    const followers = analytics?.followersCount ?? connection?.followersCount ?? 0;
    const er = analytics?.engagementRate ?? 0;

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                    {/* ── Header ── */}
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 99, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', marginBottom: 8 }}>
                                <Instagram size={10} style={{ color: C.lavender }} />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Instagram Analytics</span>
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.3rem,3vw,2rem)', color: TEXT, letterSpacing: '-0.03em' }}>
                                @{connection?.username || '—'} Analytics
                            </h1>
                            {connection?.lastSyncedAt && <p style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Last synced: {new Date(connection.lastSyncedAt).toLocaleString()}</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            {/* Time range filter */}
                            <div style={{ display: 'flex', gap: 6, padding: '4px', borderRadius: 99, background: SURFACE_ALT, border: `1px solid ${BORDER}` }}>
                                {([7, 30, 60] as const).map(d => (
                                    <TimePill key={d} label={`${d}D`} active={timeRange === d} onClick={() => setTimeRange(d)} />
                                ))}
                            </div>
                            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: C.lavender, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                                <RefreshCw size={13} /> Refresh
                            </button>
                        </div>
                    </motion.div>

                    {/* Verified data banner */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', marginBottom: 28, fontSize: 12, color: 'rgba(74,222,128,0.85)' }}>
                        <Zap size={13} /> <strong>Verified Data</strong> — Metrics shown here come from your synced Instagram account and recent fetched media only.
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        SECTION 1 — ACCOUNT OVERVIEW
                    ════════════════════════════════════════════════════════ */}
                    <SectionTitle icon={<Users size={14} />}>Account Overview</SectionTitle>

                    {/* Stat chips row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
                        <StatChip label="Followers" value={fmtK(followers)} color={C.violet} />
                        <StatChip label="Following" value={fmtK(connection?.followsCount)} color={C.blue} />
                        <StatChip label="Total Media" value={fmtK(connection?.mediaCount)} color={C.indigo} />
                        <StatChip label="Posts Analyzed" value={String(analytics?.postsAnalyzed ?? '—')} color={C.lavender} />
                        <StatChip label="Growth Rate" value={fmt(analytics?.growthRate, '%', 2)} color={er > 0 ? C.green : C.red} />
                        <StatChip label="View Rate" value={fmt(analytics?.viewRate, '%', 2)} color={C.teal} />
                        <StatChip label="Avg Reach" value={fmtK(analytics?.averageReach ?? analytics?.avgReach)} color={C.amber} />
                        <StatChip label="Profile Views" value={fmtK(analytics?.profileViews)} color={C.pink} />
                        <StatChip label="Website Clicks" value={fmtK(analytics?.websiteClicks)} color={C.blue} />
                    </div>

                    {/* Follower Growth — Area Chart */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <ChartCard title="Follower Growth" subtitle={`Trend over last ${timeRange} days`}>
                            <EmptyChartState text="Historical follower snapshots are not stored yet. Current follower count is shown above from live synced account data." />
                        </ChartCard>

                        {/* Posts Analyzed — Donut */}
                        <ChartCard title="Media Breakdown" subtitle="Analyzed vs remaining media">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <ResponsiveContainer width="60%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Analyzed', value: analytics?.postsAnalyzed ?? 0 },
                                                { name: 'Not Analyzed', value: Math.max(0, (connection?.mediaCount ?? 0) - (analytics?.postsAnalyzed ?? 0)) },
                                            ]}
                                            cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                                            paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}
                                        >
                                            <Cell fill={C.purple} />
                                    <Cell fill="rgba(148,163,184,0.18)" />
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ flex: 1 }}>
                                    {[
                                        { label: 'Analyzed', value: analytics?.postsAnalyzed ?? 0, color: C.purple },
                                        { label: 'Pending', value: Math.max(0, (connection?.mediaCount ?? 0) - (analytics?.postsAnalyzed ?? 0)), color: 'rgba(148,163,184,0.28)' },
                                    ].map(item => (
                                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                                            <div>
                                                <p style={{ fontSize: 11, color: MUTED }}>{item.label}</p>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: TEXT }}>{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ChartCard>
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        SECTION 2 — ENGAGEMENT METRICS
                    ════════════════════════════════════════════════════════ */}
                    <SectionTitle icon={<Zap size={14} />}>Engagement Metrics</SectionTitle>

                    {/* Engagement rate trend — Line chart */}
                        <ChartCard title="Engagement Rate Trend" subtitle={`Weekly engagement (%) — last ${timeRange} days`} style={{ marginBottom: 16 }}>
                        {engagementData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={230}>
                                <LineChart data={engagementData} margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={40} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <ReferenceLine y={er} stroke={C.amber} strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Current', fill: C.amber, fontSize: 10 }} />
                                    <Line type="monotone" dataKey="rate" name="Engagement Rate" unit="%" stroke={C.amber} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5, fill: C.amber, stroke: '#fff', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChartState text="Not enough synced media with timestamps is available yet to plot engagement over time." />
                        )}
                    </ChartCard>

                    {/* Avg Likes vs Comments — Bar chart + Efficiency Radial */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                        <ChartCard title="Avg Likes vs Comments per Post" subtitle={`Comparison over last ${timeRange} days`}>
                            {likesCommentsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <ComposedChart data={likesCommentsData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={40} tickFormatter={fmtK} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />
                                        <Bar dataKey="likes" name="Likes" fill={C.pink} radius={[4, 4, 0, 0]} opacity={0.85} />
                                        <Bar dataKey="comments" name="Comments" fill={C.blue} radius={[4, 4, 0, 0]} opacity={0.85} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChartState text="No recent synced posts are available to compare likes and comments yet." />
                            )}
                        </ChartCard>

                        {/* Efficiency Radial Bar */}
                        <ChartCard title="Efficiency Rate" subtitle="Engagement per 1K followers">
                            <div style={{ textAlign: 'center' }}>
                                <ResponsiveContainer width="100%" height={160}>
                                    <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="85%"
                                        data={radialData} startAngle={180} endAngle={0}>
                                        <RadialBar dataKey="value" background={{ fill: 'rgba(148,163,184,0.14)' }} cornerRadius={8} />
                                        <Tooltip content={<ChartTooltip />} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.6rem', color: C.teal, marginTop: -12 }}>{fmtK(analytics?.efficiencyRate)}</p>
                                <p style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>interactions per 1,000 followers</p>
                            </div>
                        </ChartCard>
                    </div>

                    {/* Like:Comment Ratio — Stacked Area */}
                    <ChartCard title="Like : Comment Ratio" subtitle="Ratio of likes to comments per post over time" style={{ marginBottom: 0 }}>
                        {likesCommentsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={190}>
                                <AreaChart data={likesCommentsData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id="gLikes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C.pink} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={C.pink} stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="gComments" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C.blue} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={40} tickFormatter={fmtK} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />
                                    <Area type="monotone" dataKey="likes" name="Likes" stroke={C.pink} strokeWidth={2} fill="url(#gLikes)" dot={false} />
                                    <Area type="monotone" dataKey="comments" name="Comments" stroke={C.blue} strokeWidth={2} fill="url(#gComments)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChartState text="Like and comment trend data will appear after synced posts are available." />
                        )}
                    </ChartCard>

                    {/* ════════════════════════════════════════════════════════
                        SECTION 3 — POSTING CADENCE
                    ════════════════════════════════════════════════════════ */}
                    <SectionTitle icon={<Clock size={14} />}>Posting Cadence</SectionTitle>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <ChartCard title={`Daily Posts — Last ${timeRange} Days`} subtitle="How often you posted each day">
                            {media.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={cadenceData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.ceil(cadenceData.length / 6)} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="posts" name="Posts" fill={C.purple} radius={[4, 4, 0, 0]} opacity={0.85} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChartState text="Posting cadence will appear after your synced media history is available." />
                            )}
                        </ChartCard>

                        {/* Cadence summary */}
                        <ChartCard title="Cadence Summary" subtitle="Post counts over key windows">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                                {[
                                    { label: 'Posts Last 7 Days', value: analytics?.postsLast7Days ?? 0, max: 21, color: C.pink, icon: <Clock size={14} /> },
                                    { label: 'Posts Last 30 Days', value: analytics?.postsLast30Days ?? 0, max: 90, color: C.violet, icon: <Activity size={14} /> },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: MUTED, fontSize: 12 }}>{item.icon} {item.label}</div>
                                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 16, color: item.color }}>{item.value}</span>
                                        </div>
                                        <div style={{ height: 8, borderRadius: 99, background: 'rgba(148,163,184,0.18)' }}>
                                            <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, (item.value / item.max) * 100)}%`, background: `linear-gradient(90deg,${item.color},${item.color}99)`, transition: 'width 700ms ease' }} />
                                        </div>
                                    </div>
                                ))}
                                <div style={{ padding: '12px 14px', borderRadius: 12, background: SURFACE_ALT, border: `1px solid ${BORDER}` }}>
                                    <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>
                                        Optimal posting: <strong style={{ color: TEXT }}>3–5× per week</strong> for sustained growth.
                                        Post during peak hours: <strong style={{ color: TEXT }}>8–10PM</strong> local time.
                                    </p>
                                </div>
                            </div>
                        </ChartCard>
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        SECTION 4 — QUALITY & AUTHENTICITY
                    ════════════════════════════════════════════════════════ */}
                    <SectionTitle icon={<Star size={14} />}>Quality & Authenticity Scores</SectionTitle>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        {/* Quality Score Gauge */}
                        <ChartCard title="Quality Score" subtitle="Engagement + frequency weighted">
                            <div style={{ textAlign: 'center' }}>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={qualityGauge} cx="50%" cy="80%" startAngle={180} endAngle={0}
                                            innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                                            {qualityGauge.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color: qualityGauge[0].fill, marginTop: -24 }}>
                                    {analytics?.qualityScore?.toFixed(0) ?? '—'}
                                </p>
                                <p style={{ fontSize: 11, color: MUTED }}>out of 100</p>
                                <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 12px', borderRadius: 99, background: `${qualityGauge[0].fill}20`, fontSize: 11, fontWeight: 700, color: qualityGauge[0].fill }}>
                                    {analytics?.scoreLabel || (analytics?.qualityScore != null ? (analytics.qualityScore >= 75 ? 'Excellent' : analytics.qualityScore >= 50 ? 'Good' : analytics.qualityScore >= 25 ? 'Fair' : 'Low') : 'N/A')}
                                </div>
                            </div>
                        </ChartCard>

                        {/* Top Post Score */}
                        <ChartCard title="Top Post Score" subtitle="Best post engagement vs followers">
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 160, gap: 8 }}>
                                <div style={{ position: 'relative', width: 110, height: 110 }}>
                                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="10" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke={C.green} strokeWidth="10"
                                            strokeDasharray={`${(analytics?.topPostScore ?? 0) * 2.51} 251`}
                                            strokeLinecap="round" />
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.3rem', color: C.green }}>{analytics?.topPostScore?.toFixed(1) ?? '—'}</p>
                                        <p style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase' }}>score</p>
                                    </div>
                                </div>
                                <p style={{ fontSize: 11, color: MUTED }}>Top post vs follower ratio</p>
                            </div>
                        </ChartCard>

                        {/* Top Reel Score */}
                        <ChartCard title="Top Reel Score" subtitle="Best reel engagement vs followers">
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 160, gap: 8 }}>
                                <div style={{ position: 'relative', width: 110, height: 110 }}>
                                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="10" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke={C.blue} strokeWidth="10"
                                            strokeDasharray={`${(analytics?.topReelScore ?? 0) * 2.51} 251`}
                                            strokeLinecap="round" />
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.3rem', color: C.blue }}>{analytics?.topReelScore?.toFixed(1) ?? '—'}</p>
                                        <p style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase' }}>score</p>
                                    </div>
                                </div>
                                <p style={{ fontSize: 11, color: MUTED }}>Top reel vs follower ratio</p>
                            </div>
                        </ChartCard>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 16 }}>
                        <ChartCard title="Authenticity Score" subtitle="Follower/reach/engagement trust signal">
                            <div style={{ textAlign: 'center', paddingTop: 22 }}>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color: C.green }}>{analytics?.authenticityScore?.toFixed(0) ?? '—'}</p>
                                <p style={{ fontSize: 11, color: MUTED }}>out of 100</p>
                            </div>
                        </ChartCard>
                        <ChartCard title="Consistency Score" subtitle="1 - std dev / mean engagement">
                            <div style={{ textAlign: 'center', paddingTop: 22 }}>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color: C.violet }}>{analytics?.consistencyScore?.toFixed(0) ?? '—'}</p>
                                <p style={{ fontSize: 11, color: MUTED }}>out of 100</p>
                            </div>
                        </ChartCard>
                        <ChartCard title="Virality Score" subtitle="Average plays vs followers">
                            <div style={{ textAlign: 'center', paddingTop: 22 }}>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color: C.blue }}>{fmt(analytics?.viralityScore, '%', 2)}</p>
                                <p style={{ fontSize: 11, color: MUTED }}>plays / followers</p>
                            </div>
                        </ChartCard>
                        <ChartCard title="Influencer Score" subtitle="Weighted Porchest final score">
                            <div style={{ textAlign: 'center', paddingTop: 22 }}>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color: C.amber }}>{analytics?.influencerScore?.toFixed(1) ?? '—'}</p>
                                <p style={{ fontSize: 11, color: MUTED }}>weighted intelligence</p>
                            </div>
                        </ChartCard>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                        <ChartCard title="Avg Engagement" subtitle="Total engagement / post count">
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.8rem', color: C.pink }}>{fmtK(analytics?.averageEngagement)}</p>
                        </ChartCard>
                        <ChartCard title="Engagement Quality" subtitle="Comments / likes ratio">
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.8rem', color: C.green }}>{fmt(analytics?.engagementQualityScore, '%', 2)}</p>
                        </ChartCard>
                        <ChartCard title="Cost Per View" subtitle="Price / plays or reach">
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.8rem', color: C.teal }}>{fmtMoney(analytics?.costPerView)}</p>
                        </ChartCard>
                        <ChartCard title="Cost Per Engagement" subtitle="Price / engagement">
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.8rem', color: C.indigo }}>{fmtMoney(analytics?.costPerEngagement)}</p>
                        </ChartCard>
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        SECTION 5 — RECENT MEDIA PERFORMANCE (Scatter)
                    ════════════════════════════════════════════════════════ */}
                    {media.length > 0 && (
                        <>
                            <SectionTitle icon={<Eye size={14} />}>Recent Media Performance</SectionTitle>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {/* Scatter chart */}
                                <ChartCard title="Likes vs Comments Scatter" subtitle="Each bubble = one post. Size = total engagement.">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <ScatterChart margin={{ top: 4, right: 20, bottom: 20, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                                            <XAxis dataKey="likes" name="Likes" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmtK} label={{ value: 'Likes', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                                            <YAxis dataKey="comments" name="Comments" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={36} tickFormatter={fmtK} label={{ value: 'Comments', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                                            <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgba(148,163,184,0.3)' }} content={<ChartTooltip />} />
                                            <Scatter data={mediaScatter} fill={C.violet} opacity={0.75} />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                {/* Media grid thumbnails */}
                                <ChartCard title="Recent Posts" subtitle="Last 6 posts with engagement">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                                        {media.slice(0, 6).map((m: any, i) => (
                                            <a key={m.mediaId || i} href={m.permalink} target="_blank" rel="noreferrer"
                                                style={{ display: 'block', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', border: `1px solid ${BORDER}`, transition: 'border-color 200ms' }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.4)'}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = BORDER}>
                                                {(m.thumbnailUrl || m.mediaUrl) && (
                                                    <img src={m.thumbnailUrl || m.mediaUrl} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                                                )}
                                                <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.96)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: MUTED }}><Heart size={9} style={{ color: C.pink }} />{fmtK(m.likeCount)}</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: MUTED }}><MessageCircle size={9} style={{ color: C.blue }} />{fmtK(m.commentsCount)}</span>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </ChartCard>
                            </div>
                        </>
                    )}

                    {/* ════════════════════════════════════════════════════════
                        SECTION 6 — ACTIONABLE INSIGHTS
                    ════════════════════════════════════════════════════════ */}
                    <SectionTitle icon={<Lightbulb size={14} />}>Actionable Insights</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                        {insights.map((insight, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                                <InsightCard text={insight} />
                            </motion.div>
                        ))}
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        SECTION 7 — POST ANALYTICS LOOKUP
                    ════════════════════════════════════════════════════════ */}
                    <SectionTitle icon={<Search size={14} />}>Post Analytics Lookup</SectionTitle>
                    <div style={{ background: SURFACE, border: '1px solid rgba(123,63,242,0.16)', borderRadius: 24, padding: 28, marginBottom: 40, boxShadow: '0 18px 34px rgba(15,23,42,0.05)' }}>
                        <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Paste any Instagram post URL from your account to view its detailed analytics.</p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <input
                                value={postUrl} onChange={e => setPostUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                                placeholder="https://www.instagram.com/p/ABC123..."
                                style={{ flex: 1, minWidth: 280, padding: '12px 16px', borderRadius: 12, background: SURFACE_ALT, border: `1px solid ${BORDER}`, color: TEXT, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                            />
                            <button onClick={handleLookup} disabled={lookupLoading}
                                style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: lookupLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', opacity: lookupLoading ? 0.7 : 1 }}>
                                {lookupLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                                {lookupLoading ? 'Looking up...' : 'Analyze Post'}
                            </button>
                        </div>

                        {lookupError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13, color: '#f87171' }}>
                                <AlertCircle size={14} /> {lookupError}
                            </div>
                        )}

                        <AnimatePresence>
                            {lookupResult && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginTop: 24 }}>
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
                                        {(lookupResult.media.thumbnailUrl || lookupResult.media.mediaUrl) && (
                                            <img src={lookupResult.media.thumbnailUrl || lookupResult.media.mediaUrl} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14, flexShrink: 0 }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                <span style={{ padding: '2px 9px', borderRadius: 8, background: 'rgba(168,85,247,0.15)', fontSize: 10, fontWeight: 700, color: '#c084fc' }}>{lookupResult.media.mediaType}</span>
                                                {lookupResult.media.timestamp && <span style={{ fontSize: 11, color: MUTED }}>{new Date(lookupResult.media.timestamp).toLocaleDateString()}</span>}
                                            </div>
                                            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 10, maxWidth: 400 }}>
                                                {lookupResult.media.caption ? lookupResult.media.caption.slice(0, 180) + (lookupResult.media.caption.length > 180 ? '...' : '') : 'No caption'}
                                            </p>
                                            {lookupResult.media.permalink && (
                                                <a href={lookupResult.media.permalink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.lavender, fontWeight: 600, textDecoration: 'none' }}>
                                                    <ExternalLink size={12} /> View on Instagram
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 16 }}>
                                        {[
                                            { label: 'Likes', value: fmtK(lookupResult.media.likeCount), icon: <Heart size={13} />, color: C.pink },
                                            { label: 'Comments', value: fmtK(lookupResult.media.commentsCount), icon: <MessageCircle size={13} />, color: C.blue },
                                            { label: 'Reach', value: fmtK(lookupResult.insight?.reach), icon: <Users size={13} />, color: C.green },
                                            { label: 'Impressions', value: fmtK(lookupResult.insight?.impressions), icon: <Eye size={13} />, color: C.lavender },
                                            { label: 'Saves', value: fmtK(lookupResult.insight?.saved), icon: <Bookmark size={13} />, color: C.amber },
                                            { label: 'Views', value: fmtK(lookupResult.insight?.videoViews), icon: <Eye size={13} />, color: C.pink },
                                        ].map(({ label, value, icon, color }) => (
                                            <div key={label} style={{ padding: 14, borderRadius: 14, background: SURFACE_ALT, border: `1px solid ${BORDER}` }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color }}>{icon}<span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span></div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.2rem', color: TEXT }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: 16, borderRadius: 16, background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.15)' }}>
                                        <p style={{ fontSize: 11, color: C.lavender, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Calculated Metrics</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
                                            {[
                                                { label: 'Engagement Rate (by Followers)', value: fmt(lookupResult.postMetrics.engagementRateByFollowers, '%') },
                                                { label: 'Engagement Rate (by Reach)', value: fmt(lookupResult.postMetrics.engagementRateByReach, '%') },
                                                { label: 'Engagement per Impression', value: fmt(lookupResult.postMetrics.engagementPerImpression, '', 4) },
                                                { label: 'Total Engagement', value: fmtK(lookupResult.postMetrics.engagementTotal) },
                                                { label: 'Like:Comment Ratio', value: fmt(lookupResult.postMetrics.likeToCommentRatio, 'x') },
                                                { label: 'Saves per Reach', value: fmt(lookupResult.postMetrics.savesPerReach, '%') },
                                                { label: 'Comment Rate', value: fmt(lookupResult.postMetrics.commentRate, '%', 3) },
                                            ].map(({ label, value }) => (
                                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: SURFACE }}>
                                                    <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
                                                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#c084fc' }}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
