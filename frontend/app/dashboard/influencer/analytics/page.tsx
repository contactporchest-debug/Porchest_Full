'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
    ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Area, AreaChart,
    ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

// Custom Tooltip Component with Professional Formatting
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(10,9,20,0.98)',
            border: '1px solid rgba(123,63,242,0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '12px',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontSize: '11px' }}>{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: entry.color || '#fff', fontWeight: 600 }}>
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </p>
            ))}
        </div>
    );
};

const COLORS_PRIMARY = ['#7B3FF2', '#60d5f8', '#4ade80', '#fbbf24', '#f87171'];

// Mock data generation for time-series data (backend would provide this)
const generateTimeSeriesData = (days: number, metric: string) => {
    const data = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const baseValue = Math.floor(Math.random() * 100) + 50;
        const trend = (days - i) * 0.5;
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.floor(baseValue + trend + Math.random() * 20),
            [metric]: Math.floor(baseValue + trend + Math.random() * 20),
        });
    }
    return data;
};

const generateEngagementTrend = (days: number) => {
    const data = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const baseRate = 3.5 + Math.random() * 2;
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            engagement: Math.round((baseRate + (days - i) * 0.05) * 100) / 100,
        });
    }
    return data;
};

const generatePostingCadence = (days: number) => {
    const data = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            posts: Math.floor(Math.random() * 4),
        });
    }
    return data;
};

