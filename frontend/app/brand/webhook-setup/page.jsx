'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Check, Copy, ExternalLink, RefreshCw, Store } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BadgeStatus, GlassCard, GlowButton } from '@/components/ui';
import { brandAPI, shopifyAPI, trackingAPI } from '@/lib/api';

function formatStatus(value) {
    if (!value) return 'Incomplete';
    if (value === 'shopify') return 'Shopify';
    if (value === 'custom') return 'Custom';
    return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '—';
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function createCardState(ready, waitingWhenConnected, hasData) {
    if (ready) return { label: 'Active', tone: 'success' };
    if (waitingWhenConnected) return { label: 'Pending', tone: 'warning' };
    return { label: hasData ? 'Pending' : 'Incomplete', tone: hasData ? 'warning' : 'danger' };
}

function StatusCard({ title, state, note }) {
    const palette = {
        success: { bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.24)' },
        warning: { bg: 'rgba(245,158,11,0.12)', color: '#d97706', border: 'rgba(245,158,11,0.24)' },
        danger: { bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.24)' },
    };
    const styles = palette[state.tone] || palette.warning;

    return (
        <GlassCard padding="18px" noHover>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {title}
            </p>
            <div
                style={{
                    marginTop: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 999,
                    padding: '8px 12px',
                    background: styles.bg,
                    border: `1px solid ${styles.border}`,
                    color: styles.color,
                    fontSize: 13,
                    fontWeight: 800,
                }}
            >
                {state.label}
            </div>
            {note ? (
                <p style={{ marginTop: 10, fontSize: 13, color: '#7A5030', lineHeight: 1.6 }}>
                    {note}
                </p>
            ) : null}
        </GlassCard>
    );
}

export default function TrackingSetupPage() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [checking, setChecking] = useState(false);
    const [shopDomain, setShopDomain] = useState('');

    const loadStatus = async () => {
        setLoading(true);
        try {
            const res = await trackingAPI.getStatus();
            const nextStatus = res.data || null;
            setStatus(nextStatus);
            setShopDomain(nextStatus?.availableIntegrations?.shopify?.shopDomain || nextStatus?.shopDomain || '');
        } catch {
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadStatus();
    }, []);

    const campaigns = status?.campaigns || [];
    const shopifyConnected = Boolean(status?.availableIntegrations?.shopify?.connected);
    const platformLabel = formatStatus(status?.platform);
    const trackingLinkReady = Boolean(status?.campaignLinksReady);
    const webhookInstalled = Boolean(status?.webhookInstalled);
    const testPurchaseReceived = Boolean(status?.testPurchaseReceived);
    const trackingActive = Boolean(status?.trackingActive);

    const cardStates = useMemo(() => ([
        {
            title: 'Tracking Link Ready',
            state: createCardState(trackingLinkReady, Boolean(campaigns.length), campaigns.length > 0),
            note: campaigns.length
                ? 'Campaign links are available for your active collaborations.'
                : 'Create or accept a collaboration to generate a tracking link.',
        },
        {
            title: 'Webhook Connected',
            state: createCardState(webhookInstalled, shopifyConnected, shopifyConnected),
            note: shopifyConnected
                ? 'Shopify is connected and ready to receive sales events.'
                : 'Connect Shopify to begin receiving order events.',
        },
        {
            title: 'Test Purchase Received',
            state: createCardState(testPurchaseReceived, webhookInstalled, webhookInstalled),
            note: webhookInstalled
                ? 'Send a test order from Shopify to confirm tracking.'
                : 'Webhook connection is needed before testing sales tracking.',
        },
        {
            title: 'Tracking Active',
            state: createCardState(trackingActive, webhookInstalled && campaigns.length > 0, trackingActive || webhookInstalled || campaigns.length > 0),
            note: trackingActive
                ? 'Porchest is receiving and matching purchases successfully.'
                : 'Tracking becomes active once a campaign link and a matched Shopify purchase are received.',
        },
    ]), [campaigns.length, shopifyConnected, testPurchaseReceived, trackingActive, trackingLinkReady, webhookInstalled]);

    async function refresh() {
        setRefreshing(true);
        try {
            await loadStatus();
        } finally {
            setRefreshing(false);
        }
    }

    async function resolveCampaignLink(campaign) {
        if (campaign?.trackingLink) return campaign.trackingLink;
        const response = await brandAPI.getCampaignTrackingLink(campaign.id);
        const link = response.data?.trackingLink || null;
            if (link) {
                setStatus((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        campaignLinksReady: true,
                        campaigns: (prev.campaigns || []).map((item) => (
                            item.id === campaign.id ? { ...item, trackingLink: link } : item
                        )),
                    };
                });
            }
            return link;
        }

    async function handleCopyLink(campaign) {
        try {
            const link = await resolveCampaignLink(campaign);
            if (!link) throw new Error('Tracking link is not ready yet');
            await navigator.clipboard.writeText(link);
            toast.success('Tracking link copied');
        } catch (error) {
            toast.error(error?.message || 'Could not copy tracking link');
        }
    }

    async function handleOpenLink(campaign) {
        try {
            const link = await resolveCampaignLink(campaign);
            if (!link) throw new Error('Tracking link is not ready yet');
            window.open(link, '_blank', 'noopener,noreferrer');
        } catch (error) {
            toast.error(error?.message || 'Could not open tracking link');
        }
    }

    async function handleOpenLatestTrackingLink() {
        try {
            const latest = campaigns.find((campaign) => campaign.trackingLink) || campaigns[0];
            if (!latest) {
                toast.error('No campaign link is available yet');
                return;
            }
            await handleOpenLink(latest);
        } catch (error) {
            toast.error(error?.message || 'Could not open tracking link');
        }
    }

    async function handleConnectShopify() {
        const domain = String(shopDomain || '').trim().toLowerCase();
        if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
            toast.error('Enter a valid Shopify store domain like your-store.myshopify.com');
            return;
        }

        setConnecting(true);
        try {
            const response = await shopifyAPI.connect({ shopDomain: domain });
            const installUrl = response.data?.installUrl;
            if (!installUrl) {
                throw new Error('Could not start Shopify connect');
            }
            window.location.href = installUrl;
        } catch (error) {
            toast.error(error?.response?.data?.error || error?.message || 'Could not connect Shopify. Try again.');
        } finally {
            setConnecting(false);
        }
    }

    async function handleCheckTestStatus() {
        setChecking(true);
        try {
            await trackingAPI.checkTestStatus();
            await loadStatus();
            toast.success('Tracking status updated');
        } catch (error) {
            toast.error(error?.response?.data?.error || error?.message || 'Could not check test status');
        } finally {
            setChecking(false);
        }
    }

    const latestCampaign = campaigns.find((campaign) => campaign.trackingLink) || campaigns[0] || null;
    const statusMessage = trackingActive
        ? 'Tracking Active'
        : testPurchaseReceived
            ? 'A purchase was received, but verification is still in progress.'
            : webhookInstalled
                ? 'Waiting for test purchase'
                : 'Connect Shopify to begin verification';

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>
                    <GlassCard padding="28px">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ maxWidth: 760 }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand Tracking Setup</p>
                                <h1 style={{ marginTop: 8, fontSize: 32, fontWeight: 800, color: '#1A0A00', letterSpacing: '-0.03em' }}>Simple Shopify tracking setup</h1>
                                <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.7 }}>
                                    Connect Shopify, copy your campaign links, and verify one test purchase from the same page.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <GlowButton variant="outline" onClick={() => void refresh()} loading={loading || refreshing}>
                                    <RefreshCw size={14} />
                                    Refresh
                                </GlowButton>
                                <GlowButton onClick={() => void handleCheckTestStatus()} loading={checking}>
                                    <Check size={14} />
                                    Check Test Status
                                </GlowButton>
                            </div>
                        </div>
                    </GlassCard>

                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        {cardStates.map((card) => (
                            <StatusCard key={card.title} title={card.title} state={card.state} note={card.note} />
                        ))}
                    </div>

                    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                        <GlassCard padding="24px">
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shopify Integration</p>
                            <h2 style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: '#1A0A00' }}>Connect Shopify</h2>
                            <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.7 }}>
                                Connect your Shopify store so Porchest can automatically match purchases to the right campaign.
                            </p>

                            {shopifyConnected ? (
                                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                    <div style={{ borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>Connected</p>
                                                <p style={{ marginTop: 6, fontSize: 13, color: '#7A5030' }}>{status?.availableIntegrations?.shopify?.shopDomain || status?.shopDomain || '—'}</p>
                                            </div>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    borderRadius: 999,
                                                    padding: '6px 12px',
                                                    background: 'rgba(16,185,129,0.10)',
                                                    border: '1px solid rgba(16,185,129,0.24)',
                                                    color: '#059669',
                                                    fontSize: 12,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                Connected
                                            </span>
                                        </div>
                                        <div style={{ marginTop: 12, display: 'grid', gap: 6, color: '#7A5030', fontSize: 13 }}>
                                            <div>Webhook: {formatStatus(status?.webhookStatus)}</div>
                                            <div>Sales tracking: {formatStatus(status?.salesStatus)}</div>
                                            <div>Last verified: {status?.lastVerifiedAt ? new Date(status.lastVerifiedAt).toLocaleString() : '—'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        <GlowButton onClick={() => void handleConnectShopify()}>
                                            <Store size={14} />
                                            Reconnect
                                        </GlowButton>
                                        <Link href="/dashboard/brand/tracking" style={{ textDecoration: 'none' }}>
                                            <GlowButton variant="outline">
                                                <ExternalLink size={14} />
                                                View Activity
                                            </GlowButton>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>Shopify Store Domain</label>
                                        <input
                                            type="text"
                                            value={shopDomain}
                                            onChange={(event) => setShopDomain(event.target.value)}
                                            placeholder="your-store.myshopify.com"
                                            style={{
                                                width: '100%',
                                                borderRadius: 12,
                                                border: '1px solid #EDD9BC',
                                                background: 'rgba(255,255,255,0.75)',
                                                padding: '12px 14px',
                                                fontFamily: 'inherit',
                                                color: '#1A0A00',
                                                outline: 'none',
                                                fontSize: 14,
                                            }}
                                        />
                                    </div>
                                    <GlowButton onClick={() => void handleConnectShopify()} loading={connecting}>
                                        <Store size={14} />
                                        {connecting ? 'Connecting...' : 'Connect Shopify'}
                                    </GlowButton>
                                </div>
                            )}
                        </GlassCard>

                        <GlassCard padding="24px">
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Test Tracking</p>
                            <h2 style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: '#1A0A00' }}>Verify one live Shopify purchase</h2>
                            <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.7 }}>
                                Use the campaign link for a test order, then return here to confirm that tracking is active.
                            </p>

                            <div style={{ marginTop: 16, borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: 16 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1A0A00' }}>Checklist</p>
                                <ol style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 8, color: '#7A5030', fontSize: 13, lineHeight: 1.65 }}>
                                    <li>Open the latest campaign tracking link.</li>
                                    <li>Complete a test purchase on Shopify.</li>
                                    <li>Return here and click Check Test Status.</li>
                                    <li>Confirm the status changes to Tracking Active.</li>
                                </ol>
                            </div>

                            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                <GlowButton
                                    variant="outline"
                                    onClick={() => void handleOpenLatestTrackingLink()}
                                    disabled={!latestCampaign}
                                >
                                    <ExternalLink size={14} />
                                    Open Tracking Link
                                </GlowButton>
                                <GlowButton onClick={() => void handleCheckTestStatus()} loading={checking}>
                                    <Check size={14} />
                                    Check Test Status
                                </GlowButton>
                            </div>

                            <div style={{ marginTop: 14, borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: 16 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1A0A00' }}>{statusMessage}</p>
                                <p style={{ marginTop: 8, fontSize: 13, color: '#7A5030', lineHeight: 1.6 }}>
                                    {trackingActive
                                        ? 'Porchest successfully received and matched a purchase from your campaign tracking flow.'
                                        : 'We are waiting for a matching Shopify order from one of your campaign links.'}
                                </p>
                            </div>
                        </GlassCard>
                    </div>

                    <GlassCard padding="24px">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Campaign Links</p>
                                <h2 style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: '#1A0A00' }}>All tracked campaigns</h2>
                            </div>
                            <div style={{ fontSize: 13, color: '#7A5030' }}>
                                {campaigns.length ? `${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'}` : 'No campaigns yet'}
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ marginTop: 16, borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: 18, color: '#7A5030', fontSize: 14 }}>
                                Loading campaign links...
                            </div>
                        ) : campaigns.length ? (
                            <div style={{ marginTop: 16, overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 860 }}>
                                    <thead>
                                        <tr>
                                            {['Campaign', 'Influencer', 'Price', 'Deadline', 'Status', 'Tracking Link'].map((column) => (
                                                <th
                                                    key={column}
                                                    style={{
                                                        textAlign: 'left',
                                                        padding: '14px 12px',
                                                        fontSize: 11,
                                                        color: '#7A5030',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                        borderBottom: '1px solid #EDD9BC',
                                                    }}
                                                >
                                                    {column}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map((campaign) => (
                                            <tr key={campaign.id}>
                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: '#1A0A00', fontWeight: 700 }}>
                                                    {campaign.name || 'Campaign'}
                                                </td>
                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: '#7A5030' }}>
                                                    {campaign.influencer || 'Influencer'}
                                                </td>
                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: '#7A5030' }}>
                                                    {formatMoney(campaign.price)}
                                                </td>
                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)', color: '#7A5030' }}>
                                                    {formatDate(campaign.deadline)}
                                                </td>
                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)' }}>
                                                    <BadgeStatus status={campaign.status || 'requested'} />
                                                </td>
                                                <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(237,217,188,0.55)' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                        <GlowButton variant="outline" size="sm" onClick={() => void handleCopyLink(campaign)}>
                                                            <Copy size={14} />
                                                            Copy Link
                                                        </GlowButton>
                                                        <GlowButton variant="outline" size="sm" onClick={() => void handleOpenLink(campaign)}>
                                                            <ExternalLink size={14} />
                                                            Open Link
                                                        </GlowButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ marginTop: 16, borderRadius: 14, border: '1px dashed #D8B47D', background: 'rgba(255,255,255,0.42)', padding: 20 }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>No campaign links are available yet.</p>
                                <p style={{ marginTop: 8, fontSize: 13, color: '#7A5030', lineHeight: 1.7 }}>
                                    Accept or create a collaboration first, then Porchest will generate tracking links for each campaign.
                                </p>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
