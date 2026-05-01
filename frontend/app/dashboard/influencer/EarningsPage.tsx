'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Loader2, Clock, CheckCircle, TrendingUp, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface EarningSummary {
    lifetimeTotal: number;
    totalPaid: number;
    totalPending: number;
    availableForCashout: number;
}

interface Cashout {
    _id: string;
    amount: number;
    status: 'pending' | 'processed' | 'rejected';
    transactionId: string | null;
    createdAt: string;
}

const CASHOUT_STATUS: Record<string, { color: string; label: string }> = {
    pending: { color: '#fbbf24', label: 'Pending' },
    processed: { color: '#4ade80', label: 'Processed' },
    rejected: { color: '#f87171', label: 'Rejected' },
};

const SURFACE = '#ffffff';
const SURFACE_ALT = '#f8fafc';
const BORDER = 'rgba(148, 163, 184, 0.22)';
const TEXT = '#0f172a';
const MUTED = '#64748b';

function SummaryCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
    return (
        <div className="glass-card" style={{ padding: '26px', borderRadius: '22px', border: `1px solid ${BORDER}` }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}14`, border: `1px solid ${color}2a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: '14px' }}>
                {icon}
            </div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.9rem', color, letterSpacing: '-0.04em' }}>{value}</p>
            <p style={{ fontSize: '12px', color: MUTED, marginTop: '6px' }}>{label}</p>
        </div>
    );
}

export default function EarningsPage() {
    const [summary, setSummary] = useState<EarningSummary | null>(null);
    const [cashouts, setCashouts] = useState<Cashout[]>([]);
    const [loading, setLoading] = useState(true);
    const [cashoutAmount, setCashoutAmount] = useState('');
    const [requesting, setRequesting] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [earningsRes, cashoutsRes] = await Promise.all([
                influencerAPI.getEarnings(),
                influencerAPI.getCashouts(),
            ]);
            setSummary(earningsRes.data.summary);
            setCashouts(cashoutsRes.data.cashouts || []);
        } catch {
            toast.error('Failed to load earnings data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCashout = async () => {
        const amount = parseFloat(cashoutAmount);
        if (!amount || amount <= 0) { toast.error('Please enter a valid amount'); return; }
        if (summary && amount > summary.availableForCashout) {
            toast.error(`Amount exceeds available balance ($${summary.availableForCashout.toFixed(2)})`);
            return;
        }
        setRequesting(true);
        try {
            await influencerAPI.cashout(amount);
            toast.success('✅ Cashout request submitted!');
            setCashoutAmount('');
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Cashout failed');
        } finally {
            setRequesting(false);
        }
    };

    const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: MUTED }}>
            <Loader2 size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#9b6f50' }} />
        </div>
    );

    const s = summary ?? { lifetimeTotal: 0, totalPaid: 0, totalPending: 0, availableForCashout: 0 };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Summary Cards */}
            <div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: TEXT, marginBottom: '4px' }}>Earnings Summary</h2>
                <p style={{ fontSize: '13px', color: MUTED, marginBottom: '18px' }}>All-time earnings across your collaborations</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <SummaryCard label="Total Lifetime Earnings" value={fmt(s.lifetimeTotal)} color="#9b6f50" icon={<TrendingUp size={18} />} />
                    <SummaryCard label="Total Pending" value={fmt(s.totalPending)} color="#fbbf24" icon={<Clock size={18} />} />
                    <SummaryCard label="Total Paid" value={fmt(s.totalPaid)} color="#4ade80" icon={<CheckCircle size={18} />} />
                    <SummaryCard label="Available for Cashout" value={fmt(s.availableForCashout)} color="#60d5f8" icon={<DollarSign size={18} />} />
                </div>
            </div>

            {/* Cashout Form */}
            <div className="glass-card" style={{ padding: '30px', borderRadius: '28px', border: '1px solid rgba(155,111,80,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(155,111,80,0.12)', border: '1px solid rgba(155,111,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9b6f50' }}>
                        <ArrowDownCircle size={18} />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: TEXT }}>Request Cashout</h2>
                        <p style={{ fontSize: '12px', color: MUTED }}>Available: <strong style={{ color: '#0284c7' }}>{fmt(s.availableForCashout)}</strong></p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: MUTED, marginBottom: '8px', fontWeight: '600' }}>Amount (USD)</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: '15px' }}>$</span>
                            <input type="number" value={cashoutAmount} onChange={e => setCashoutAmount(e.target.value)}
                                placeholder="0.00" min="1" max={s.availableForCashout}
                                style={{ width: '100%', padding: '12px 14px 12px 30px', borderRadius: '13px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontSize: '15px', fontFamily: 'Space Grotesk', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <button onClick={handleCashout} disabled={requesting || s.availableForCashout === 0}
                        style={{ padding: '12px 28px', borderRadius: '13px', background: s.availableForCashout === 0 ? '#e2e8f0' : 'linear-gradient(135deg,#9b6f50,#d7b48f)', border: 'none', color: s.availableForCashout === 0 ? MUTED : '#fff', fontSize: '14px', fontWeight: '700', cursor: (requesting || s.availableForCashout === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: s.availableForCashout === 0 ? 'none' : '0 18px 34px rgba(155,111,80,0.18)', opacity: requesting ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                        <ArrowDownCircle size={16} /> {requesting ? 'Submitting…' : 'Request Cashout'}
                    </button>
                </div>

                {s.availableForCashout === 0 && (
                    <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '11px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
                        <p style={{ fontSize: '12px', color: MUTED }}>No balance available. Earnings are added once campaigns are verified by admin.</p>
                    </div>
                )}
            </div>

            {/* Cashout History */}
            <div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: TEXT, marginBottom: '16px' }}>Cashout History</h2>
                {cashouts.length === 0 ? (
                    <div className="glass-card" style={{ padding: '48px', borderRadius: '24px', textAlign: 'center' }}>
                        <ArrowDownCircle size={36} style={{ color: 'rgba(155,111,80,0.3)', margin: '0 auto 14px' }} />
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: TEXT, marginBottom: '4px' }}>No Cashout Requests</p>
                        <p style={{ color: MUTED, fontSize: '13px' }}>Your cashout history will appear here.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr>{['Amount', 'Date Requested', 'Status', 'Transaction ID'].map(h => (
                                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: MUTED, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody>
                                {cashouts.map((c, i) => {
                                    const st = CASHOUT_STATUS[c.status] || { color: '#475569', label: c.status };
                                    return (
                                        <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                            <td style={{ padding: '14px', borderRadius: '14px 0 0 14px', border: `1px solid ${BORDER}`, borderRight: 'none', background: SURFACE_ALT }}>
                                                <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '14px', color: '#9b6f50' }}>{fmt(c.amount)}</span>
                                            </td>
                                            <td style={{ padding: '14px', border: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none', background: SURFACE_ALT, fontSize: '13px', color: MUTED }}>
                                                {new Date(c.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '14px', border: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none', background: SURFACE_ALT }}>
                                                <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '99px', background: `${st.color}18`, border: `1px solid ${st.color}35`, color: st.color, fontSize: '11px', fontWeight: '700' }}>{st.label}</span>
                                            </td>
                                            <td style={{ padding: '14px', borderRadius: '0 14px 14px 0', border: `1px solid ${BORDER}`, borderLeft: 'none', background: SURFACE_ALT, fontSize: '12px', color: MUTED, fontFamily: 'monospace' }}>
                                                {c.transactionId || '—'}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
