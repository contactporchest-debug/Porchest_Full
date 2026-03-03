'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram, RefreshCw, Unlink, Lock, CheckCircle, Zap } from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
    totalRequests: number;
    totalAccepted: number;
    totalRejected: number;
    totalCompleted: number;
    profile: Record<string, unknown>;
}

interface Props {
    connected: boolean;
    onToggle: (v: boolean) => void;
    stats: DashboardStats | null;
}

const LockedField = ({ label, value }: { label: string; value: string }) => (
    <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#fff', fontSize: '15px' }}>{value}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', flexShrink: 0 }}>
            <Lock size={10} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: '700' }}>Synced via Meta API</span>
        </div>
    </div>
);

export default function OverviewPage({ connected, onToggle, stats }: Props) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleConnect = () => {
        setLoading(true);
        setTimeout(() => { onToggle(true); setLoading(false); }, 1500);
    };

    const handleDisconnect = () => {
        if (confirm('Disconnecting will hide all API-synced metrics. Continue?')) onToggle(false);
    };

    const handleRefresh = () => {
        setLoading(true);
        influencerAPI.getDashboard()
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    const displayName = user?.fullName || user?.email?.split('@')[0] || '';
    const avatarLetter = displayName[0]?.toUpperCase() || '?';

    const collaborationCountCards = [
        { label: 'Total Requests Received', value: stats?.totalRequests ?? '—', color: '#60d5f8' },
        { label: 'Total Accepted', value: stats?.totalAccepted ?? '—', color: '#4ade80' },
        { label: 'Total Rejected', value: stats?.totalRejected ?? '—', color: '#f87171' },
        { label: 'Total Completed', value: stats?.totalCompleted ?? '—', color: '#a78bfa' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* ── PROFILE SNAPSHOT CARD ── */}
            <div className="glass-card" style={{ padding: '32px', borderRadius: '32px', background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(123,63,242,0.18)', boxShadow: '0 0 80px rgba(123,63,242,0.08)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(131,58,180,0.35)' }}>
                        <Instagram size={20} style={{ color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: '#fff', letterSpacing: '-0.02em' }}>Instagram Integration</h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Meta API — Live Data Sync</p>
                    </div>
                    {connected && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#4ade80', fontWeight: '700', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '4px 12px', borderRadius: '99px' }}>
                            <Zap size={10} /> Live Sync Active
                        </span>
                    )}
                </div>

                {!connected ? (
                    /* NOT CONNECTED */
                    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#833ab490,#fd1d1d50,#fcb04540)', border: '1px solid rgba(131,58,180,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 0 40px rgba(131,58,180,0.25)' }}>
                            <Instagram size={32} style={{ color: '#fff' }} />
                        </div>
                        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '17px', color: '#fff', marginBottom: '8px' }}>Connect Your Instagram</h3>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px', lineHeight: '1.6', maxWidth: '360px', margin: '0 auto 28px' }}>
                            Link your Instagram Business or Creator account. Followers, engagement rate, and account type will sync automatically — no manual input needed.
                        </p>
                        <button onClick={handleConnect} disabled={loading}
                            style={{ padding: '15px 36px', borderRadius: '99px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 36px rgba(123,63,242,0.5)', transition: 'all 200ms ease', opacity: loading ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
                            <Instagram size={16} /> {loading ? 'Connecting via Meta…' : 'Connect Instagram'}
                        </button>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '14px' }}>Secured by Meta OAuth 2.0 — Porchest never stores your password</p>
                    </div>
                ) : (
                    /* CONNECTED */
                    <div>
                        {/* Profile preview */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '18px 20px', borderRadius: '18px', background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.18)', marginBottom: '18px' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '22px', color: '#fff', boxShadow: '0 0 22px rgba(123,63,242,0.55)' }}>
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : avatarLetter}
                                </div>
                                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', background: '#4ade80', border: '3px solid #050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={9} style={{ color: '#050505' }} />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#fff' }}>{displayName}</p>
                                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(123,63,242,0.15)', border: '1px solid rgba(123,63,242,0.3)', fontSize: '10px', color: '#a78bfa', fontWeight: '700' }}>Creator</span>
                                </div>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{user?.email}</p>
                            </div>
                        </div>

                        {/* Locked API fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                            <LockedField label="Total Followers" value={user?.followers ? user.followers.toLocaleString() : 'Syncing…'} />
                            <LockedField label="Engagement Rate" value={user?.engagementRate ? `${user.engagementRate}%` : 'Syncing…'} />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={handleRefresh} disabled={loading}
                                style={{ flex: 1, padding: '11px 20px', borderRadius: '14px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.25)', color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 200ms ease', opacity: loading ? 0.6 : 1 }}>
                                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh Sync
                            </button>
                            <button onClick={handleDisconnect}
                                style={{ padding: '11px 20px', borderRadius: '14px', background: 'transparent', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 200ms ease' }}>
                                <Unlink size={14} /> Disconnect
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── COLLABORATION REQUEST COUNT CARDS ── */}
            <div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Collaboration Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                    {collaborationCountCards.map((c, i) => (
                        <motion.div key={c.label}
                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.35 }}
                            className="glass-card" style={{ padding: '24px', borderRadius: '22px' }}>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2rem', color: c.color, letterSpacing: '-0.04em', filter: `drop-shadow(0 0 10px ${c.color}55)` }}>
                                {c.value}
                            </p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>{c.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
