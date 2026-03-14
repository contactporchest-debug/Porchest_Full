'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Instagram, TrendingUp, Users, Heart, MessageCircle, Bookmark,
    Eye, BarChart2, RefreshCw, Search, AlertCircle, ExternalLink,
    Zap, Star, Target, Activity, Clock, ArrowUpRight
} from 'lucide-react';
import { brandAPI } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

const fmt = (v: number | null | undefined, suffix = '', d = 1) => v != null ? `${v.toFixed(d)}${suffix}` : '—';
const fmtK = (v: number | null | undefined) => {
    if (v == null) return '—';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return String(v);
};

const MetricCard = ({ label, value, sub, icon, color = '#38bdf8' }: {
    label: string; value: string; sub?: string; icon: React.ReactNode; color?: string;
}) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 70, height: 70, borderRadius: '0 20px 0 70px', background: `${color}08` }} />
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 12 }}>{icon}</div>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.5rem', color: '#fff', marginBottom: 3 }}>{value}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>{sub}</p>}
    </motion.div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 28 }}>
        <div style={{ width: 3, height: 18, borderRadius: 4, background: 'linear-gradient(180deg,#38bdf8,#0ea5e9)' }} />
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</h3>
    </div>
);

export default function BrandAnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [connection, setConnection] = useState<any>(null);
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [postUrl, setPostUrl] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupResult, setLookupResult] = useState<any>(null);
    const [lookupError, setLookupError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [a, p, m] = await Promise.all([
                brandAPI.getInstagramAnalytics(),
                brandAPI.getInstagramProfile(),
                brandAPI.getInstagramMedia(),
            ]);
            setAnalytics(a.data.analytics || null);
            setConnection(p.data.connection || null);
            setMedia(m.data.media || []);
        } catch { toast.error('Failed to load brand analytics'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleLookup = async () => {
        if (!postUrl.trim()) return toast.error('Enter a post URL');
        setLookupLoading(true); setLookupResult(null); setLookupError('');
        try {
            const res = await brandAPI.lookupPost(postUrl.trim());
            setLookupResult(res.data);
        } catch (err: any) {
            setLookupError(err?.response?.data?.message || 'Post not found. Refresh your sync first.');
        } finally { setLookupLoading(false); }
    };

    if (loading) return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'rgba(255,255,255,0.3)' }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading...
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    if (!connection?.isConnected) return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(10,14,28,0.85)', borderRadius: 28, border: '1px solid rgba(56,189,248,0.12)' }}>
                    <Instagram size={48} style={{ color: '#38bdf8', margin: '0 auto 16px' }} />
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: '#fff', marginBottom: 8 }}>Instagram Not Connected</h2>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 24 }}>Connect your brand Instagram account to view analytics.</p>
                    <a href="/dashboard/brand/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 99, background: 'linear-gradient(135deg,#0284c7,#38bdf8)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                        <Instagram size={14} /> Go to Profile → Connect
                    </a>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 99, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', marginBottom: 8 }}>
                                <BarChart2 size={10} style={{ color: '#38bdf8' }} />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand Analytics</span>
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.3rem,3vw,2rem)', color: '#fff', letterSpacing: '-0.03em' }}>
                                @{connection?.username || '—'} Analytics
                            </h1>
                            {connection?.lastSyncedAt && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Last synced: {new Date(connection.lastSyncedAt).toLocaleString()}</p>}
                        </div>
                        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <RefreshCw size={13} /> Refresh
                        </button>
                    </motion.div>

                    {/* Account Overview */}
                    <SectionTitle>Account Overview</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                        <MetricCard label="Followers" value={fmtK(connection?.followersCount)} icon={<Users size={15} />} color="#38bdf8" />
                        <MetricCard label="Following" value={fmtK(connection?.followsCount)} icon={<Users size={15} />} color="#0ea5e9" />
                        <MetricCard label="Total Posts" value={fmtK(connection?.mediaCount)} icon={<BarChart2 size={15} />} color="#6366f1" />
                        <MetricCard label="Posts Analyzed" value={String(analytics?.postsAnalyzed ?? '—')} icon={<Activity size={15} />} color="#a78bfa" />
                    </div>

                    {/* Engagement Metrics */}
                    <SectionTitle>Engagement Metrics</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                        <MetricCard label="Engagement Rate" value={fmt(analytics?.engagementRate, '%')} icon={<Zap size={15} />} color="#f59e0b" sub="(Likes+Comments) / Followers × 100" />
                        <MetricCard label="Avg Likes/Post" value={fmt(analytics?.avgLikesPerPost, '', 0)} icon={<Heart size={15} />} color="#f87171" />
                        <MetricCard label="Avg Comments/Post" value={fmt(analytics?.avgCommentsPerPost, '', 1)} icon={<MessageCircle size={15} />} color="#60a5fa" />
                        <MetricCard label="Avg Engagement/Post" value={fmt(analytics?.avgEngagementPerPost, '', 0)} icon={<TrendingUp size={15} />} color="#34d399" />
                        <MetricCard label="Like:Comment Ratio" value={fmt(analytics?.likeToCommentRatio, 'x', 1)} icon={<Star size={15} />} color="#c084fc" />
                        <MetricCard label="Efficiency Rate" value={fmtK(analytics?.influencerEfficiencyRate)} icon={<Target size={15} />} color="#38bdf8" sub="Engagement per 1K followers" />
                    </div>

                    {/* Posting Cadence */}
                    <SectionTitle>Posting Cadence</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                        <MetricCard label="Posts Last 7 Days" value={fmt(analytics?.postingFrequency7d, '', 0)} icon={<Clock size={15} />} color="#fb7185" />
                        <MetricCard label="Posts Last 30 Days" value={fmt(analytics?.postingFrequency30d, '', 0)} icon={<Clock size={15} />} color="#f97316" />
                    </div>

                    {/* Quality Scores */}
                    <SectionTitle>Content Quality Scores</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                        {[
                            { label: 'Quality Score', key: 'qualityScore', color: '#38bdf8' },
                            { label: 'Top Post Score', key: 'topPostScore', color: '#34d399' },
                            { label: 'Top Reel Score', key: 'topReelScore', color: '#a78bfa' },
                        ].map(({ label, key, color }) => {
                            const v = analytics?.[key];
                            return (
                                <div key={key} style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20 }}>
                                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color }}>
                                        <Star size={14} />
                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.5rem', color: '#fff' }}>
                                        {v != null ? v.toFixed(1) : '—'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Recent Media */}
                    {media.length > 0 && (
                        <>
                            <SectionTitle>Recent Media Performance</SectionTitle>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                                {media.slice(0, 6).map((m: any) => (
                                    <a key={m.mediaId} href={m.permalink} target="_blank" rel="noreferrer"
                                        style={{ display: 'block', background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', textDecoration: 'none' }}>
                                        {(m.thumbnailUrl || m.mediaUrl) && (
                                            <img src={m.thumbnailUrl || m.mediaUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                        )}
                                        <div style={{ padding: '10px 12px' }}>
                                            <p style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, marginBottom: 6 }}>{m.mediaType || 'POST'}</p>
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

                    {/* Post URL Lookup */}
                    <SectionTitle>Post Analytics Lookup</SectionTitle>
                    <div style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 24, padding: 28 }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Paste any Instagram post URL from your brand account to view its detailed metrics.</p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <input value={postUrl} onChange={e => setPostUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                                placeholder="https://www.instagram.com/p/..."
                                style={{ flex: 1, minWidth: 280, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                            />
                            <button onClick={handleLookup} disabled={lookupLoading}
                                style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#0284c7,#38bdf8)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: lookupLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', opacity: lookupLoading ? 0.7 : 1 }}>
                                {lookupLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                                {lookupLoading ? 'Looking up...' : 'Analyze Post'}
                            </button>
                        </div>

                        {lookupError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13, color: '#f87171' }}>
                                <AlertCircle size={14} /> {lookupError}
                            </div>
                        )}

                        <AnimatePresence>
                            {lookupResult && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 24 }}>
                                    {/* Post header */}
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
                                        {(lookupResult.media.thumbnailUrl || lookupResult.media.mediaUrl) && (
                                            <img src={lookupResult.media.thumbnailUrl || lookupResult.media.mediaUrl} alt="" style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                <span style={{ padding: '2px 9px', borderRadius: 8, background: 'rgba(56,189,248,0.15)', fontSize: 10, fontWeight: 700, color: '#7dd3fc' }}>{lookupResult.media.mediaType}</span>
                                                {lookupResult.media.timestamp && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(lookupResult.media.timestamp).toLocaleDateString()}</span>}
                                            </div>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 10, maxWidth: 400 }}>
                                                {lookupResult.media.caption?.slice(0, 180) + (lookupResult.media.caption?.length > 180 ? '...' : '') || 'No caption'}
                                            </p>
                                            {lookupResult.media.permalink && (
                                                <a href={lookupResult.media.permalink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
                                                    <ExternalLink size={12} /> View on Instagram
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Raw counts */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 14 }}>
                                        {[
                                            { label: 'Likes', value: fmtK(lookupResult.media.likeCount), color: '#f87171' },
                                            { label: 'Comments', value: fmtK(lookupResult.media.commentsCount), color: '#60a5fa' },
                                            { label: 'Reach', value: fmtK(lookupResult.insight?.reach), color: '#34d399' },
                                            { label: 'Impressions', value: fmtK(lookupResult.insight?.impressions), color: '#a78bfa' },
                                            { label: 'Saves', value: fmtK(lookupResult.insight?.saved), color: '#fbbf24' },
                                            { label: 'Views', value: fmtK(lookupResult.insight?.videoViews), color: '#fb7185' },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.2rem', color }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calculated metrics */}
                                    <div style={{ padding: 16, borderRadius: 16, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.14)' }}>
                                        <p style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Calculated Metrics</p>
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
                                                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#7dd3fc' }}>{value}</span>
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
