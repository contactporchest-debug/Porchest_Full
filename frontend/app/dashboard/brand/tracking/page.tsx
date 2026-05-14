'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { trackingAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ExternalLink, RefreshCw, Link2 } from 'lucide-react';

function timeAgo(value?: string | Date | null) {
    if (!value) return '—';
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return '—';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatPlatform(value?: string | null) {
    if (!value || value === 'custom') return 'Custom Website';
    return String(value).replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function StatusPill({ value }: { value?: string | null }) {
    const tone = useMemo(() => {
        if (!value) return { bg: 'rgba(148,163,184,0.12)', color: '#64748b' };
        if (['active', 'installed', 'configured', 'healthy'].includes(value)) return { bg: 'rgba(5,150,105,0.12)', color: '#059669' };
        if (['waiting', 'waiting_for_test', 'connected'].includes(value)) return { bg: 'rgba(180,83,9,0.12)', color: '#b45309' };
        if (['issue_detected', 'disconnected'].includes(value)) return { bg: 'rgba(220,38,38,0.12)', color: '#dc2626' };
        return { bg: 'rgba(148,163,184,0.12)', color: '#64748b' };
    }, [value]);

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, background: tone.bg, color: tone.color }}>
            {(value || 'not started').replace(/_/g, ' ')}
        </span>
    );
}

