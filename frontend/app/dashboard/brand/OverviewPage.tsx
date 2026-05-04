'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Megaphone, Clock, CheckCircle2, XCircle, FileText, Building2 } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { StatCard, GlassCard, BadgeStatus } from '@/components/ui';

export default function OverviewPage({
    profileCompleteOverride,
    brandLogo = '',
    brandName = '',
}: {
    profileCompleteOverride?: boolean;
    brandLogo?: string;
    brandName?: string;
} = {}) {
    const router = useRouter();
    const { user, token, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [profileComplete, setProfileComplete] = useState<boolean>(profileCompleteOverride ?? true);
    const [loading, setLoading] = useState(true);
    const showInternalProfilePrompt = profileCompleteOverride === undefined ? !profileComplete : false;

    useEffect(() => {
        if (authLoading || user?.role !== 'brand' || !token) return;
        setLoading(true);
        Promise.all([brandAPI.getRequests(), brandAPI.getDashboard()])
            .then(([reqRes, dashRes]) => {
                setRequests(reqRes.data.requests || []);
                if (profileCompleteOverride === undefined) {
                    setProfileComplete(!!dashRes.data.dashboard.profileComplete);
                }
            })
            .catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, [authLoading, token, user?.role, profileCompleteOverride]);

    const pending = requests.filter((r) => ['sent', 'viewed', 'negotiation'].includes(r.status));
    const accepted = requests.filter((r) => r.status === 'accepted');
    const completed = requests.filter((r) => r.status === 'deal_closed');
    const rejected = requests.filter((r) => ['rejected', 'cancelled'].includes(r.status));
    const totalAllocated = accepted.reduce((sum, r) => sum + (r.agreedPrice || 0), 0);

    if (authLoading || loading) {
        return <div style={{ padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', fontSize: '14px', color: '#7A5030' }}>Loading brand dashboard...</div>;
    }

    const statCards = [
        { label: 'Running', value: accepted.length, icon: <Megaphone size={20} /> },
        { label: 'In Process', value: pending.length, icon: <Clock size={20} /> },
        { label: 'Completed', value: completed.length, icon: <CheckCircle2 size={20} /> },
        { label: 'Canceled', value: rejected.length, icon: <XCircle size={20} /> },
    ];

    const runningPreview = [...accepted, ...completed].slice(0, 5);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassCard padding="24px">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        border: '1px solid #EDD9BC',
                        background: 'rgba(255,255,255,0.72)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}>
                        {brandLogo ? (
                            <img src={brandLogo} alt={brandName || 'Brand logo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Building2 size={24} style={{ color: '#C2340A' }} />
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7A5030' }}>Brand identity</p>
                        <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 700, color: '#1A0A00' }}>
                            {brandName || 'Your brand'}
                        </h3>
                        <p style={{ marginTop: '4px', fontSize: '14px', color: '#7A5030' }}>
                            Your logo is used across the Porchest dashboard and brand-facing surfaces.
                        </p>
                    </div>
                </div>
            </GlassCard>

            {showInternalProfilePrompt && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ borderRadius: '14px', border: '1px solid rgba(255,107,26,0.3)', background: 'rgba(255,107,26,0.1)', padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="md:flex-row md:items-center md:justify-between">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ display: 'flex', width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'rgba(255,107,26,0.15)', color: '#E8400A', flexShrink: 0 }}>
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#E8400A', fontWeight: 600 }}>Action required</p>
                                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A0A00', marginTop: '2px' }}>Complete your brand profile first</h2>
                                <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030', lineHeight: 1.65, maxWidth: '600px' }}>
                                    You need a complete brand profile before you can browse influencers. Finish your business, audience, and campaign preferences in the profile page.
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/brand/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', background: '#C2340A', color: '#fff', padding: '11px 24px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}>
                            Complete profile <ArrowRight size={14} />
                        </Link>
                    </div>
                </motion.div>
            )}

            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {statCards.map((card, i) => (
                    <StatCard key={card.label} title={`${card.label} campaigns`} value={card.value} icon={card.icon} delay={i * 0.05} />
                ))}
            </div>

            <GlassCard padding="28px">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget summary</p>
                        <h3 style={{ marginTop: '6px', fontSize: '18px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.01em' }}>Campaign spend</h3>
                    </div>
                    <button onClick={() => router.push('/dashboard/brand/collaborations')} style={{ fontSize: '13px', fontWeight: 500, color: '#C2340A', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        View all
                    </button>
                </div>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div style={{ borderRadius: '10px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)', padding: '20px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total committed</p>
                        <p style={{ marginTop: '10px', fontSize: '24px', fontWeight: 600, color: '#1A0A00' }}>{totalAllocated > 0 ? `$${totalAllocated.toLocaleString()}` : '—'}</p>
                    </div>
                    <div style={{ borderRadius: '10px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)', padding: '20px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active collaborations</p>
                        <p style={{ marginTop: '10px', fontSize: '24px', fontWeight: 600, color: '#1A0A00' }}>{accepted.length}</p>
                    </div>
                    <div style={{ borderRadius: '10px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)', padding: '20px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending decisions</p>
                        <p style={{ marginTop: '10px', fontSize: '24px', fontWeight: 600, color: '#1A0A00' }}>{pending.length}</p>
                    </div>
                </div>
            </GlassCard>

            <GlassCard padding="28px">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active campaigns</p>
                        <h3 style={{ marginTop: '6px', fontSize: '18px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.01em' }}>Running collaboration snapshot</h3>
                    </div>
                    <button onClick={() => router.push('/dashboard/brand/influencers')} style={{ fontSize: '13px', fontWeight: 500, color: '#C2340A', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Find creators
                    </button>
                </div>

                {runningPreview.length === 0 ? (
                    <div style={{ borderRadius: '10px', border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.40)', padding: '40px', textAlign: 'center' }}>
                        <FileText size={36} style={{ margin: '0 auto 12px', color: '#C4A882' }} />
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A0A00' }}>No campaigns yet</p>
                        <p style={{ marginTop: '6px', fontSize: '13px', color: '#7A5030' }}>Create your first campaign request from the influencers page.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {runningPreview.map((r: any) => (
                            <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '10px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.60)', padding: '12px 16px', flexWrap: 'wrap' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '12px', fontWeight: 600, color: '#C2340A', flexShrink: 0 }}>
                                    {r.influencerProfilePic ? <img src={r.influencerProfilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'PR'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A0A00', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.campaignTitle}</p>
                                    <p style={{ fontSize: '12px', color: '#7A5030', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.influencerName || 'Influencer'}</p>
                                </div>
                                <BadgeStatus status={r.status === 'deal_closed' ? 'completed' : 'active'} />
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A0A00' }}>${r.agreedPrice?.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
