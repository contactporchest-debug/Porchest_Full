'use client';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DEAL_HISTORY } from './data';

const CustomTooltip = ({ active, payload, label }: any) => {
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
    const totalDeal = DEAL_HISTORY.reduce((s, d) => s + d.deal, 0);
    const totalRevenue = 18400;
    const roi = Math.round(((totalRevenue - totalDeal) / totalDeal) * 100);
    const costPerEng = (totalDeal / 14200).toFixed(3);

    const dealVsRevenue = DEAL_HISTORY.map(d => ({
        name: d.influencer,
        Deal: d.deal,
        Revenue: Math.round(d.deal * (parseFloat(d.roi) / 100 + 1)),
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ROI Summary Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                className="glass-card" style={{ padding: '28px', borderRadius: '28px', background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(123,63,242,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={17} style={{ color: '#4ade80' }} />
                    </div>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: '#fff', letterSpacing: '-0.02em' }}>Campaign Financial Summary</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {[
                        { label: 'Total Deal Spend', val: `$${totalDeal.toLocaleString()}`, color: '#A855F7', icon: <DollarSign size={16} /> },
                        { label: 'Revenue Generated', val: `$${totalRevenue.toLocaleString()}`, color: '#4ade80', icon: <TrendingUp size={16} /> },
                        { label: 'Cost Per Engagement', val: `$${costPerEng}`, color: '#60d5f8', icon: <Zap size={16} /> },
                        {
                            label: 'ROI', val: `+${roi}%`, color: roi > 0 ? '#4ade80' : '#f87171', icon: <CheckCircle size={16} />,
                            glow: roi > 0,
                        },
                    ].map(s => (
                        <div key={s.label} style={{ padding: '18px', borderRadius: '18px', background: `${s.color}0a`, border: `1px solid ${s.color}20`, textAlign: 'center' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${s.color}15`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, margin: '0 auto 10px' }}>{s.icon}</div>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.4rem', color: s.color, letterSpacing: '-0.03em', filter: (s as any).glow ? `drop-shadow(0 0 10px ${s.color}90)` : 'none' }}>{s.val}</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Deal vs Revenue bar chart */}
                <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '14px' }}>Deal vs Revenue Generated</p>
                    <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={dealVsRevenue} barGap={4} barSize={22}>
                            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Deal" fill="#7B3FF2" radius={[4, 4, 0, 0]} name="Deal" style={{ filter: 'drop-shadow(0 0 6px rgba(123,63,242,0.5))' }} />
                            <Bar dataKey="Revenue" fill="#4ade80" radius={[4, 4, 0, 0]} name="Revenue" style={{ filter: 'drop-shadow(0 0 6px rgba(74,222,128,0.4))' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Deal History Timeline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="glass-card" style={{ padding: '28px', borderRadius: '28px', background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '24px' }}>Deal History &amp; Tracking</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {DEAL_HISTORY.map((d, i) => (
                        <div key={d.id} style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
                            {/* Timeline */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', boxShadow: '0 0 16px rgba(123,63,242,0.5)', color: '#fff', flexShrink: 0 }}>{d.avatar}</div>
                                {i < DEAL_HISTORY.length - 1 && <div style={{ width: '2px', flex: 1, minHeight: '28px', background: 'linear-gradient(180deg, rgba(123,63,242,0.5), rgba(123,63,242,0.1))', margin: '4px 0' }} />}
                            </div>

                            {/* Card */}
                            <div style={{ flex: 1, padding: '16px 18px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: i < DEAL_HISTORY.length - 1 ? '8px' : '0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#fff', marginBottom: '2px' }}>{d.influencer}</p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{d.campaign} · {d.date}</p>
                                </div>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#a78bfa' }}>${d.deal.toLocaleString()}</p>
                                <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#4ade80', filter: 'drop-shadow(0 0 6px rgba(74,222,128,0.7))' }}>{d.roi}</span>
                                <span className={`badge ${d.outcome === 'Completed' ? 'badge-green' : 'badge-purple'}`}>{d.outcome}</span>
                                <span className={`badge ${d.paid ? 'badge-green' : 'badge-yellow'}`}>{d.paid ? 'Paid' : 'Pending'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
