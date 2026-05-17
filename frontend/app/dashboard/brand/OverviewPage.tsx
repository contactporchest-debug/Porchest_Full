'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Megaphone, Clock, CheckCircle2, XCircle, FileText, Building2 } from 'lucide-react';
import { brandAPI, trackingAPI } from '@/lib/api';
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
    const [trackingStatus, setTrackingStatus] = useState<any>(null);
    const [trackingCampaign, setTrackingCampaign] = useState<any>(null);
    const [trackingLoading, setTrackingLoading] = useState(true);
    const showInternalProfilePrompt = profileCompleteOverride === undefined ? !profileComplete : false;

    const loadTracking = async () => {
        setTrackingLoading(true);
        try {
            const [statusRes, campaignRes] = await Promise.all([
                trackingAPI.getStatus(),
                trackingAPI.getTestCampaign(),
            ]);
            setTrackingStatus(statusRes.data || null);
            setTrackingCampaign(campaignRes.data || null);
        } catch (error) {
            setTrackingStatus(null);
            setTrackingCampaign(null);
        } finally {
            setTrackingLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading || user?.role !== 'brand' || !token) return;
        setLoading(true);
        Promise.all([brandAPI.getRequests(), brandAPI.getDashboard(), trackingAPI.getStatus(), trackingAPI.getTestCampaign()])
            .then(([reqRes, dashRes, statusRes, campaignRes]) => {
                setRequests(reqRes.data.requests || []);
                if (profileCompleteOverride === undefined) {
                    setProfileComplete(!!dashRes.data.dashboard.profileComplete);
                }
                setTrackingStatus(statusRes.data || null);
                setTrackingCampaign(campaignRes.data || null);
            })
            .catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, [authLoading, token, user?.role, profileCompleteOverride]);

    const pending = requests.filter((r) => ['sent', 'viewed', 'brand_payment_pending'].includes(r.status));
    const active = requests.filter((r) => ['accepted', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(r.status));
    const completed = requests.filter((r) => r.status === 'deal_closed');
    const rejected = requests.filter((r) => ['rejected', 'cancelled'].includes(r.status));
    const totalAllocated = active.reduce((sum, r) => sum + (r.agreedPrice || 0), 0);

    if (authLoading || loading) {
        return <div style={{ padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', fontSize: '14px', color: '#7A5030' }}>Loading brand dashboard...</div>;
    }

    const statCards = [
        { label: 'Running', value: active.length, icon: <Megaphone size={20} /> },
        { label: 'In Process', value: pending.length, icon: <Clock size={20} /> },
        { label: 'Completed', value: completed.length, icon: <CheckCircle2 size={20} /> },
        { label: 'Canceled', value: rejected.length, icon: <XCircle size={20} /> },
    ];

    const runningPreview = [...active, ...completed].slice(0, 5);

    const trackingProgress = [
        { label: 'Campaign Links Ready', done: trackingStatus?.linksStatus === 'active' },
        { label: 'Webhook Connected', done: ['configured', 'active'].includes(trackingStatus?.webhookStatus) },
        { label: 'Test Purchase Received', done: trackingStatus?.salesStatus === 'active' },
        { label: 'Tracking Active', done: trackingStatus?.salesStatus === 'active' && !trackingStatus?.lastError },
    ];

    const shopifyConnected = Boolean(trackingStatus?.availableIntegrations?.shopify?.connected);

    const formatTime = (value?: string | Date | null) => {
        if (!value) return '—';
        const time = new Date(value).getTime();
        if (Number.isNaN(time)) return '—';
        const delta = Date.now() - time;
        const hours = Math.floor(delta / (1000 * 60 * 60));
        if (hours < 1) return 'just now';
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    };

    const formatPlatform = (value?: string | null) => {
        if (!value || value === 'custom') return 'Custom Website';
        return String(value).replace(/-/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase());
    };

    const refreshTracking = async () => {
        try {
            const res = await trackingAPI.testStatus();
            setTrackingStatus((prev: any) => ({
                ...(prev || {}),
                ...res.data,
            }));
            await loadTracking();
            toast.success(res.data?.message || 'Tracking status refreshed');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Could not refresh tracking status');
        }
    };

    const openTestCampaign = async () => {
        try {
            const campaign = trackingCampaign?.trackingLink ? trackingCampaign : (await trackingAPI.getTestCampaign()).data;
            if (!campaign?.trackingLink) {
                return toast.error('No tracking link is available yet.');
            }
            window.open(campaign.trackingLink, '_blank', 'noopener,noreferrer');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Could not open test campaign');
        }
    };

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
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7A5030' }}>Your identity</p>
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
                                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A0A00', marginTop: '2px' }}>Complete your profile first</h2>
                                <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030', lineHeight: 1.65, maxWidth: '600px' }}>
                            You need a complete profile before you can browse influencers. Finish your business, audience, and campaign preferences in the profile page.
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
                        <p style={{ marginTop: '10px', fontSize: '24px', fontWeight: 600, color: '#1A0A00' }}>{active.length}</p>
                    </div>
                    <div style={{ borderRadius: '10px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)', padding: '20px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending decisions</p>
                        <p style={{ marginTop: '10px', fontSize: '24px', fontWeight: 600, color: '#1A0A00' }}>{pending.length}</p>
                    </div>
                </div>
            </GlassCard>

            <GlassCard padding="28px">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tracking Status</p>
                        <h3 style={{ marginTop: '6px', fontSize: '18px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.01em' }}>Website visit and sales verification</h3>
                        <p style={{ marginTop: '6px', fontSize: '13px', color: '#7A5030' }}>
                            Confirm your campaign links, test purchase flow, and see whether tracking is active.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => router.push('/brand/webhook-setup')} style={{ fontSize: '13px', fontWeight: 500, color: '#C2340A', background: 'transparent', border: '1px solid #EDD9BC', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Open Tracking Setup
                        </button>
                        <button onClick={() => void refreshTracking()} style={{ fontSize: '13px', fontWeight: 500, color: '#fff', background: '#C2340A', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Check Test Status
                        </button>
                        <button onClick={() => void openTestCampaign()} style={{ fontSize: '13px', fontWeight: 500, color: '#C2340A', background: 'transparent', border: '1px solid #EDD9BC', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Open Test Campaign
                        </button>
                        <button onClick={() => router.push('/dashboard/brand/tracking')} style={{ fontSize: '13px', fontWeight: 500, color: '#C2340A', background: 'transparent', border: '1px solid #EDD9BC', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            View Tracking Activity
                        </button>
                    </div>
                </div>

                {trackingLoading ? (
                    <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', color: '#7A5030', fontSize: '14px' }}>
                        Loading tracking status...
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: '18px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Campaign Links</p>
                            <p style={{ marginTop: '8px', fontSize: '18px', fontWeight: 700, color: trackingStatus?.linksStatus === 'active' ? '#059669' : '#b45309' }}>{trackingStatus?.linksStatus === 'active' ? 'Active' : 'Not Ready'}</p>
                            <p style={{ marginTop: '6px', fontSize: '13px', color: '#7A5030' }}>The link used by your creator campaigns.</p>
                        </div>
                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: '18px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sales Tracking</p>
                            <p style={{ marginTop: '8px', fontSize: '18px', fontWeight: 700, color: trackingStatus?.salesStatus === 'active' ? '#059669' : trackingStatus?.salesStatus === 'issue_detected' ? '#dc2626' : '#b45309' }}>
                                {trackingStatus?.salesStatus === 'active' ? 'Active' : trackingStatus?.salesStatus === 'issue_detected' ? 'Issue Detected' : 'Waiting for Test Order'}
                            </p>
                            <p style={{ marginTop: '6px', fontSize: '13px', color: '#7A5030' }}>Confirms whether a test purchase was received and matched.</p>
                        </div>
                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: '18px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Webhook</p>
                            <p style={{ marginTop: '8px', fontSize: '18px', fontWeight: 700, color: '#1A0A00' }}>{trackingStatus?.webhookStatus ? String(trackingStatus.webhookStatus).replace(/_/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()) : 'Not Started'}</p>
                            <p style={{ marginTop: '6px', fontSize: '13px', color: '#7A5030' }}>Install the webhook in your checkout flow.</p>
                        </div>
                        <div style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: '18px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Platform</p>
                            <p style={{ marginTop: '8px', fontSize: '18px', fontWeight: 700, color: '#1A0A00' }}>
                                {formatPlatform(trackingStatus?.platform)}
                            </p>
                            {shopifyConnected ? (
                                <div style={{ marginTop: '8px', display: 'grid', gap: '4px', fontSize: '12px', color: '#7A5030' }}>
                                    <div>Store: {trackingStatus?.shopDomain || trackingStatus?.storeUrl || '—'}</div>
                                    <div>Order Webhook: {trackingStatus?.webhookStatus ? String(trackingStatus.webhookStatus).replace(/_/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()) : '—'}</div>
                                </div>
                            ) : trackingStatus?.platform === 'shopify' ? (
                                <p style={{ marginTop: '8px', fontSize: '12px', color: '#7A5030' }}>Shopify is disconnected. Reconnect it from the tracking setup page to resume order tracking.</p>
                            ) : (
                                <p style={{ marginTop: '8px', fontSize: '12px', color: '#7A5030' }}>Custom website tracking is ready for your checkout flow.</p>
                            )}
                            <p style={{ marginTop: '6px', fontSize: '13px', color: '#7A5030' }}>
                                Last verified: {formatTime(trackingStatus?.lastVerifiedAt)}
                            </p>
                        </div>
                    </div>
                )}

                {!trackingLoading && !trackingCampaign?.trackingLink && (
                    <div style={{ marginTop: '16px', borderRadius: '12px', border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.45)', padding: '16px', color: '#7A5030', fontSize: '14px' }}>
                        No campaign links are available yet. Start a collaboration first to generate a tracking link.
                    </div>
                )}

                <div style={{ marginTop: '18px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    {trackingProgress.map((item) => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '10px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: '12px 14px' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '999px', background: item.done ? '#059669' : '#D6C2A6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                {item.done ? '✓' : '•'}
                            </div>
                            <p style={{ fontSize: '13px', color: '#1A0A00', fontWeight: 600 }}>{item.label}</p>
                        </div>
                    ))}
                </div>

                {trackingStatus?.lastError && (
                    <div style={{ marginTop: '16px', borderRadius: '12px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.06)', padding: '14px 16px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#dc2626' }}>Issue Detected</p>
                        <p style={{ marginTop: '6px', fontSize: '13px', color: '#7A5030' }}>{trackingStatus.lastError}</p>
                    </div>
                )}
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
