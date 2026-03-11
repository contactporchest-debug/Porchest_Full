'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(14,12,26,0.95)', border: '1px solid rgba(123,63,242,0.3)', borderRadius: '12px', padding: '10px 14px', backdropFilter: 'blur(20px)' }}>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.fill || '#a78bfa', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px' }}>{p.name}: ${p.value.toLocaleString()}</p>
            ))}
        </div>
    );
};

export default function ROIPanel() {
    const [requests, setRequests] = useState<any[]>([]);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([brandAPI.getRequests(), brandAPI.getBrandVerifications()])
            .then(([r, v]) => {
                setRequests(r.data.requests || []);
                setVerifications(v.data.verifications || []);
            })
            .catch(() => toast.error('Failed to load financial data'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px' }}>
            <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
        </div>
    );

    const accepted = requests.filter(r => r.status === 'accepted');
    const totalSpend = accepted.reduce((s, r) => s + (r.agreedPrice || 0), 0);
    const verifiedRows = verifications.filter(v => v.status === 'verified');

    // Build chart data from real accepted requests
    const dealChartData = accepted.slice(0, 6).map(r => ({
        name: (r.influencerId?.fullName || 'Influencer').split(' ')[0],
        Deal: r.agreedPrice || 0,
    }));

    const statCards = [
        { label: 'Total Committed Spend', val: totalSpend > 0 ? `$${totalSpend.toLocaleString()}` : '—', color: '#A855F7', icon: <DollarSign size={16} /> },
        { label: 'Active Collaborations', val: accepted.length.toString(), color: '#4ade80', icon: <TrendingUp size={16} /> },
        { label: 'Verified Campaigns', val: verifiedRows.length.toString(), color: '#60d5f8', icon: <CheckCircle size={16} /> },
        { label: 'Pending Response', val: requests.filter(r => r.status === 'pending').length.toString(), color: '#fbbf24', icon: <Zap size={16} /> },
    ];

    // Empty state
    if (requests.length === 0) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '80px 40px', borderRadius: '32px', textAlign: 'center' }}>
                <DollarSign size={52} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 20px' }} />
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '18px', color: '#fff', marginBottom: '8px' }}>No Financial Data Yet</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', maxWidth: '360px', margin: '0 auto' }}>
                    Financial summaries will appear once you start sending campaign requests and working with influencers.
                </p>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Summary Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                className="glass-card" style={{ padding: '28px', borderRadius: '28px', background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(123,63,242,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={17} style={{ color: '#4ade80' }} />
                    </div>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: '#fff', letterSpacing: '-0.02em' }}>Campaign Financial Summary</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: dealChartData.length > 0 ? '24px' : '0' }}>
                    {statCards.map(s => (
                        <div key={s.label} style={{ padding: '18px', borderRadius: '18px', background: `${s.color}0a`, border: `1px solid ${s.color}20`, textAlign: 'center' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${s.color}15`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, margin: '0 auto 10px' }}>{s.icon}</div>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.4rem', color: s.color, letterSpacing: '-0.03em' }}>{s.val}</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Deal spend bar chart — live data */}
                {dealChartData.length > 0 && (
                    <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '14px' }}>Deal Spend by Influencer</p>
                        <ResponsiveContainer width="100%" height={170}>
                            <BarChart data={dealChartData} barGap={4} barSize={28}>
                                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="Deal" radius={[4, 4, 0, 0]} name="Deal" style={{ filter: 'drop-shadow(0 0 6px rgba(123,63,242,0.5))' }}>
                                    {dealChartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#7B3FF2' : '#A855F7'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </motion.div>

            {/* Accepted Requests — deal history */}
            {accepted.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                    className="glass-card" style={{ padding: '28px', borderRadius: '28px', background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '20px' }}>Active Deal Tracking</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {accepted.map((r: any, i: number) => {
                            const inf = r.influencerId;
                            const initials = (inf?.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const isVerified = verifiedRows.some(v => (v.campaignRequestId?._id || v.campaignRequestId) === r._id);
                            return (
                                <div key={r._id} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: '#fff', flexShrink: 0 }}>{initials}</div>
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#fff', marginBottom: '2px' }}>{r.campaignTitle}</p>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{inf?.fullName || '—'} · {new Date(r.postingDeadline).toLocaleDateString()}</p>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#a78bfa' }}>${r.agreedPrice?.toLocaleString()}</p>
                                    <span style={{ padding: '3px 11px', borderRadius: '99px', background: isVerified ? 'rgba(74,222,128,0.08)' : 'rgba(96,213,248,0.08)', border: `1px solid ${isVerified ? 'rgba(74,222,128,0.2)' : 'rgba(96,213,248,0.2)'}`, color: isVerified ? '#4ade80' : '#60d5f8', fontSize: '11px', fontWeight: '700' }}>
                                        {isVerified ? 'Completed ✓' : 'In-Process'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
