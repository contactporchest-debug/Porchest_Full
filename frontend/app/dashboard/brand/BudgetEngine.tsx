'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Zap, TrendingUp } from 'lucide-react';

const PURPLE = '#7B3FF2';
const ACCENT = '#A855F7';

function CircleProgress({ pct }: { pct: number }) {
    const r = 56, c = 2 * Math.PI * r;
    return (
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="70" cy="70" r={r} fill="none" stroke="url(#pg)" strokeWidth="8"
                strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
                strokeLinecap="round" transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.23,1,0.32,1)', filter: 'drop-shadow(0 0 8px rgba(123,63,242,0.7))' }} />
            <defs>
                <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={PURPLE} />
                    <stop offset="100%" stopColor={ACCENT} />
                </linearGradient>
            </defs>
            <text x="70" y="66" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800" fontFamily="Space Grotesk">{pct}%</text>
            <text x="70" y="84" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="Inter">allocated</text>
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
            className="glass-card" style={{ padding: '32px', borderRadius: '32px', background: 'rgba(14,12,26,0.75)', boxShadow: '0 0 80px rgba(123,63,242,0.14)', border: '1px solid rgba(123,63,242,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(123,63,242,0.15)', border: '1px solid rgba(123,63,242,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: '#fff', letterSpacing: '-0.02em' }}>Campaign Allocation Engine</h2>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>AI-optimized budget distribution</p>
                </div>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#4ade80', fontWeight: '700', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '3px 10px', borderRadius: '99px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} /> AI Active
                </span>
            </div>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                <CircleProgress pct={pct} />
                <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* Total budget */}
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total Budget</p>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2.4rem', letterSpacing: '-0.04em', background: `linear-gradient(90deg, ${PURPLE}, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1', marginBottom: '20px' }}>
                        ${total.toLocaleString()}
                    </p>

                    {[
                        { label: 'Allocated', val: allocated, color: PURPLE },
                        { label: 'Active Spend', val: spent, color: '#60d5f8' },
                        { label: 'Remaining', val: remaining, color: '#4ade80' },
                    ].map(s => (
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}`, display: 'inline-block' }} />
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                            </div>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: s.color }}>${s.val.toLocaleString()}</span>
                        </div>
                    ))}

                    {/* Spent % bar */}
                    <div style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Spend velocity — {spentPct}% of allocated deployed</p>
                        <div className="progress-bar" style={{ height: '6px', borderRadius: '3px' }}>
                            <div className="progress-fill" style={{ width: `${spentPct}%`, background: `linear-gradient(90deg, #60d5f8, #a78bfa)`, boxShadow: '0 0 8px rgba(96,213,248,0.5)' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Allocation slider */}
            <div style={{ marginTop: '28px', padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>Adjust Campaign Allocation</p>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#a78bfa' }}>${allocated.toLocaleString()}</span>
                </div>
                <input type="range" min={0} max={total} step={100} value={allocated}
                    onChange={e => setAllocated(Number(e.target.value))}
                    style={{ width: '100%', accentColor: PURPLE, height: '4px', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>$0</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>${total.toLocaleString()}</span>
                </div>
            </div>

            {/* Campaign mini breakdown */}
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {[
                    { name: 'Summer Launch', alloc: 5000, color: PURPLE },
                    { name: 'Protein Series', alloc: 4200, color: ACCENT },
                    { name: 'Smart Gadgets', alloc: 1800, color: '#60d5f8' },
                    { name: 'Gourmet Promo', alloc: 1400, color: '#4ade80' },
                ].map(c => (
                    <div key={c.name} style={{ padding: '12px 16px', borderRadius: '14px', background: `${c.color}0a`, border: `1px solid ${c.color}20` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{c.name}</span>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: c.color }}>${c.alloc.toLocaleString()}</span>
                        </div>
                        <div className="progress-bar" style={{ height: '3px' }}>
                            <div className="progress-fill" style={{ width: `${(c.alloc / allocated) * 100}%`, background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
