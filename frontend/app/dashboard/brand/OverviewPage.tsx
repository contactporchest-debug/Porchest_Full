'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Clock, CheckCircle, XCircle, DollarSign, ArrowRight, Loader2, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
    running: '#4ade80',
    'in-process': '#60d5f8',
    completed: '#a855f7',
    canceled: '#f87171',
};

export default function OverviewPage({ profileCompleteOverride }: { profileCompleteOverride?: boolean } = {}) {
    const router = useRouter();
    const { user, token, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [profileComplete, setProfileComplete] = useState<boolean>(profileCompleteOverride ?? true);
    const showInternalProfilePrompt = profileCompleteOverride === undefined ? !profileComplete : false;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading || user?.role !== 'brand' || !token) return;

        setLoading(true);
        Promise.all([
            brandAPI.getRequests(),
            brandAPI.getBrandVerifications(),
            brandAPI.getDashboard(),
        ]).then(([reqRes, verRes, dashRes]) => {
            setRequests(reqRes.data.requests || []);
            setVerifications(verRes.data.verifications || []);
            if (profileCompleteOverride === undefined) {
                setProfileComplete(dashRes.data.dashboard.profileComplete);
            }
        }).catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, [authLoading, token, user?.role, profileCompleteOverride]);

    // Derive campaign states from actual stored request statuses
    const pending = requests.filter(r => ['sent', 'viewed', 'negotiation'].includes(r.status));
    const accepted = requests.filter(r => r.status === 'accepted');
    const completed = requests.filter(r => r.status === 'deal_closed');
    const rejected = requests.filter(r => ['rejected', 'cancelled'].includes(r.status));
    const running = accepted;
    const inProcess = pending;

    // Budget rollups (from accepted requests)
    const totalAllocated = accepted.reduce((s, r) => s + (r.agreedPrice || 0), 0);

    // Status cards
    const counts = [
        { label: 'Running', val: running.length, color: '#4ade80', icon: <Megaphone size={18} /> },
        { label: 'In-Process', val: inProcess.length, color: '#60d5f8', icon: <Clock size={18} /> },
        { label: 'Completed', val: completed.length, color: '#a855f7', icon: <CheckCircle size={18} /> },
        { label: 'Canceled', val: rejected.length, color: '#f87171', icon: <XCircle size={18} /> },
    ];

    const runningPreview = [...accepted, ...completed].slice(0, 5);

    if (authLoading || loading) return (
        <div style={{ textAlign: 'center', padding: '80px' }}>
            <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#a855f7' }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Profile Incomplete Banner ── */}
            {showInternalProfilePrompt && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderRadius: '18px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
                            <AlertCircle size={18} />
                        </div>
                        <div>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#ffffff', marginBottom: '2px' }}>Action Required: Complete Your Profile</p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>You need to complete your brand profile to start using Smart Matching.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/brand/profile" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontSize: '12px', fontWeight: '700', textDecoration: 'none', transition: 'all 200ms ease' }}>
                        Complete Profile <ChevronRight size={14} />
                    </Link>
                </motion.div>
            )}

            {/* ── Status count row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px' }}>
                {counts.map((c, i) => (
                    <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.35 }}
                        className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.color}30` }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: `${c.color}12`, border: `1px solid ${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: '14px' }}>
                            {c.icon}
                        </div>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2.4rem', color: c.color, letterSpacing: '-0.05em', lineHeight: '1', filter: `drop-shadow(0 0 12px ${c.color}50)` }}>
                            {c.val}
                        </p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '7px', fontWeight: '500' }}>{c.label} Campaigns</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Budget summary ── */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.35 }}
                className="glass-card" style={{ padding: '26px 30px', borderRadius: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Budget Summary</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px' }}>
                    <div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Total Committed (Lifetime)</p>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.8rem', color: '#c084fc', filter: 'drop-shadow(0 0 10px rgba(192,132,252,0.4))' }}>
                            {totalAllocated > 0 ? `$${totalAllocated.toLocaleString()}` : '—'}
                        </p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>Sum of agreed deal prices</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Active Collaborations</p>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.8rem', color: '#60d5f8', filter: 'drop-shadow(0 0 10px rgba(96,213,248,0.4))' }}>
                            {accepted.length}
                        </p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>Accepted requests</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Pending Decisions</p>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.8rem', color: '#fbbf24', filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.4))' }}>
                            {pending.length}
                        </p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>Awaiting influencer response</p>
                    </div>
                </div>
            </motion.div>

            {/* ── Running campaign snapshot ── */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.35 }}
                className="glass-card" style={{ padding: '26px 30px', borderRadius: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Campaigns</p>
                    <button onClick={() => router.push('/dashboard/brand/collaborations')}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        View All <ArrowRight size={12} />
                    </button>
                </div>

                {runningPreview.length === 0 ? (
                    <div style={{ padding: '36px', textAlign: 'center', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <FileText size={36} style={{ color: 'rgba(168,85,247,0.3)', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: '4px' }}>No campaigns yet</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            Create your first campaign request from{' '}
                            <button onClick={() => router.push('/dashboard/brand/influencers')} style={{ color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Influencers →</button>
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {runningPreview.map((r: any) => {
                            const influencerName = r.influencerName || r.influencerId?.fullName || 'Influencer';
                            const initials = influencerName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const statusLabel = r.status === 'deal_closed' ? 'Completed' : 'Running';
                            const statusColor = r.status === 'deal_closed' ? '#a855f7' : '#4ade80';
                            return (
                                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#9333ea,#c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                                        {r.influencerProfilePic ? <img src={r.influencerProfilePic} alt={influencerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{r.campaignTitle}</p>
                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{influencerName}</p>
                                    </div>
                                    <span style={{ padding: '3px 11px', borderRadius: '99px', background: `${statusColor}12`, border: `1px solid ${statusColor}28`, color: statusColor, fontSize: '11px', fontWeight: '700' }}>{statusLabel}</span>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#c084fc' }}>${r.agreedPrice?.toLocaleString()}</p>
                                    <button onClick={() => router.push('/dashboard/brand/collaborations')}
                                        style={{ padding: '5px 12px', borderRadius: '9px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        View
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
