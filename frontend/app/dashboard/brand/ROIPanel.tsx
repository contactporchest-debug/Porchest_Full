'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const SURFACE = 'rgba(255,255,255,0.4)';
const SURFACE_ALT = 'rgba(255,255,255,0.6)';
const BORDER = '#EDD9BC';
const TEXT = '#1A0A00';
const MUTED = '#7A5030';
const PRIMARY = '#C2340A';

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #EDD9BC', borderRadius: '12px', padding: '10px 14px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.fill || PRIMARY, fontWeight: 700, fontSize: '13px' }}>{p.name}: ${p.value.toLocaleString()}</p>
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
            <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: PRIMARY }} />
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
        { label: 'Total Committed Spend', val: totalSpend > 0 ? `$${totalSpend.toLocaleString()}` : '—', color: PRIMARY, icon: <DollarSign size={16} /> },
        { label: 'Active Collaborations', val: accepted.length.toString(), color: '#059669', icon: <TrendingUp size={16} /> },
        { label: 'Verified Campaigns', val: verifiedRows.length.toString(), color: '#0284c7', icon: <CheckCircle size={16} /> },
        { label: 'Pending Response', val: requests.filter(r => r.status === 'pending').length.toString(), color: '#d97706', icon: <Zap size={16} /> },
    ];

    // Empty state
    if (requests.length === 0) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '80px 40px', borderRadius: '24px', textAlign: 'center', background: SURFACE, border: `1px solid ${BORDER}` }}>
                <DollarSign size={52} style={{ color: '#C4A882', margin: '0 auto 20px' }} />
                <p style={{ fontWeight: 800, fontSize: '18px', color: TEXT, marginBottom: '8px' }}>No Financial Data Yet</p>
                <p style={{ color: MUTED, fontSize: '14px', maxWidth: '360px', margin: '0 auto' }}>
                    Financial summaries will appear once you start sending campaign requests and working with influencers.
                </p>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Summary Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                style={{ padding: '32px', borderRadius: '32px', background: SURFACE, backdropFilter: 'blur(12px)', border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(26,10,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={18} style={{ color: '#059669' }} />
                    </div>
                    <h2 style={{ fontWeight: 800, fontSize: '18px', color: TEXT, letterSpacing: '-0.02em' }}>Campaign Financial Summary</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: dealChartData.length > 0 ? '32px' : '0' }}>
                    {statCards.map(s => (
                        <div key={s.label} style={{ padding: '20px', borderRadius: '20px', background: SURFACE_ALT, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, margin: '0 auto 12px' }}>{s.icon}</div>
                            <p style={{ fontWeight: 800, fontSize: '1.6rem', color: s.color, letterSpacing: '-0.02em', marginBottom: '4px' }}>{s.val}</p>
                            <p style={{ fontSize: '12px', color: MUTED, fontWeight: 500 }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Deal spend bar chart — live data */}
                {dealChartData.length > 0 && (
                    <div style={{ padding: '24px', borderRadius: '24px', background: SURFACE_ALT, border: `1px solid ${BORDER}` }}>
                        <p style={{ fontWeight: 700, fontSize: '14px', color: TEXT, marginBottom: '20px' }}>Deal Spend by Influencer</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={dealChartData} barGap={4} barSize={32}>
                                <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(26,10,0,0.02)' }} />
                                <Bar dataKey="Deal" radius={[6, 6, 0, 0]} name="Deal">
                                    {dealChartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? PRIMARY : '#E8400A'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </motion.div>

            {/* Accepted Requests — deal history */}
            {accepted.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                    style={{ padding: '32px', borderRadius: '32px', background: SURFACE, backdropFilter: 'blur(12px)', border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(26,10,0,0.04)' }}>
                    <h2 style={{ fontWeight: 800, fontSize: '18px', color: TEXT, letterSpacing: '-0.02em', marginBottom: '24px' }}>Active Deal Tracking</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {accepted.map((r: any, i: number) => {
                            const inf = r.influencerId;
                            const initials = (inf?.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const isVerified = verifiedRows.some(v => (v.campaignRequestId?._id || v.campaignRequestId) === r._id);
                            return (
                                <div key={r._id} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', background: SURFACE_ALT, border: `1px solid ${BORDER}`, flexWrap: 'wrap', transition: 'border-color 0.2s', cursor: 'default' }}
                                     onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(194,52,10,0.3)'}
                                     onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff', flexShrink: 0, border: `1px solid ${BORDER}` }}>{initials}</div>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <p style={{ fontWeight: 700, fontSize: '15px', color: TEXT, marginBottom: '4px' }}>{r.campaignTitle}</p>
                                        <p style={{ fontSize: '13px', color: MUTED, fontWeight: 500 }}>{inf?.fullName || '—'} · {new Date(r.postingDeadline).toLocaleDateString()}</p>
                                    </div>
                                    <p style={{ fontWeight: 800, fontSize: '16px', color: PRIMARY }}>${r.agreedPrice?.toLocaleString()}</p>
                                    <span style={{ padding: '6px 14px', borderRadius: '99px', background: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(2,132,199,0.1)', border: `1px solid ${isVerified ? 'rgba(16,185,129,0.2)' : 'rgba(2,132,199,0.2)'}`, color: isVerified ? '#059669' : '#0284c7', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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
