'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, BarChart3 } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import {
    LineChart, Line, BarChart, Bar, ResponsiveContainer,
    XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell,
} from 'recharts';
import toast from 'react-hot-toast';

const CHART_STYLE = {
    background: 'transparent',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
};

const CustomTooltipStyle: React.CSSProperties = {
    background: 'rgba(10,9,20,0.95)',
    border: '1px solid rgba(123,63,242,0.25)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#fff',
    padding: '10px 14px',
};

export default function AnalyticsPage() {
    const [verifications, setVerifications] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([brandAPI.getRequests(), brandAPI.getBrandVerifications()])
            .then(([rr, vr]) => {
                setRequests(rr.data.requests || []);
                setVerifications(vr.data.verifications || []);
            })
            .catch(() => toast.error('Failed to load analytics'))
            .finally(() => setLoading(false));
    }, []);

    // Running = accepted + verified
    const verifiedReqIds = new Set(verifications.filter(v => v.status === 'verified').map(v => v.campaignRequestId?._id || v.campaignRequestId));
    const runningRequests = requests.filter(r => r.status === 'accepted' && verifiedReqIds.has(r._id));
    const verifiedRows = verifications.filter(v => v.status === 'verified');

    const hasData = runningRequests.length > 0 && verifiedRows.length > 0;

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px' }}>
            <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
        </div>
    );

    if (!hasData) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>Analytics</h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Live performance from running campaigns</p>
            </div>
            <div className="glass-card" style={{ padding: '80px 40px', borderRadius: '32px', textAlign: 'center' }}>
                <BarChart3 size={52} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 20px' }} />
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '18px', color: '#fff', marginBottom: '8px' }}>No Analytics Yet</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', maxWidth: '360px', margin: '0 auto' }}>
                    Analytics will appear once campaigns are running and influencer posts have been verified by admin.
                </p>
            </div>
        </div>
    );

    // Aggregate metrics across selected or all running campaigns
    const targetVerifications = selectedId === 'all'
        ? verifiedRows
        : verifiedRows.filter(v => (v.campaignRequestId?._id || v.campaignRequestId) === selectedId);

    const totals = targetVerifications.reduce((acc, v) => {
        const p = v.performance || {};
        acc.views += p.views || 0;
        acc.likes += p.likes || 0;
        acc.comments += p.comments || 0;
        acc.shares += p.shares || 0;
        acc.saves += p.saves || 0;
        return acc;
    }, { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 });

    const totalEngagement = totals.likes + totals.comments + totals.shares + totals.saves;
    const totalSpend = (selectedId === 'all' ? runningRequests : runningRequests.filter(r => r._id === selectedId))
        .reduce((s, r) => s + (r.agreedPrice || 0), 0);

    // Build bar chart data for engagement breakdown
    const engagementData = [
        { name: 'Likes', value: totals.likes },
        { name: 'Comments', value: totals.comments },
        { name: 'Shares', value: totals.shares },
        { name: 'Saves', value: totals.saves },
    ];
    const engagementColors = ['#7B3FF2', '#60d5f8', '#4ade80', '#fbbf24'];

    // Campaign selector options
    const selectorOptions = [
        { id: 'all', label: 'All Running Campaigns' },
        ...runningRequests.map(r => ({ id: r._id, label: r.campaignTitle })),
    ];

    const statCards = [
        { label: 'Total Views', val: totals.views.toLocaleString(), color: '#60d5f8' },
        { label: 'Total Engagement', val: totalEngagement.toLocaleString(), color: '#a78bfa' },
        { label: 'Total Spend', val: `$${totalSpend.toLocaleString()}`, color: '#4ade80' },
        { label: 'Verified Posts', val: targetVerifications.length.toString(), color: '#fbbf24' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Header + campaign selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>Analytics</h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Live performance from verified running campaigns</p>
                </div>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                    style={{ padding: '9px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', minWidth: '200px' }}>
                    {selectorOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
            </div>

            {/* Overview stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px' }}>
                {statCards.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.7rem', color: s.color, letterSpacing: '-0.04em', filter: `drop-shadow(0 0 10px ${s.color}50)` }}>{s.val}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '5px' }}>{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Engagement breakdown bar chart */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                className="glass-card" style={{ padding: '26px', borderRadius: '26px' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: '18px' }}>Engagement Breakdown</p>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={engagementData} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: 'rgba(123,63,242,0.07)' }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {engagementData.map((_, i) => <Cell key={i} fill={engagementColors[i % engagementColors.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Top performing campaigns */}
            {selectedId === 'all' && runningRequests.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                    className="glass-card" style={{ padding: '26px', borderRadius: '26px' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: '18px' }}>Top Performing Campaigns</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {runningRequests.map((r: any) => {
                            const ver = verifiedRows.find(v => (v.campaignRequestId?._id || v.campaignRequestId) === r._id);
                            const views = ver?.performance?.views || 0;
                            const engagement = (ver?.performance?.likes || 0) + (ver?.performance?.comments || 0);
                            return (
                                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>{r.campaignTitle}</p>
                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{r.influencerId?.fullName || '—'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '12px', color: '#60d5f8', fontWeight: '600' }}>{views.toLocaleString()} views</p>
                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{engagement.toLocaleString()} engagements</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
