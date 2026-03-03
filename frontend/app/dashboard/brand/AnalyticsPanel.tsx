'use client';
import { motion } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { X, Bot, Eye, Heart, MessageCircle, Bookmark, Share2, TrendingUp, Link2 } from 'lucide-react';
import { MOCK_ANALYTICS, MOCK_CAMPAIGNS, MOCK_INFLUENCERS } from './data';

const PALETTE = ['#7B3FF2', '#A855F7', '#60d5f8', '#4ade80'];

function AnimatedStat({ label, value, icon, color, suffix = '' }: { label: string; value: string | number; icon: React.ReactNode; color: string; suffix?: string }) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ padding: '20px', borderRadius: '20px', background: `${color}0c`, border: `1px solid ${color}22`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: `inset 0 0 40px ${color}08`, pointerEvents: 'none' }} />
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, margin: '0 auto 10px' }}>{icon}</div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.6rem', color, letterSpacing: '-0.04em', filter: `drop-shadow(0 0 12px ${color}80)` }}>{value}{suffix}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{label}</p>
        </motion.div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(14,12,26,0.95)', border: '1px solid rgba(123,63,242,0.3)', borderRadius: '12px', padding: '10px 14px', backdropFilter: 'blur(20px)' }}>
            {label && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>{label}</p>}
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color || '#a78bfa', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px' }}>
                    {p.name}: {typeof p.value === 'number' && p.value > 1000 ? `${(p.value / 1000).toFixed(1)}K` : p.value}
                </p>
            ))}
        </div>
    );
};

interface Props { campaignId: string | null; influencerId: string | null; onClose: () => void; }

export default function AnalyticsPanel({ campaignId, influencerId, onClose }: Props) {
    const campaign = MOCK_CAMPAIGNS.find(c => c.id === campaignId);
    const influencer = MOCK_INFLUENCERS.find(i => i.id === influencerId) || (campaign ? MOCK_INFLUENCERS.find(i => i.username === campaign.influencer) : null);
    const { views, days, engagement, demographics, sentiment } = MOCK_ANALYTICS;

    const viewsData = days.map((d, i) => ({ day: d, Views: views[i] }));
    const demoPie = demographics.map((d, i) => ({ ...d, fill: PALETTE[i] }));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', overflowY: 'auto', padding: '24px' }}>
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                style={{ maxWidth: '960px', margin: '0 auto', background: 'rgba(10,9,20,0.95)', border: '1px solid rgba(123,63,242,0.22)', borderRadius: '36px', boxShadow: '0 0 120px rgba(123,63,242,0.25)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: 'rgba(123,63,242,0.05)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px', boxShadow: '0 0 24px rgba(123,63,242,0.5)', flexShrink: 0 }}>
                        {influencer?.avatar || campaign?.avatar || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff', letterSpacing: '-0.02em' }}>
                                {influencer?.name || campaign?.influencer || 'Influencer'} — AI Campaign Intelligence
                            </h2>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#4ade80', fontWeight: '700', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', padding: '2px 8px', borderRadius: '99px' }}>
                                <Bot size={10} /> AI Analysis Active
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {campaign?.postUrl && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#60d5f8' }}>
                                    <Link2 size={11} /> {campaign.postUrl}
                                </div>
                            )}
                            {campaign?.deal && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Deal: <strong style={{ color: '#a78bfa' }}>${campaign.deal.toLocaleString()}</strong></span>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {/* Animated stat boxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '12px' }}>
                        <AnimatedStat label="Total Views" value="91K" icon={<Eye size={16} />} color="#7B3FF2" />
                        <AnimatedStat label="Total Likes" value="7.4K" icon={<Heart size={16} />} color="#A855F7" />
                        <AnimatedStat label="Comments" value="2.9K" icon={<MessageCircle size={16} />} color="#60d5f8" />
                        <AnimatedStat label="Saves" value="1.8K" icon={<Bookmark size={16} />} color="#4ade80" />
                        <AnimatedStat label="Shares" value="940" icon={<Share2 size={16} />} color="#fb923c" />
                        <AnimatedStat label="Engagement" value="8.2" suffix="%" icon={<TrendingUp size={16} />} color="#facc15" />
                    </div>

                    {/* Line chart — views over time */}
                    <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#fff', marginBottom: '18px' }}>📈 Views Over Time</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={viewsData}>
                                <defs>
                                    <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#7B3FF2" />
                                        <stop offset="100%" stopColor="#A855F7" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="Views" stroke="url(#lg1)" strokeWidth={3} dot={{ fill: '#A855F7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#A855F7', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Bar chart — engagement breakdown */}
                        <div style={{ padding: '22px', borderRadius: '22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '14px' }}>📊 Engagement Breakdown</p>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={engagement} barSize={28}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {engagement.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Donut chart — demographics */}
                        <div style={{ padding: '22px', borderRadius: '22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '14px' }}>🎯 Audience Demographics</p>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={demoPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                                        {demoPie.map((entry, i) => <Cell key={i} fill={entry.fill} style={{ filter: `drop-shadow(0 0 6px ${entry.fill}80)` }} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} formatter={(v: number) => [`${v}%`]} />
                                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px' }}>{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comment Sentiment */}
                    <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#fff' }}>💬 Comment Sentiment Analysis</p>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#A855F7', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                <Bot size={9} /> AI Powered
                            </span>
                        </div>
                        {[
                            { label: 'Positive', pct: sentiment.positive, color: '#4ade80', emoji: '😊' },
                            { label: 'Neutral', pct: sentiment.neutral, color: '#60d5f8', emoji: '😐' },
                            { label: 'Negative', pct: sentiment.negative, color: '#f87171', emoji: '😞' },
                        ].map(s => (
                            <div key={s.label} style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{s.emoji} {s.label}</span>
                                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: s.color }}>{s.pct}%</span>
                                </div>
                                <div className="progress-bar" style={{ height: '8px', borderRadius: '4px' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                                        style={{ height: '100%', borderRadius: '4px', background: `linear-gradient(90deg, ${s.color}90, ${s.color})`, boxShadow: `0 0 10px ${s.color}60` }} />
                                </div>
                            </div>
                        ))}
                        <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>🤖</span>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                                AI Insight: <strong style={{ color: '#4ade80' }}>72% positive sentiment</strong> — strong brand affinity. Comments highlight product quality and influencer authenticity.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
