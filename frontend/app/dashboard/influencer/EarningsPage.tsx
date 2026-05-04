'use client';

import { useEffect, useState } from 'react';
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
  pending: { color: '#d97706', label: 'Pending' },
  processed: { color: '#059669', label: 'Processed' },
  rejected: { color: '#dc2626', label: 'Rejected' },
};

const SURFACE = 'rgba(255,255,255,0.35)';
const SURFACE_ALT = 'rgba(255,255,255,0.48)';
const BORDER = 'rgba(255,255,255,0.65)';
const TEXT = '#1A0A00';
const MUTED = '#7A5030';

function SummaryCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        borderRadius: '18px',
        border: `1px solid ${BORDER}`,
        background: SURFACE,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 30px rgba(155,111,80,0.05)',
      }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}14`, border: `1px solid ${color}2a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: '14px' }}>
        {icon}
      </div>
      <p style={{ fontWeight: 800, fontSize: '1.9rem', color, letterSpacing: '-0.04em' }}>{value}</p>
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
      const [earningsRes, cashoutsRes] = await Promise.all([influencerAPI.getEarnings(), influencerAPI.getCashouts()]);
      setSummary(earningsRes.data.summary);
      setCashouts(cashoutsRes.data.cashouts || []);
    } catch {
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCashout = async () => {
    const amount = parseFloat(cashoutAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (summary && amount > summary.availableForCashout) {
      toast.error(`Amount exceeds available balance ($${summary.availableForCashout.toFixed(2)})`);
      return;
    }
    setRequesting(true);
    try {
      await influencerAPI.cashout(amount);
      toast.success('Cashout request submitted!');
      setCashoutAmount('');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cashout failed');
    } finally {
      setRequesting(false);
    }
  };

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: MUTED }}>
        <Loader2 size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#C2340A' }} />
      </div>
    );
  }

  const s = summary ?? { lifetimeTotal: 0, totalPaid: 0, totalPending: 0, availableForCashout: 0 };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontWeight: 800, fontSize: '18px', color: TEXT, marginBottom: '4px' }}>Earnings Summary</h2>
        <p style={{ fontSize: '13px', color: MUTED, marginBottom: '18px' }}>All-time earnings across your collaborations</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <SummaryCard label="Total Lifetime Earnings" value={fmt(s.lifetimeTotal)} color="#C2340A" icon={<TrendingUp size={18} />} />
          <SummaryCard label="Total Pending" value={fmt(s.totalPending)} color="#d97706" icon={<Clock size={18} />} />
          <SummaryCard label="Total Paid" value={fmt(s.totalPaid)} color="#059669" icon={<CheckCircle size={18} />} />
          <SummaryCard label="Available for Cashout" value={fmt(s.availableForCashout)} color="#0284c7" icon={<DollarSign size={18} />} />
        </div>
      </div>

      <div
        className="glass-card"
        style={{
          padding: '30px',
          borderRadius: '20px',
          border: `1px solid ${BORDER}`,
          background: SURFACE,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 30px rgba(155,111,80,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(194,52,10,0.12)', border: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2340A' }}>
            <ArrowDownCircle size={18} />
          </div>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '17px', color: TEXT }}>Request Cashout</h2>
            <p style={{ fontSize: '12px', color: MUTED }}>
              Available: <strong style={{ color: '#C2340A' }}>{fmt(s.availableForCashout)}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: MUTED, marginBottom: '8px', fontWeight: 600 }}>Amount (USD)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: '15px' }}>$</span>
              <input
                type="number"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                max={s.availableForCashout}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 30px',
                  borderRadius: '13px',
                  background: 'rgba(255,255,255,0.58)',
                  border: `1px solid ${BORDER}`,
                  color: TEXT,
                  fontSize: '15px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(12px)',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleCashout}
            disabled={requesting || s.availableForCashout === 0}
            style={{
              padding: '12px 26px',
              borderRadius: '13px',
              background: s.availableForCashout === 0 ? 'rgba(255,255,255,0.6)' : 'linear-gradient(135deg,#C2340A,#E8400A)',
              border: `1px solid ${s.availableForCashout === 0 ? BORDER : 'transparent'}`,
              color: s.availableForCashout === 0 ? MUTED : '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: requestForCashout(requesting, s.availableForCashout),
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: s.availableForCashout === 0 ? 'none' : '0 18px 34px rgba(194,52,10,0.16)',
              opacity: requesting ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowDownCircle size={16} /> {requesting ? 'Submitting…' : 'Request Cashout'}
          </button>
        </div>

        {s.availableForCashout === 0 && (
          <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '11px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={13} style={{ color: '#d97706', flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: MUTED }}>No balance available. Earnings are added once campaigns are verified by admin.</p>
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontWeight: 800, fontSize: '18px', color: TEXT, marginBottom: '16px' }}>Cashout History</h2>
        {cashouts.length === 0 ? (
          <div className="glass-card" style={{ padding: '48px', borderRadius: '20px', textAlign: 'center', background: SURFACE, border: `1px solid ${BORDER}`, backdropFilter: 'blur(12px)' }}>
            <ArrowDownCircle size={36} style={{ color: 'rgba(194,52,10,0.28)', margin: '0 auto 14px' }} />
            <p style={{ fontWeight: 700, fontSize: '14px', color: TEXT, marginBottom: '4px' }}>No Cashout Requests</p>
            <p style={{ color: MUTED, fontSize: '13px' }}>Your cashout history will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  {['Amount', 'Date Requested', 'Status', 'Transaction ID'].map((h) => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashouts.map((c, i) => {
                  const st = CASHOUT_STATUS[c.status] || { color: '#7A5030', label: c.status };
                  return (
                    <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td style={{ padding: '14px', borderRadius: '14px 0 0 14px', border: `1px solid ${BORDER}`, borderRight: 'none', background: SURFACE_ALT }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#C2340A' }}>{fmt(c.amount)}</span>
                      </td>
                      <td style={{ padding: '14px', border: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none', background: SURFACE_ALT, fontSize: '13px', color: MUTED }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px', border: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none', background: SURFACE_ALT }}>
                        <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '999px', background: `${st.color}18`, border: `1px solid ${st.color}35`, color: st.color, fontSize: '11px', fontWeight: 700 }}>{st.label}</span>
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

function requestForCashout(requesting: boolean, available: number) {
  return requesting || available === 0 ? 'not-allowed' : 'pointer';
}
