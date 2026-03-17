'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Instagram, TrendingUp, Users, Heart, MessageCircle, Bookmark,
    Eye, BarChart2, RefreshCw, Search, AlertCircle, ExternalLink,
    Zap, Star, Target, Activity, Clock, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────
interface DerivedMetrics {
    followersCount?: number;
    avgLikes?: number;
    avgComments?: number;
    engagementRate?: number;
    growthRate?: number;
    postsLast7Days?: number;
    postsLast30Days?: number;
    efficiencyRate?: number;
    qualityScore?: number;
    scoreLabel?: string;
    topPostScore?: number;
    topReelScore?: number;
    likeToCommentRatio?: number | null;
    postsAnalyzed?: number;
    lastSyncedAt?: string;
}

interface IGConnection {
    followersCount?: number;
    followsCount?: number;
    mediaCount?: number;
    username?: string;
    profilePictureURL?: string;
    lastSyncedAt?: string;
    isConnected?: boolean;
}

interface PostLookupResult {
    media: {
        caption?: string;
        permalink?: string;
        mediaType?: string;
        timestamp?: string;
        likeCount?: number;
        commentsCount?: number;
        thumbnailUrl?: string;
        mediaUrl?: string;
    };
    insight?: {
        reach?: number;
        impressions?: number;
        saved?: number;
        videoViews?: number;
    };
    postMetrics: {
        engagementTotal?: number;
        engagementRateByFollowers?: number;
        engagementRateByReach?: number | null;
        engagementPerImpression?: number | null;
        likeToCommentRatio?: number | null;
        savesPerReach?: number | null;
        commentRate?: number;
    };
    comments?: { text: string; username: string; timestamp: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (v: number | null | undefined, suffix = '', decimals = 1) =>
    v != null ? `${v.toFixed(decimals)}${suffix}` : '—';

const fmtK = (v: number | null | undefined) => {
    if (v == null) return '—';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return String(v);
};

const scoreBadge = (score?: number, label?: string) => {
    if (score == null) return { label: 'N/A', color: 'rgba(255,255,255,0.15)' };
    const displayLabel = label || (score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Fair' : 'Low');
    if (score >= 75) return { label: displayLabel, color: 'rgba(74,222,128,0.2)' };
    if (score >= 50) return { label: displayLabel, color: 'rgba(168,85,247,0.2)' };
    if (score >= 25) return { label: displayLabel, color: 'rgba(251,191,36,0.2)' };
    return { label: displayLabel, color: 'rgba(248,113,113,0.2)' };
};

// ─── Sub-components ───────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon, color = '#a78bfa', trend }: {
    label: string; value: string; sub?: string; icon: React.ReactNode;
    color?: string; trend?: 'up' | 'down' | 'flat';
}) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{
            background: 'rgba(14,12,26,0.8)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px', padding: '20px', position: 'relative', overflow: 'hidden'
        }}
    >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', borderRadius: '0 20px 0 80px', background: `${color}08` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                {icon}
            </div>
            {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: trend === 'up' ? '#4ade80' : trend === 'down' ? '#f87171' : '#a78bfa' }}>
                    {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                </div>
            )}
        </div>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.5rem', color: '#fff', marginBottom: 3 }}>{value}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{sub}</p>}
    </motion.div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 28 }}>
        <div style={{ width: 3, height: 18, borderRadius: 4, background: 'linear-gradient(180deg,#A855F7,#7B3FF2)' }} />
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</h3>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────
export default function InfluencerAnalyticsPage() {
    const [analytics, setAnalytics] = useState<DerivedMetrics | null>(null);
    const [connection, setConnection] = useState<IGConnection | null>(null);
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
        setLookupLoading(true);
        setLookupResult(null);
        setLookupError('');
        try {
            const res = await influencerAPI.lookupPost(postUrl.trim());
            setLookupResult(res.data);
        } catch (err: any) {
            setLookupError(err?.response?.data?.message || 'Post not found. Refresh your sync and try again.');
        } finally { setLookupLoading(false); }
    };

    const isConnected = connection?.isConnected;

    if (loading) return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'rgba(255,255,255,0.3)' }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading analytics...
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    if (!isConnected) return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(14,12,26,0.8)', borderRadius: 28, border: '1px solid rgba(168,85,247,0.15)' }}>
                    <Instagram size={48} style={{ color: '#a78bfa', margin: '0 auto 16px' }} />
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: '#fff', marginBottom: 8 }}>Instagram Not Connected</h2>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 24 }}>Connect your Instagram account to start seeing analytics.</p>
                    <a href="/dashboard/influencer/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 99, background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                        <Instagram size={14} /> Go to Profile → Connect
                    </a>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 99, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', marginBottom: 8 }}>
                                <Instagram size={10} style={{ color: '#a78bfa' }} />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Instagram Analytics</span>
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.3rem,3vw,2rem)', color: '#fff', letterSpacing: '-0.03em' }}>
                                @{connection?.username || '—'} Analytics
                            </h1>
                            {connection?.lastSyncedAt && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Last synced: {new Date(connection.lastSyncedAt).toLocaleString()}</p>}
                        </div>
                        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: '#a78bfa', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <RefreshCw size={13} /> Refresh
                        </button>
                    </motion.div>

                    {/* Data Accuracy Banner */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', marginBottom: 20, fontSize: 12, color: 'rgba(74,222,128,0.85)' }}>
                        <Zap size={13} /> <strong>Verified Data</strong> — All metrics are calculated using official Instagram Graph API data with industry-standard normalization.
                    </div>

                    {/* ── ACCOUNT OVERVIEW ── */}
                    <SectionTitle>Account Overview</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                        <MetricCard label="Followers" value={fmtK(analytics?.followersCount ?? connection?.followersCount)} icon={<Users size={15} />} color="#A855F7" />
                        <MetricCard 
                            label="Follower Growth" 
                            value={fmt(analytics?.growthRate, '%', 2)} 
                            icon={<TrendingUp size={15} />} 
                            color="#34d399" 
                            trend={(analytics?.growthRate ?? 0) > 0 ? 'up' : (analytics?.growthRate ?? 0) < 0 ? 'down' : 'flat'}
                            sub="Current vs Previous Sync"
                        />
                        <MetricCard label="Total Media" value={fmtK(connection?.mediaCount)} icon={<BarChart2 size={15} />} color="#6366f1" />
                        <MetricCard label="Posts Analyzed" value={String(analytics?.postsAnalyzed ?? '—')} icon={<Activity size={15} />} color="#a78bfa" />
                    </div>

                    {/* ── ENGAGEMENT METRICS ── */}
                    <SectionTitle>Engagement Metrics</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                        <MetricCard label="Engagement Rate" value={fmt(analytics?.engagementRate, '%')} icon={<Zap size={15} />} color="#f59e0b" sub="Industry Standard Formula" />
                        <MetricCard label="Avg Likes/Post" value={fmt(analytics?.avgLikes, '', 0)} icon={<Heart size={15} />} color="#f87171" />
                        <MetricCard label="Avg Comments/Post" value={fmt(analytics?.avgComments, '', 1)} icon={<MessageCircle size={15} />} color="#60a5fa" />
                        <MetricCard label="Like:Comment Ratio" value={analytics?.likeToCommentRatio != null ? fmt(analytics.likeToCommentRatio, 'x', 1) : 'No data'} icon={<Star size={15} />} color="#c084fc" />
                        <MetricCard label="Efficiency Rate" value={fmtK(analytics?.efficiencyRate)} icon={<Target size={15} />} color="#38bdf8" sub="Engagement per 1K followers" />
                    </div>

                    {/* ── POSTING CADENCE ── */}
                    <SectionTitle>Posting Cadence</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                        <MetricCard label="Posts Last 7 Days" value={fmt(analytics?.postsLast7Days, '', 0)} icon={<Clock size={15} />} color="#fb7185" />
                        <MetricCard label="Posts Last 30 Days" value={fmt(analytics?.postsLast30Days, '', 0)} icon={<Clock size={15} />} color="#f97316" />
                    </div>

                    {/* ── QUALITY SCORES ── */}
                    <SectionTitle>Quality & Authenticity Scores</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                        {[
                            { label: 'Quality Score', key: 'qualityScore', color: '#a78bfa', icon: <Star size={15} />, sub: 'Engagement + Frequency weighted score' },
                            { label: 'Top Post Score', key: 'topPostScore', color: '#34d399', icon: <TrendingUp size={15} />, sub: 'Best post engagement vs followers' },
                            { label: 'Top Reel Score', key: 'topReelScore', color: '#60a5fa', icon: <Eye size={15} />, sub: 'Best reel engagement vs followers' },
                        ].map(({ label, key, color, icon, sub }) => {
                            const val = analytics?.[key as keyof DerivedMetrics] as number | undefined;
                            const { label: badge, color: bgColor } = scoreBadge(val, key === 'qualityScore' ? analytics?.scoreLabel : undefined);
                            return (
                                <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    style={{ background: 'rgba(14,12,26,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                                        <span style={{ padding: '2px 9px', borderRadius: 8, background: bgColor, fontSize: 10, fontWeight: 700, color: '#fff' }}>{badge}</span>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.5rem', color: '#fff', marginBottom: 3 }}>{val != null ? val.toFixed(1) : '—'}{key === 'qualityScore' && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}> / 100</span>}</p>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                                    {sub && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{sub}</p>}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ── RECENT MEDIA ── */}
                    {media.length > 0 && (
                        <>
                            <SectionTitle>Recent Media Performance</SectionTitle>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                                {media.slice(0, 6).map((m: any) => (
                                    <a key={m.mediaId} href={m.permalink} target="_blank" rel="noreferrer"
                                        style={{ display: 'block', background: 'rgba(14,12,26,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', transition: 'border-color 200ms' }}>
                                        {(m.thumbnailUrl || m.mediaUrl) && (
                                            <img src={m.thumbnailUrl || m.mediaUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                        )}
                                        <div style={{ padding: '10px 12px' }}>
                                            <p style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 6 }}>{m.mediaType || 'POST'}</p>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}><Heart size={11} style={{ color: '#f87171' }} />{fmtK(m.likeCount)}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}><MessageCircle size={11} style={{ color: '#60a5fa' }} />{fmtK(m.commentsCount)}</span>
                                            </div>
                                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>{m.timestamp ? new Date(m.timestamp).toLocaleDateString() : ''}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── POST URL LOOKUP ── */}
                    <SectionTitle>Post Analytics Lookup</SectionTitle>
                    <div style={{ background: 'rgba(14,12,26,0.8)', border: '1px solid rgba(123,63,242,0.2)', borderRadius: 24, padding: 28, marginBottom: 12 }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Paste any Instagram post URL from your account to view its detailed analytics.</p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <input
                                value={postUrl}
                                onChange={e => setPostUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                                placeholder="https://www.instagram.com/p/ABC123..."
                                style={{ flex: 1, minWidth: 280, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
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
                                    {/* Post Header */}
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
                                        {(lookupResult.media.thumbnailUrl || lookupResult.media.mediaUrl) && (
                                            <img src={lookupResult.media.thumbnailUrl || lookupResult.media.mediaUrl} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14, flexShrink: 0 }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                <span style={{ padding: '2px 9px', borderRadius: 8, background: 'rgba(168,85,247,0.15)', fontSize: 10, fontWeight: 700, color: '#c084fc' }}>{lookupResult.media.mediaType}</span>
                                                {lookupResult.media.timestamp && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(lookupResult.media.timestamp).toLocaleDateString()}</span>}
                                            </div>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 10, maxWidth: 400 }}>
                                                {lookupResult.media.caption ? lookupResult.media.caption.slice(0, 180) + (lookupResult.media.caption.length > 180 ? '...' : '') : 'No caption'}
                                            </p>
                                            {lookupResult.media.permalink && (
                                                <a href={lookupResult.media.permalink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
                                                    <ExternalLink size={12} /> View on Instagram
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Raw Metrics Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 16 }}>
                                        {[
                                            { label: 'Likes', value: fmtK(lookupResult.media.likeCount), icon: <Heart size={13} />, color: '#f87171' },
                                            { label: 'Comments', value: fmtK(lookupResult.media.commentsCount), icon: <MessageCircle size={13} />, color: '#60a5fa' },
                                            { label: 'Reach', value: fmtK(lookupResult.insight?.reach), icon: <Users size={13} />, color: '#34d399' },
                                            { label: 'Impressions', value: fmtK(lookupResult.insight?.impressions), icon: <Eye size={13} />, color: '#a78bfa' },
                                            { label: 'Saves', value: fmtK(lookupResult.insight?.saved), icon: <Bookmark size={13} />, color: '#fbbf24' },
                                            { label: 'Views', value: fmtK(lookupResult.insight?.videoViews), icon: <Eye size={13} />, color: '#fb7185' },
                                        ].map(({ label, value, icon, color }) => (
                                            <div key={label} style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color }}>{icon}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span></div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Derived Post Metrics */}
                                    <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.15)' }}>
                                        <p style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Calculated Metrics</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                                            {[
                                                { label: 'Engagement Rate (by Followers)', value: fmt(lookupResult.postMetrics.engagementRateByFollowers, '%') },
                                                { label: 'Engagement Rate (by Reach)', value: fmt(lookupResult.postMetrics.engagementRateByReach, '%') },
                                                { label: 'Engagement per Impression', value: fmt(lookupResult.postMetrics.engagementPerImpression, '', 4) },
                                                { label: 'Total Engagement', value: fmtK(lookupResult.postMetrics.engagementTotal) },
                                                { label: 'Like:Comment Ratio', value: fmt(lookupResult.postMetrics.likeToCommentRatio, 'x') },
                                                { label: 'Saves per Reach', value: fmt(lookupResult.postMetrics.savesPerReach, '%') },
                                                { label: 'Comment Rate', value: fmt(lookupResult.postMetrics.commentRate, '%', 3) },
                                            ].map(({ label, value }) => (
                                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
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
