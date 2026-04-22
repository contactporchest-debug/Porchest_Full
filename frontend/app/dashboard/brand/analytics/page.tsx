'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Area, AreaChart,
    ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

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
        }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ color: entry.color || '#fff', fontWeight: 600 }}>
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </p>
            ))}
        </div>
    );
};

const COLORS = ['#7B3FF2', '#60d5f8', '#4ade80', '#fbbf24'];

export default function BrandAnalyticsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) return (
        <DashboardLayout>
            <ProtectedRoute allowedRoles={['brand']}>
                <div style={{ textAlign: 'center', padding: '80px' }}>
                    <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                </div>
            </ProtectedRoute>
        </DashboardLayout>
    );

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    const campaignData = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        campaigns: Math.floor(Math.random() * 5) + 2,
        verifications: Math.floor((days - i) * 0.3 + Math.random() * 3),
    }));

    const engagementData = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        engagement: Math.round((4 + Math.random() * 3) * 100) / 100,
        reach: Math.floor(Math.random() * 50000) + 20000,
    }));

    const performanceScores = [
        { metric: 'Campaign ROI', value: 75 },
        { metric: 'Quality', value: 78 },
        { metric: 'Brand Alignment', value: 82 },
        { metric: 'Performance', value: 85 },
    ];

    const influencerTiers = [
        { segment: 'Nano', count: 45, engagement: 6.8, conversion: 8.5 },
        { segment: 'Micro', count: 28, engagement: 4.2, conversion: 6.3 },
        { segment: 'Mid-Tier', count: 12, engagement: 2.8, conversion: 4.1 },
        { segment: 'Macro', count: 8, engagement: 1.5, conversion: 2.8 },
    ];

    const budgetData = [
        { name: 'Nano', value: 35 },
        { name: 'Micro', value: 30 },
        { name: 'Mid-Tier', value: 20 },
        { name: 'Macro', value: 15 },
    ];

    const kpiCards = [
        { label: 'Active Campaigns', value: '12', change: '+2 this month', color: '#7B3FF2', icon: '📊' },
        { label: 'Total Verifications', value: '84', change: '92% approved', color: '#60d5f8', icon: '✅' },
        { label: 'Influencers', value: '93', change: '+8 new', color: '#4ade80', icon: '👥' },
        { label: 'Avg Engagement', value: '4.62%', change: '+0.3% prev', color: '#fbbf24', icon: '⚡' },
    ];

    return (
        <DashboardLayout>
            <ProtectedRoute allowedRoles={['brand']}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '26px', color: '#fff' }}>
                                Campaign Analytics
                            </h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                Performance metrics • Updated {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
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
                                    }}>
                                    {range === '7d' ? '7d' : range === '30d' ? '30d' : 'All'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px' }}>
                        {kpiCards.map((card, i) => (
                            <motion.div key={card.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                className="glass-card" style={{ padding: '20px', borderRadius: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                                        {card.label}
                                    </p>
                                    <span style={{ fontSize: '18px' }}>{card.icon}</span>
                                </div>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '24px', color: card.color, marginBottom: '6px' }}>
                                    {card.value}
                                </p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{card.change}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                            Campaign Trends
                        </h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={campaignData}>
                                <defs>
                                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#7B3FF2" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#7B3FF2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" />
                                <YAxis stroke="rgba(255,255,255,0.1)" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="campaigns" stroke="#7B3FF2" fill="url(#grad1)" strokeWidth={2} />
                                <Area type="monotone" dataKey="verifications" stroke="#60d5f8" fill="rgba(96,213,248,0.1)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '14px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
                            className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                                Engagement Rate
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={engagementData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" />
                                    <YAxis stroke="rgba(255,255,255,0.1)" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="engagement" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
                            className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                                Campaign Reach
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={engagementData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" />
                                    <YAxis stroke="rgba(255,255,255,0.1)" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="reach" fill="#60d5f8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '14px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }}
                            className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                                Influencer Performance
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <ComposedChart data={influencerTiers}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="segment" stroke="rgba(255,255,255,0.1)" />
                                    <YAxis stroke="rgba(255,255,255,0.1)" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="engagement" fill="#f87171" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="conversion" fill="#4ade80" radius={[6, 6, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.40 }}
                            className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                                Budget Allocation
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie data={budgetData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                                        {budgetData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
                        className="glass-card" style={{ padding: '28px', borderRadius: '24px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '24px' }}>
                            Performance Scores
                        </h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={performanceScores}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)' }} />
                                <Radar name="Score" dataKey="value" stroke="#7B3FF2" fill="#7B3FF2" fillOpacity={0.3} />
                                <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </motion.div>
            </ProtectedRoute>
        </DashboardLayout>
    );
}