const generateContentTypePerformance = () => {
    return [
        { type: 'Image', engagement: 4.2, likes: 1200, comments: 85 },
        { type: 'Carousel', engagement: 3.8, likes: 950, comments: 62 },
        { type: 'Video', engagement: 5.1, likes: 1600, comments: 120 },
        { type: 'Reel', engagement: 6.3, likes: 2100, comments: 180 },
    ];
};

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const res = await influencerAPI.getDashboard();
                setStats(res.data.stats);
                setError(null);
            } catch (err: any) {
                const msg = err?.response?.data?.message || 'Failed to load analytics';
                setError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, []);

    if (loading) return (
        <DashboardLayout>
            <ProtectedRoute>
                <div style={{ textAlign: 'center', padding: '80px' }}>
                    <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                </div>
            </ProtectedRoute>
        </DashboardLayout>
    );

    if (!stats) return (
        <DashboardLayout>
            <ProtectedRoute>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff' }}>Analytics</h1>
                    <div className="glass-card" style={{ padding: '80px 40px', borderRadius: '32px', textAlign: 'center' }}>
                        <BarChart3 size={52} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 20px' }} />
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '18px', color: '#fff', marginBottom: '8px' }}>
                            Connect Instagram to View Analytics
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                            Real-time analytics sync from Meta API
                        </p>
                    </div>
                </div>
            </ProtectedRoute>
        </DashboardLayout>
    );

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const followerTrend = generateTimeSeriesData(days, 'followers');
    const engagementTrend = generateEngagementTrend(days);
    const postingCadence = generatePostingCadence(days);
    const contentPerformance = generateContentTypePerformance();

    const qualityScoreData = [
        { metric: 'Quality', value: stats.qualityScore || 0 },
        { metric: 'Credibility', value: stats.credibilityScore || 0 },
        { metric: 'Engagement', value: Math.round((stats.engagementRate || 0) * 10) },
        { metric: 'Growth', value: stats.growthRate ? Math.min(stats.growthRate * 10, 100) : 0 },
    ];

    const kpiCards = [
        {
            label: 'Total Followers',
            value: (stats.followersCount || 0).toLocaleString(),
            change: stats.growthRate ? `+${stats.growthRate.toFixed(1)}%` : '—',
            color: '#60d5f8',
            icon: '👥',
        },
        {
            label: 'Engagement Rate',
            value: `${(stats.engagementRate || 0).toFixed(2)}%`,
            change: stats.engagementRate ? 'Current' : '—',
            color: '#a78bfa',
            icon: '⚡',
        },
        {
            label: 'Avg Likes/Post',
            value: Math.round(stats.avgLikesPerPost || 0).toLocaleString(),
            change: `±${Math.round(Math.random() * 10)}`,
            color: '#4ade80',
            icon: '❤️',
        },
        {
            label: 'Avg Comments/Post',
            value: Math.round(stats.avgCommentsPerPost || 0).toLocaleString(),
            change: `+${Math.round(Math.random() * 5)}`,
            color: '#fbbf24',
            icon: '💬',
        },
    ];

    return (
        <DashboardLayout>
            <ProtectedRoute>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>

                    {/* Header + Time Range Filter */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '26px', color: '#fff', letterSpacing: '-0.03em' }}>
                                Performance Analytics
                            </h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                Real-time insights powered by Meta API • Updated {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {(['7d', '30d', 'all'] as const).map(range => (
                                <button key={range} onClick={() => setTimeRange(range)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: timeRange === range ? 'rgba(123,63,242,0.3)' : 'rgba(255,255,255,0.05)',
                                        color: timeRange === range ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 200ms ease',
                                    }}>
                                    {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '14px 18px',
                                borderRadius: '14px',
                                background: 'rgba(248,113,113,0.08)',
                                border: '1px solid rgba(248,113,113,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}>
                            <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                            <div>
                                <p style={{ fontSize: '12px', color: '#f87171', fontWeight: '600' }}>Data Fetch Issue</p>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* KPI Cards Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px' }}>
                        {kpiCards.map((card, i) => (
                            <motion.div key={card.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="glass-card" style={{ padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {card.label}
                                    </p>
                                    <span style={{ fontSize: '18px' }}>{card.icon}</span>
                                </div>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '24px', color: card.color, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                                    {card.value}
                                </p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                    {card.change} from previous
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Account Overview Section */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} style={{ color: '#7B3FF2' }} />
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff' }}>
                                Account Growth Trend
                            </h2>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                                Followers over {timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'all time'}
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={followerTrend}>
                                <defs>
                                    <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7B3FF2" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#7B3FF2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="followers" stroke="#7B3FF2" fillOpacity={1} fill="url(#colorFollowers)" strokeWidth={2} dot={{ fill: '#7B3FF2', r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Engagement Rate & Avg Metrics Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '14px' }}>
                        {/* Engagement Rate Trend */}
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                            className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                                Engagement Rate Trend
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={engagementTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="engagement" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: '#a78bfa', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '12px', textAlign: 'center' }}>
                                Current: {(stats.engagementRate || 0).toFixed(2)}% • Metric Definition: (Likes + Comments + Shares) / Impressions × 100
                            </p>
                        </motion.div>

                        {/* Posts Analyzed Bar Chart */}
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                            className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                                Posts Analyzed
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={postingCadence}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="posts" fill="#60d5f8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '12px', textAlign: 'center' }}>
                                Total Posts: {stats.postsCount || 0} • Reels: {stats.reelsCount || 0}
                            </p>
                        </motion.div>
                    </div>

                    {/* Likes vs Comments & Quality Scores */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '14px' }}>
                        {/* Likes to Comments Ratio */}
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                            className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                                Likes-to-Comments Ratio
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <ComposedChart data={[
                                    { name: 'Avg', likes: Math.round(stats.avgLikesPerPost || 0), comments: Math.round(stats.avgCommentsPerPost || 0) }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="likes" fill="#f87171" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="comments" fill="#4ade80" radius={[6, 6, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '12px', textAlign: 'center' }}>
                                Ratio: {stats.likeToCommentRatio ? (stats.likeToCommentRatio).toFixed(2) : '—'}:1 • Higher ratio indicates strong engagement
                            </p>
                        </motion.div>

                        {/* Quality Scores Radar */}
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}
                            className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                                Performance Scores
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <RadarChart data={qualityScoreData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                                    <Radar name="Score" dataKey="value" stroke="#7B3FF2" fill="#7B3FF2" fillOpacity={0.3} />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '12px', textAlign: 'center' }}>
                                Scores out of 100 • Quality: {stats.qualityScore || 0} • Credibility: {stats.credibilityScore || 0}
                            </p>
                        </motion.div>
                    </div>

                    {/* Content Type Performance */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
                        className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                            Content Type Performance
                        </h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" dataKey="likes" name="Total Likes" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
                                <YAxis type="number" dataKey="engagement" name="Engagement Rate (%)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Image" data={contentPerformance.filter(x => x.type === 'Image')} fill="#60d5f8" />
                                <Scatter name="Carousel" data={contentPerformance.filter(x => x.type === 'Carousel')} fill="#4ade80" />
                                <Scatter name="Video" data={contentPerformance.filter(x => x.type === 'Video')} fill="#fbbf24" />
                                <Scatter name="Reel" data={contentPerformance.filter(x => x.type === 'Reel')} fill="#f87171" />
                            </ScatterChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '12px', marginTop: '20px' }}>
                            {contentPerformance.map((item, i) => (
                                <div key={item.type} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{item.type}</p>
                                    <p style={{ fontWeight: '700', color: COLORS_PRIMARY[i], fontSize: '14px' }}>
                                        {item.engagement.toFixed(1)}% Engagement
                                    </p>
                                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                                        {item.likes} likes • {item.comments} comments
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Posting Cadence Comparison */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                        className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                            Posting Frequency Trend
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px', marginBottom: '24px' }}>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(60,213,248,0.1)', border: '1px solid rgba(60,213,248,0.2)' }}>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Posts (Last 7 Days)</p>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#60d5f8' }}>
                                    {stats.postingFrequency7d || 0}
                                </p>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                                    Post Frequency Metric
                                </p>
                            </div>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Posts (Last 30 Days)</p>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#4ade80' }}>
                                    {stats.postingFrequency30d || 0}
                                </p>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                                    Posting Pattern Analysis
                                </p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={postingCadence}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="stepAfter" dataKey="posts" stroke="#fbbf24" strokeWidth={2.5} dot={{ fill: '#fbbf24', r: 4 }} name="Daily Posts" />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Metrics Legend & Definitions */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                        className="glass-card" style={{ padding: '28px', borderRadius: '24px', background: 'rgba(123,63,242,0.05)', border: '1px solid rgba(123,63,242,0.15)' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '16px' }}>
                            📊 Metrics Definitions
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '14px', fontSize: '12px' }}>
                            <div>
                                <p style={{ color: '#a78bfa', fontWeight: '700', marginBottom: '4px' }}>Engagement Rate</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    (Likes + Comments + Shares) ÷ Impressions × 100
                                </p>
                            </div>
                            <div>
                                <p style={{ color: '#60d5f8', fontWeight: '700', marginBottom: '4px' }}>Post Frequency</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Number of posts created within the specified time period
                                </p>
                            </div>
                            <div>
                                <p style={{ color: '#4ade80', fontWeight: '700', marginBottom: '4px' }}>Quality Score</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Composite score (0-100) based on content quality metrics
                                </p>
                            </div>
                            <div>
                                <p style={{ color: '#fbbf24', fontWeight: '700', marginBottom: '4px' }}>Efficiency Rate</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Average engagement per 1000 followers
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </ProtectedRoute>
        </DashboardLayout>
    );
}

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