export default function BrandTrackingPage() {
    const [status, setStatus] = useState<any>(null);
    const [activity, setActivity] = useState<any>({ clicks: [], purchases: [], issues: [] });
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [statusRes, activityRes, campaignRes] = await Promise.all([
                trackingAPI.getStatus(),
                trackingAPI.getActivity(),
                trackingAPI.getTestCampaign(),
            ]);
            setStatus(statusRes.data || null);
            setActivity(activityRes.data || { clicks: [], purchases: [], issues: [] });
            setCampaign(campaignRes.data || null);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.message || 'Failed to load tracking page');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const openCampaign = async () => {
        try {
            const nextCampaign = campaign?.trackingLink ? campaign : (await trackingAPI.getTestCampaign()).data;
            if (!nextCampaign?.trackingLink) {
                return toast.error('No tracking link is available yet.');
            }
            window.open(nextCampaign.trackingLink, '_blank', 'noopener,noreferrer');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Could not open tracking campaign');
        }
    };

    const checkStatus = async () => {
        try {
            const res = await trackingAPI.testStatus();
            setStatus((prev: any) => ({ ...(prev || {}), ...res.data }));
            await load(true);
            toast.success(res.data?.message || 'Tracking status checked');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.message || 'Could not check tracking status');
        }
    };

    const progress = [
        { label: 'Campaign Links Ready', done: status?.linksStatus === 'active' },
        { label: 'Webhook Tracking Installed', done: ['configured', 'active'].includes(status?.webhookStatus) },
        { label: 'Test Purchase Received', done: status?.salesStatus === 'active' },
        { label: 'Tracking Active', done: status?.salesStatus === 'active' && !status?.lastError },
    ];

    const shopifyConnected = Boolean(status?.availableIntegrations?.shopify?.connected);
    const wooCommerceConnected = Boolean(status?.availableIntegrations?.woocommerce?.connected);

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <Link href="/dashboard/brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#C2340A', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                                <ArrowLeft size={14} /> Back to dashboard
                            </Link>
                            <h1 style={{ marginTop: 12, fontSize: 30, fontWeight: 800, color: '#1A0A00', letterSpacing: '-0.03em' }}>Tracking verification</h1>
                            <p style={{ marginTop: 6, fontSize: 14, color: '#7A5030', lineHeight: 1.6, maxWidth: 760 }}>
                                Use this page to confirm that campaign links, website tracking, and sales reporting are working end to end.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => void load(true)} style={{ borderRadius: 10, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.65)', color: '#C2340A', padding: '10px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                <RefreshCw size={14} style={{ display: 'inline', marginRight: 6 }} />
                                {refreshing ? 'Refreshing' : 'Refresh'}
                            </button>
                            <button onClick={() => void checkStatus()} style={{ borderRadius: 10, border: 'none', background: '#C2340A', color: '#fff', padding: '10px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6 }} />
                                Check Test Status
                            </button>
                            <button onClick={() => void openCampaign()} style={{ borderRadius: 10, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.65)', color: '#C2340A', padding: '10px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                <ExternalLink size={14} style={{ display: 'inline', marginRight: 6 }} />
                                Open Test Campaign
                            </button>
                        </div>
                    </motion.div>

                    {loading ? (
                        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', padding: 24, color: '#7A5030' }}>
                            Loading tracking details...
                        </div>
                    ) : (
                        <>
                            <div style={{ borderRadius: 18, border: '1px solid rgba(194,52,10,0.12)', background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,248,241,0.96) 100%)', padding: 24, boxShadow: '0 24px 60px rgba(124,63,34,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tracking Status</p>
                                        <h2 style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: '#1A0A00' }}>{status?.salesStatus === 'active' ? 'Tracking Active' : status?.salesStatus === 'issue_detected' ? 'Tracking Issue Detected' : 'Waiting For Test Order'}</h2>
                                        <p style={{ marginTop: 6, fontSize: 13, color: '#7A5030' }}>
                                            {status?.salesStatus === 'active'
                                                ? 'Porchest successfully received and matched a purchase from your campaign tracking flow.'
                                                : status?.salesStatus === 'issue_detected'
                                                    ? 'We received an order, but it could not be matched to a campaign.'
                                                    : 'We have not received a valid purchase event yet.'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <StatusPill value={status?.linksStatus} />
                                        <StatusPill value={status?.salesStatus} />
                                        <StatusPill value={status?.webhookStatus} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 20 }}>
                                    <div style={{ borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: 18 }}>
                                        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A5030', fontWeight: 700 }}>Campaign Links</p>
                                        <p style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: status?.linksStatus === 'active' ? '#059669' : '#b45309' }}>{status?.linksStatus === 'active' ? 'Active' : 'Not Ready'}</p>
                                    </div>
                                    <div style={{ borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: 18 }}>
                                        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A5030', fontWeight: 700 }}>Sales Tracking</p>
                                        <p style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: status?.salesStatus === 'active' ? '#059669' : status?.salesStatus === 'issue_detected' ? '#dc2626' : '#b45309' }}>{status?.salesStatus === 'active' ? 'Active' : status?.salesStatus === 'issue_detected' ? 'Issue Detected' : 'Waiting for Test Order'}</p>
                                    </div>
                                    <div style={{ borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: 18 }}>
                                        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A5030', fontWeight: 700 }}>Current Platform</p>
                                        <p style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>{formatPlatform(status?.platform)}</p>
                                        {shopifyConnected ? (
                                            <div style={{ marginTop: 8, display: 'grid', gap: 4, fontSize: 12, color: '#7A5030' }}>
                                                <div>Store: {status?.shopDomain || status?.storeUrl || '—'}</div>
                                                <div>Order Webhook: {status?.webhookStatus ? String(status.webhookStatus).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : '—'}</div>
                                            </div>
                                        ) : (
                                            <p style={{ marginTop: 8, fontSize: 12, color: '#7A5030' }}>Custom webhook tracking is ready for your checkout flow.</p>
                                        )}
                                    </div>
                                    <div style={{ borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: 18 }}>
                                        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A5030', fontWeight: 700 }}>Last Verified</p>
                                        <p style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>{timeAgo(status?.lastVerifiedAt)}</p>
                                    </div>
                                </div>
                                <div style={{ marginTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                    {progress.map((item) => (
                                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.56)', padding: '12px 14px' }}>
                                            <div style={{ width: 18, height: 18, borderRadius: 999, background: item.done ? '#059669' : '#D6C2A6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                                                {item.done ? '✓' : '•'}
                                            </div>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>{item.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {status?.lastError && (
                                <div style={{ borderRadius: 16, border: '1px solid rgba(220,38,38,0.18)', background: 'rgba(220,38,38,0.06)', padding: 20 }}>
                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Issue Detected</p>
                                    <p style={{ marginTop: 6, fontSize: 14, color: '#7A5030' }}>{status.lastError}</p>
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                                <div style={{ borderRadius: 18, border: '1px solid rgba(194,52,10,0.12)', background: 'rgba(255,255,255,0.88)', padding: 24 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Clicks</p>
                                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {activity.clicks?.length ? activity.clicks.map((item: any, index: number) => (
                                            <div key={`${item.timestamp}-${index}`} style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: 14 }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>{item.influencerName} campaign received a click.</p>
                                                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>{item.campaignName}{item.campaignCode ? ` • ${item.campaignCode}` : ''}</p>
                                                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>{timeAgo(item.timestamp)}{item.isUnique ? ' • unique' : ''}</p>
                                            </div>
                                        )) : (
                                            <div style={{ borderRadius: 12, border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: 18, color: '#7A5030', fontSize: 13 }}>
                                                No recent clicks yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ borderRadius: 18, border: '1px solid rgba(194,52,10,0.12)', background: 'rgba(255,255,255,0.88)', padding: 24 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Purchases</p>
                                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {activity.purchases?.length ? activity.purchases.map((item: any, index: number) => (
                                            <div key={`${item.orderId}-${index}`} style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: 14 }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>Order #{item.orderId} matched successfully.</p>
                                                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>{item.campaignName} • {item.influencerName}</p>
                                                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>${Number(item.orderValue || 0).toLocaleString()} {item.currency} • {item.source} • {timeAgo(item.timestamp)}</p>
                                            </div>
                                        )) : (
                                            <div style={{ borderRadius: 12, border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: 18, color: '#7A5030', fontSize: 13 }}>
                                                No recent purchases yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ borderRadius: 18, border: '1px solid rgba(194,52,10,0.12)', background: 'rgba(255,255,255,0.88)', padding: 24 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tracking Issues</p>
                                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {activity.issues?.length ? activity.issues.map((item: any, index: number) => (
                                            <div key={`${item.orderId || 'issue'}-${index}`} style={{ borderRadius: 12, border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.05)', padding: 14 }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>{item.orderId ? `Order #${item.orderId}` : 'Tracking issue'} could not be matched.</p>
                                                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>{item.reason}</p>
                                                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>{item.source} • {timeAgo(item.timestamp)}</p>
                                            </div>
                                        )) : (
                                            <div style={{ borderRadius: 12, border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: 18, color: '#7A5030', fontSize: 13 }}>
                                                No tracking issues detected.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {campaign?.trackingLink ? (
                                <div style={{ borderRadius: 18, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.86)', padding: 24 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest Test Campaign</p>
                                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                        <div>
                                            <p style={{ fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>{campaign.influencerName || 'Influencer'} campaign</p>
                                            <p style={{ marginTop: 4, fontSize: 13, color: '#7A5030' }}>{campaign.promoCode || 'Promo code not set'}</p>
                                        </div>
                                        <a href={campaign.trackingLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 10, background: '#C2340A', color: '#fff', padding: '10px 14px', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                                            <Link2 size={14} />
                                            Open tracking link
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ borderRadius: 18, border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.7)', padding: 24, color: '#7A5030' }}>
                                    No campaign links are available yet.
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                <div style={{ borderRadius: 18, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.86)', padding: 20 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shopify Integration</p>
                                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>{shopifyConnected ? 'Shopify Connected' : 'Connect Shopify'}</p>
                                                <p style={{ fontSize: 12, color: '#7A5030', marginTop: 2 }}>Phase 1 matches orders using promo codes and Shopify order webhooks.</p>
                                                <p style={{ fontSize: 12, color: '#7A5030', marginTop: 6 }}>Store: {status?.shopDomain || status?.storeUrl || '—'}</p>
                                                <p style={{ fontSize: 12, color: '#7A5030', marginTop: 2 }}>Webhook: {status?.webhookStatus ? String(status.webhookStatus).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Not Configured'}</p>
                                            </div>
                                            <Link href="/brand/webhook-setup" style={{ border: 'none', background: '#C2340A', color: '#fff', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                                                Open Setup
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ borderRadius: 18, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.86)', padding: 20 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WooCommerce Integration</p>
                                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>{wooCommerceConnected ? 'WooCommerce Connected' : 'Connect WooCommerce'}</p>
                                                <p style={{ fontSize: 12, color: '#7A5030', marginTop: 2 }}>Phase 1 matches orders using promo and coupon codes.</p>
                                                <p style={{ fontSize: 12, color: '#7A5030', marginTop: 6 }}>Store: {status?.availableIntegrations?.woocommerce?.storeUrl || status?.storeUrl || '—'}</p>
                                                <p style={{ fontSize: 12, color: '#7A5030', marginTop: 2 }}>Webhook: {status?.webhookStatus ? String(status.webhookStatus).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Not Configured'}</p>
                                            </div>
                                            <Link href="/brand/webhook-setup" style={{ border: 'none', background: '#C2340A', color: '#fff', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                                                Open Setup
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderRadius: 18, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.86)', padding: 20 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Google Tag Manager</p>
                                    <p style={{ marginTop: 12, fontSize: 12, color: '#7A5030', lineHeight: 1.6 }}>Tag-based install option for advanced custom websites.</p>
                                    <div style={{ marginTop: 12, display: 'inline-flex', borderRadius: 999, background: 'rgba(180,83,9,0.12)', color: '#b45309', padding: '6px 10px', fontSize: 11, fontWeight: 800 }}>
                                        Coming Soon
                                    </div>
                                </div>

                                <div style={{ borderRadius: 18, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.86)', padding: 20 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Troubleshooting</p>
                                    <ul style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#7A5030', lineHeight: 1.6, paddingLeft: 18 }}>
                                        <li>Open the test campaign link from this page.</li>
                                        <li>Complete a test order on the brand website.</li>
                                        <li>Return here and click Check Test Status.</li>
                                        <li>If an order cannot be matched, make sure the campaign link or promo code was used.</li>
                                    </ul>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
