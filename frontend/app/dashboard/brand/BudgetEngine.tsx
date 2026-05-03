'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Zap, TrendingUp } from 'lucide-react';

const PRIMARY = '#C2340A';
const ACCENT = '#E8400A';

function CircleProgress({ pct }: { pct: number }) {
    const r = 56, c = 2 * Math.PI * r;
    return (
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="8" />
            <circle cx="70" cy="70" r={r} fill="none" stroke="url(#pg)" strokeWidth="8"
                strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
                strokeLinecap="round" transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.23,1,0.32,1)' }} />
            <defs>
                <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={PRIMARY} />
                    <stop offset="100%" stopColor={ACCENT} />
                </linearGradient>
            </defs>
            <text x="70" y="66" textAnchor="middle" fill="#1A0A00" fontSize="20" fontWeight="800" fontFamily="Space Grotesk, sans-serif">{pct}%</text>
            <text x="70" y="84" textAnchor="middle" fill="#7A5030" fontSize="10" fontWeight="600" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>allocated</text>
        </svg>
    );
}

export default function BudgetEngine() {
    const total = 20000;
    const [allocated, setAllocated] = useState(12400);
    const spent = 8600;
    const remaining = total - allocated;
    const pct = Math.round((allocated / total) * 100);
    const spentPct = Math.round((spent / allocated) * 100);

    return (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{ padding: '32px', borderRadius: '32px', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid #EDD9BC', boxShadow: '0 8px 32px rgba(26,10,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(194,52,10,0.1)', border: '1px solid rgba(194,52,10,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={20} style={{ color: PRIMARY }} />
                </div>
                <div>
                    <h2 style={{ fontWeight: 800, fontSize: '18px', color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '4px' }}>Campaign Allocation Engine</h2>
                    <p style={{ fontSize: '13px', color: '#7A5030', fontWeight: 500 }}>AI-optimized budget distribution</p>
                </div>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#059669', fontWeight: 700, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 12px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block', boxShadow: '0 0 8px rgba(5,150,105,0.5)' }} /> AI Active
                </span>
            </div>

            <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
                <CircleProgress pct={pct} />
                <div style={{ flex: 1, minWidth: '220px' }}>
                    {/* Total budget */}
                    <p style={{ fontSize: '11px', color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 700 }}>Total Budget</p>
                    <p style={{ fontWeight: 800, fontSize: '2.4rem', letterSpacing: '-0.04em', background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: '24px' }}>
                        ${total.toLocaleString()}
                    </p>

                    {[
                        { label: 'Allocated', val: allocated, color: PRIMARY },
                        { label: 'Active Spend', val: spent, color: '#C4A882' },
                        { label: 'Remaining', val: remaining, color: '#059669' },
                    ].map(s => (
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                                <span style={{ fontSize: '14px', color: '#1A0A00', fontWeight: 500 }}>{s.label}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: s.color }}>${s.val.toLocaleString()}</span>
                        </div>
                    ))}

                    {/* Spent % bar */}
                    <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '12px', color: '#7A5030', marginBottom: '8px', fontWeight: 500 }}>Spend velocity — <strong style={{ color: '#1A0A00' }}>{spentPct}%</strong> of allocated deployed</p>
                        <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.6)', overflow: 'hidden' }}>
                            <div style={{ width: `${spentPct}%`, height: '100%', background: `linear-gradient(90deg, #C4A882, ${PRIMARY})`, borderRadius: '4px' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Allocation slider */}
            <div style={{ marginTop: '32px', padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <p style={{ fontSize: '14px', color: '#1A0A00', fontWeight: 700 }}>Adjust Campaign Allocation</p>
                    <span style={{ fontWeight: 800, fontSize: '16px', color: PRIMARY }}>${allocated.toLocaleString()}</span>
                </div>
                <input type="range" min={0} max={total} step={100} value={allocated}
                    onChange={e => setAllocated(Number(e.target.value))}
                    style={{ width: '100%', accentColor: PRIMARY, height: '6px', cursor: 'pointer', background: '#EDD9BC', borderRadius: '3px', outline: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#7A5030', fontWeight: 500 }}>$0</span>
                    <span style={{ fontSize: '12px', color: '#7A5030', fontWeight: 500 }}>${total.toLocaleString()}</span>
                </div>
            </div>

            {/* Campaign mini breakdown */}
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                {[
                    { name: 'Summer Launch', alloc: 5000, color: PRIMARY },
                    { name: 'Protein Series', alloc: 4200, color: '#C4A882' },
                    { name: 'Smart Gadgets', alloc: 1800, color: '#059669' },
                    { name: 'Gourmet Promo', alloc: 1400, color: '#d97706' },
                ].map(c => (
                    <div key={c.name} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: `1px solid ${c.color}30` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#1A0A00', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px', fontWeight: 600 }}>{c.name}</span>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: c.color }}>${c.alloc.toLocaleString()}</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.8)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${(c.alloc / allocated) * 100}%`, height: '100%', background: c.color, borderRadius: '2px' }} />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
