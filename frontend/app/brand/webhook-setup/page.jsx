'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api, { shopifyAPI, trackingAPI, woocommerceAPI } from '@/lib/api';
import { BadgeStatus, GlassCard, GlowButton } from '@/components/ui';
import { Check, Copy, ExternalLink, RefreshCw, Store, Webhook } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function prettyStatus(value) {
    if (!value) return 'Not Started';
    if (value === 'custom') return 'Custom Website';
    return String(value).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function WebhookSetupPage() {
    const [secret, setSecret] = useState('YOUR_PORCHEST_WEBHOOK_SECRET');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shopDomain, setShopDomain] = useState('');
    const [wooStoreUrl, setWooStoreUrl] = useState('');
    const [wooConsumerKey, setWooConsumerKey] = useState('');
    const [wooConsumerSecret, setWooConsumerSecret] = useState('');
    const [wooError, setWooError] = useState('');
    const [wooLoading, setWooLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tracking/status');
            setStatus(res.data || null);
            if (res.data?.webhookSecret) setSecret(res.data.webhookSecret);
            if (res.data?.shopDomain || res.data?.availableIntegrations?.shopify?.shopDomain) {
                setShopDomain(res.data?.shopDomain || res.data?.availableIntegrations?.shopify?.shopDomain || '');
            }
            if (res.data?.availableIntegrations?.woocommerce?.storeUrl) {
                setWooStoreUrl(res.data.availableIntegrations.woocommerce.storeUrl);
            }
        } catch {
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const webhookEndpoint = status?.setupInstructions?.webhookPurchaseEndpoint || 'https://api.porchest.com/api/webhook/purchase';

    const code = `// Add this to your checkout success handler
await fetch('${webhookEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promoCode: appliedPromoCode,
    orderValue: order.total,
    orderId: order.id,
    currency: 'USD',
    webhookSecret: '${secret}'
  })
});`;

    async function copy(text) {
        await navigator.clipboard.writeText(text);
    }

    async function startSetup() {
        setRefreshing(true);
        try {
            const res = await trackingAPI.startSetup({ platform: 'custom', method: 'manual' });
            if (res.data?.webhookSecret) setSecret(res.data.webhookSecret);
            await load();
        } finally {
            setRefreshing(false);
        }
    }

    async function checkTestStatus() {
        setRefreshing(true);
        try {
            await trackingAPI.testStatus();
            await load();
        } finally {
            setRefreshing(false);
        }
    }

    async function connectShopify() {
        const domain = String(shopDomain || '').trim().toLowerCase();
        if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
            toast.error('Enter a valid Shopify store domain like your-store.myshopify.com');
            return;
        }
        try {
            const res = await shopifyAPI.startShopifyInstall(domain);
            const installUrl = res.data?.installUrl || res.data?.url;
            if (!installUrl) {
                throw new Error('Unable to generate Shopify install URL');
            }
            window.location.href = installUrl;
        } catch (error) {
            toast.error(error?.response?.data?.error || error?.message || 'Unable to start Shopify install');
        }
    }

    async function disconnectShopify() {
        setRefreshing(true);
        try {
            await shopifyAPI.disconnect();
            await load();
        } finally {
            setRefreshing(false);
        }
    }

    async function connectWooCommerce() {
        setWooError('');
        const trimmedStoreUrl = String(wooStoreUrl || '').trim();
        const trimmedConsumerKey = String(wooConsumerKey || '').trim();
        const trimmedConsumerSecret = String(wooConsumerSecret || '').trim();

        try {
            const parsed = new URL(trimmedStoreUrl);
            if (parsed.protocol !== 'https:') {
                throw new Error('WooCommerce store URL must use https://');
            }
            if (!trimmedConsumerKey || !trimmedConsumerSecret) {
                throw new Error('Consumer key and secret are required');
            }

            setWooLoading(true);
            const res = await woocommerceAPI.connect({
                storeUrl: parsed.origin,
                consumerKey: trimmedConsumerKey,
                consumerSecret: trimmedConsumerSecret,
            });
            if (res.data?.storeUrl) setWooStoreUrl(res.data.storeUrl);
            await load();
        } catch (error) {
            setWooError(error?.message || 'Unable to connect WooCommerce');
        } finally {
            setWooLoading(false);
        }
    }

    async function disconnectWooCommerce() {
        setRefreshing(true);
        try {
            await woocommerceAPI.disconnect();
            await load();
        } finally {
            setRefreshing(false);
        }
    }

    const progress = useMemo(() => ([
        { label: 'Campaign Links Ready', done: status?.linksStatus === 'active' },
        { label: 'Webhook Tracking Installed', done: ['configured', 'active'].includes(status?.webhookStatus) },
        { label: 'Test Purchase Received', done: status?.salesStatus === 'active' },
        { label: 'Tracking Active', done: status?.salesStatus === 'active' && !status?.lastError },
    ]), [status]);

    const shopifyConnected = Boolean(status?.availableIntegrations?.shopify?.connected);
    const wooCommerceConnected = Boolean(status?.availableIntegrations?.woocommerce?.connected);

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>
                    <GlassCard padding="28px">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ maxWidth: 760 }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand Tracking Setup</p>
                                <h1 style={{ marginTop: 8, fontSize: 30, fontWeight: 800, color: '#1A0A00', letterSpacing: '-0.03em' }}>Tracking verification and purchase setup</h1>
                                <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.7 }}>
                                    Start your tracking setup, confirm a test order, and verify campaign links, website tracking, and sales reporting in one place.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <GlowButton variant="outline" onClick={load} loading={loading || refreshing}>
                                    <RefreshCw size={14} />
                                    Refresh
                                </GlowButton>
                                <GlowButton onClick={() => void checkTestStatus()} loading={refreshing}>
                                    <Check size={14} />
                                    Check Test Status
                                </GlowButton>
                            </div>
                        </div>
                    </GlassCard>

                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        {progress.map((item) => (
                            <GlassCard key={item.label} padding="18px" noHover>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</p>
                                <p style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: item.done ? '#059669' : '#b45309' }}>{item.done ? 'Ready' : 'Pending'}</p>
                            </GlassCard>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                        <GlassCard padding="24px">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overview</p>
                                    <h2 style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>Live tracking status</h2>
                                </div>
                                <GlowButton variant="outline" size="sm" onClick={() => void load(true)} loading={refreshing}>
                                    <RefreshCw size={14} />
                                    Refresh
                                </GlowButton>
                            </div>

                            {loading ? (
                                <div style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: 18, fontSize: 14, color: '#7A5030' }}>
                                    Loading tracking status...
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <span style={{ fontSize: 13, color: '#7A5030' }}>Campaign Links</span>
                                        <BadgeStatus status={status?.linksStatus || 'not_started'} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <span style={{ fontSize: 13, color: '#7A5030' }}>Sales Tracking</span>
                                        <BadgeStatus status={status?.salesStatus || 'not_started'} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <span style={{ fontSize: 13, color: '#7A5030' }}>Webhook</span>
                                        <BadgeStatus status={status?.webhookStatus || 'not_configured'} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <span style={{ fontSize: 13, color: '#7A5030' }}>Platform</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00' }}>{prettyStatus(status?.platform)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <span style={{ fontSize: 13, color: '#7A5030' }}>Last verified</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00' }}>{status?.lastVerifiedAt ? new Date(status.lastVerifiedAt).toLocaleString() : '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <span style={{ fontSize: 13, color: '#7A5030' }}>Last event received</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00' }}>{status?.lastEventReceivedAt ? new Date(status.lastEventReceivedAt).toLocaleString() : '—'}</span>
                                    </div>
                                    {status?.lastError ? (
                                        <div style={{ borderRadius: 12, border: '1px solid rgba(220,38,38,0.18)', background: 'rgba(220,38,38,0.06)', padding: 16 }}>
                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Issue Detected</p>
                                            <p style={{ marginTop: 6, fontSize: 13, color: '#7A5030', lineHeight: 1.6 }}>{status.lastError}</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </GlassCard>

                        <GlassCard padding="24px">
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Test tracking</p>
                            <h2 style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>Open the campaign and place a test order</h2>
                            <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.7 }}>
                                Open the latest tracked campaign, complete a test checkout on the brand site, then return here and check the test status.
                            </p>

                            <div style={{ marginTop: 16, borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.56)', padding: 16 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1A0A00' }}>Checklist</p>
                                <ol style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 8, color: '#7A5030', fontSize: 13, lineHeight: 1.65 }}>
                                    <li>Open the tracking link from your latest campaign.</li>
                                    <li>Complete a test purchase.</li>
                                    <li>Return to Porchest and click Check Test Status.</li>
                                    <li>Confirm the dashboard shows Tracking Active.</li>
                                </ol>
                            </div>

                                    <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        <GlowButton variant="outline" onClick={() => void openCampaign()}>
                                            <ExternalLink size={14} />
                                            Open Tracking Link
                                        </GlowButton>
                                    </div>
                                </GlassCard>
                            </div>

                    <GlassCard padding="24px">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Webhook tracking code</p>
                                <h2 style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>Use the server webhook for purchase tracking</h2>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                <GlowButton variant="outline" size="sm" onClick={() => void copy(code)}>
                                    <Copy size={14} />
                                    Copy Webhook Code
                                </GlowButton>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 16 }}>
                            <pre style={{ margin: 0, overflowX: 'auto', borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.60)', padding: 16, fontSize: 12, lineHeight: 1.7, color: '#5E4324', whiteSpace: 'pre-wrap' }}>{code}</pre>
                        </div>

                        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 16 }}>
                            <div style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', padding: 16 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1A0A00' }}>Webhook purchase endpoint</p>
                                <p style={{ marginTop: 6, fontSize: 13, color: '#7A5030', wordBreak: 'break-all' }}>{webhookEndpoint}</p>
                            </div>
                        </div>
                    </GlassCard>

                    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                        <GlassCard padding="24px">
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shopify Integration</p>
                            <h3 style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>Connect your Shopify store</h3>
                            <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.7 }}>
                                Connect Shopify so Porchest can receive order events and match purchases using influencer promo codes.
                            </p>
                            <p style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phase 1 matches promo-code orders only</p>
                            {shopifyConnected ? (
                                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                    <div style={{ borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.56)', padding: 16 }}>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>Shopify Connected</p>
                                        <div style={{ marginTop: 8, display: 'grid', gap: 4, color: '#7A5030', fontSize: 13 }}>
                                            <div>Store: {status?.shopDomain || status?.availableIntegrations?.shopify?.shopDomain || '—'}</div>
                                            <div>Order Webhook: {prettyStatus(status?.webhookStatus)}</div>
                                            <div>Sales Tracking: {prettyStatus(status?.salesStatus)}</div>
                                            <div>Last Event: {status?.lastEventReceivedAt ? new Date(status.lastEventReceivedAt).toLocaleString() : '—'}</div>
                                            <div>Last Verified: {status?.lastVerifiedAt ? new Date(status.lastVerifiedAt).toLocaleString() : '—'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        <GlowButton variant="outline" size="sm" onClick={() => void checkTestStatus()}>
                                            <Check size={14} />
                                            Check Test Status
                                        </GlowButton>
                                        <GlowButton variant="outline" size="sm" onClick={() => void disconnectShopify()}>
                                            Disconnect Shopify
                                        </GlowButton>
                                        <Link href="/dashboard/brand/tracking" style={{ textDecoration: 'none' }}>
                                            <GlowButton variant="outline" size="sm">
                                                <ExternalLink size={14} />
                                                View Tracking Activity
                                            </GlowButton>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>Shopify store domain</label>
                                        <input
                                            type="text"
                                            value={shopDomain}
                                            onChange={(e) => setShopDomain(e.target.value)}
                                            placeholder="your-store.myshopify.com"
                                            style={{
                                                width: '100%',
                                                borderRadius: 10,
                                                border: '1px solid #EDD9BC',
                                                background: 'rgba(255,255,255,0.70)',
                                                padding: '12px 14px',
                                                fontSize: 14,
                                                color: '#1A0A00',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>
                                    <GlowButton onClick={() => void connectShopify()}>
                                        <Store size={14} />
                                        Connect Shopify
                                    </GlowButton>
                                </div>
                            )}
                        </GlassCard>

                        <GlassCard padding="24px">
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WooCommerce Integration</p>
                            <h3 style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>Connect your WooCommerce store</h3>
                            <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.7 }}>
                                Connect your WooCommerce store so Porchest can receive order events and match purchases using influencer promo codes.
                            </p>
                            <p style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phase 1 matches WooCommerce orders using Porchest promo/coupon codes</p>
                            {wooCommerceConnected ? (
                                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                    <div style={{ borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.56)', padding: 16 }}>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>WooCommerce Connected</p>
                                        <div style={{ marginTop: 8, display: 'grid', gap: 4, color: '#7A5030', fontSize: 13 }}>
                                            <div>Store URL: {status?.availableIntegrations?.woocommerce?.storeUrl || status?.storeUrl || '—'}</div>
                                            <div>Webhook Status: {prettyStatus(status?.webhookStatus)}</div>
                                            <div>Sales Tracking: {prettyStatus(status?.salesStatus)}</div>
                                            <div>Last Event: {status?.lastEventReceivedAt ? new Date(status.lastEventReceivedAt).toLocaleString() : '—'}</div>
                                            <div>Last Verified: {status?.lastVerifiedAt ? new Date(status.lastVerifiedAt).toLocaleString() : '—'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        <GlowButton variant="outline" size="sm" onClick={() => void checkTestStatus()}>
                                            <Check size={14} />
                                            Check Test Status
                                        </GlowButton>
                                        <GlowButton variant="outline" size="sm" onClick={() => void disconnectWooCommerce()}>
                                            Disconnect WooCommerce
                                        </GlowButton>
                                        <Link href="/dashboard/brand/tracking" style={{ textDecoration: 'none' }}>
                                            <GlowButton variant="outline" size="sm">
                                                <ExternalLink size={14} />
                                                View Tracking Activity
                                            </GlowButton>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>Store URL</label>
                                        <input
                                            type="url"
                                            value={wooStoreUrl}
                                            onChange={(e) => {
                                                setWooStoreUrl(e.target.value);
                                                setWooError('');
                                            }}
                                            placeholder="https://yourstore.com"
                                            style={{
                                                width: '100%',
                                                borderRadius: 10,
                                                border: '1px solid #EDD9BC',
                                                background: 'rgba(255,255,255,0.70)',
                                                padding: '12px 14px',
                                                fontSize: 14,
                                                color: '#1A0A00',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>Consumer Key</label>
                                        <input
                                            type="text"
                                            value={wooConsumerKey}
                                            onChange={(e) => {
                                                setWooConsumerKey(e.target.value);
                                                setWooError('');
                                            }}
                                            placeholder="ck_..."
                                            style={{
                                                width: '100%',
                                                borderRadius: 10,
                                                border: '1px solid #EDD9BC',
                                                background: 'rgba(255,255,255,0.70)',
                                                padding: '12px 14px',
                                                fontSize: 14,
                                                color: '#1A0A00',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: '#1A0A00' }}>Consumer Secret</label>
                                        <input
                                            type="password"
                                            value={wooConsumerSecret}
                                            onChange={(e) => {
                                                setWooConsumerSecret(e.target.value);
                                                setWooError('');
                                            }}
                                            placeholder="cs_..."
                                            style={{
                                                width: '100%',
                                                borderRadius: 10,
                                                border: '1px solid #EDD9BC',
                                                background: 'rgba(255,255,255,0.70)',
                                                padding: '12px 14px',
                                                fontSize: 14,
                                                color: '#1A0A00',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>
                                    {wooError ? (
                                        <div style={{ borderRadius: 12, border: '1px solid rgba(220,38,38,0.18)', background: 'rgba(220,38,38,0.06)', padding: 14 }}>
                                            <p style={{ margin: 0, fontSize: 13, color: '#dc2626', fontWeight: 700 }}>{wooError}</p>
                                        </div>
                                    ) : null}
                                    <GlowButton onClick={() => void connectWooCommerce()} loading={wooLoading}>
                                        <Webhook size={14} />
                                        {wooLoading ? 'Connecting...' : 'Connect WooCommerce'}
                                    </GlowButton>
                                </div>
                            )}
                        </GlassCard>
                    </div>

                    <GlassCard padding="24px">
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Troubleshooting</p>
                        <div style={{ marginTop: 16, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                            <div style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.56)', padding: 16 }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>Waiting For Test Order</p>
                                <p style={{ marginTop: 6, fontSize: 13, color: '#7A5030', lineHeight: 1.7 }}>Open the tracking link, complete a test order, then click Check Test Status.</p>
                            </div>
                            <div style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.56)', padding: 16 }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>Tracking Issue Detected</p>
                                <p style={{ marginTop: 6, fontSize: 13, color: '#7A5030', lineHeight: 1.7 }}>The order was received, but it could not be matched to a campaign. Make sure the link or promo code was used.</p>
                            </div>
                            <div style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.56)', padding: 16 }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>No Campaign Links</p>
                                <p style={{ marginTop: 6, fontSize: 13, color: '#7A5030', lineHeight: 1.7 }}>No campaign links are available yet. Create or accept a collaboration first.</p>
                            </div>
                            <div style={{ borderRadius: 12, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.56)', padding: 16 }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>Need the advanced details?</p>
                                <p style={{ marginTop: 6, fontSize: 13, color: '#7A5030', lineHeight: 1.7 }}>Use the brand dashboard tracking page for activity, status, and purchase summaries.</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
