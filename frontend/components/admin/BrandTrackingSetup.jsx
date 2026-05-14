'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, RefreshCw, ExternalLink, ShieldCheck, AlertTriangle, Link2, Code2, Webhook } from 'lucide-react';
import api from '@/lib/api';

const statusCopy = {
    active: 'Active',
    waiting_for_test: 'Waiting for Test Order',
    not_started: 'Not Started',
    not_ready: 'Not Ready',
    connected: 'Connected',
    configured: 'Configured',
    installed: 'Installed',
    issue_detected: 'Issue Detected',
    not_installed: 'Not Installed',
    not_configured: 'Not Configured',
};

function prettyStatus(value) {
    return statusCopy[value] || value || 'Unknown';
}

function statusTone(value) {
    if (['active', 'connected', 'configured', 'installed'].includes(value)) return '#059669';
    if (['waiting_for_test', 'not_started', 'not_ready', 'not_installed', 'not_configured'].includes(value)) return '#b45309';
    if (['issue_detected'].includes(value)) return '#dc2626';
    return '#7A5030';
}

export default function BrandTrackingSetup() {
    const [copied, setCopied] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [platform, setPlatform] = useState('custom');
    const [method, setMethod] = useState('manual');

    const loadStatus = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tracking/status');
            if (data?.success) {
                setStatus(data);
                setPlatform(data.platform || 'custom');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadStatus();
    }, []);

    const pixelScriptUrl = status?.setupInstructions?.pixelScriptUrl || 'https://www.porchest.com/pixel.js';
    const pixelEndpoint = status?.setupInstructions?.pixelPurchaseEndpoint || 'https://www.porchest.com/api/pixel/purchase';
    const webhookEndpoint = status?.setupInstructions?.webhookPurchaseEndpoint || 'https://www.porchest.com/api/webhook/purchase';

    const pixelCode = `<script src="${pixelScriptUrl}"></script>
<script>
  window.Porchest.trackPurchase({
    orderId: 'ORDER-123',
    orderValue: 250,
    currency: 'USD'
  });
</script>`;

    const pixelPurchaseExample = `window.Porchest.trackPurchase({
  orderId: 'ORDER-123',
  orderValue: 250,
  currency: 'USD',
  attributionToken: window.Porchest.getAttribution && window.Porchest.getAttribution()
});`;

    const webhookCode = `await fetch('${webhookEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promoCode: 'ORDER-123',
    orderValue: 250,
    orderId: 'ORDER-123',
    currency: 'USD',
    webhookSecret: '${status?.webhookSecret || 'YOUR_WEBHOOK_SECRET'}'
  })
});`;

    const copy = async (text, key) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1600);
    };

    const startSetup = async () => {
        setActionLoading(true);
        try {
            const { data } = await api.post('/tracking/setup/start', { platform, method });
            if (data?.success) {
                setStatus((prev) => ({
                    ...(prev || {}),
                    ...data,
                }));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const checkTestStatus = async () => {
        setActionLoading(true);
        try {
            const { data } = await api.post('/tracking/test-status');
            if (data?.success) {
                setStatus((prev) => ({
                    ...(prev || {}),
                    ...data,
                }));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const blockStyle = {
        borderRadius: '16px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.6)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(26,10,0,0.02)',
    };

    const copyStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '8px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.8)',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#1A0A00',
        cursor: 'pointer',
        transition: 'all 0.15s',
    };

    const statusRow = (label, value) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#7A5030', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 13, color: statusTone(value), fontWeight: 800 }}>{prettyStatus(value)}</span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderRadius: '18px', border: '1px solid rgba(194,52,10,0.18)', background: 'rgba(194,52,10,0.06)', padding: '20px', backdropFilter: 'blur(12px)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C2340A' }}>Brand tracking setup</p>
                <h3 style={{ marginTop: '8px', fontSize: '18px', fontWeight: 700, color: '#1A0A00' }}>Track visits, purchases, and revenue for this brand</h3>
                <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030', lineHeight: 1.6 }}>
                    Start setup, place the pixel or webhook code, and confirm a test order to activate tracking.
                </p>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Overview</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Live status from the backend tracking connection.</p>
                    </div>
                    <button onClick={() => void loadStatus()} style={copyStyle} disabled={loading || actionLoading}>
                        <RefreshCw size={14} />
                        {loading ? 'Loading' : 'Refresh'}
                    </button>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                    {statusRow('Campaign Links', status?.linksStatus)}
                    {statusRow('Sales Tracking', status?.salesStatus)}
                    {statusRow('Pixel', status?.pixelStatus)}
                    {statusRow('Webhook', status?.webhookStatus)}
                    {statusRow('Connection', status?.status)}
                </div>
                <div style={{ display: 'grid', gap: 8, marginTop: 4, fontSize: 12, color: '#7A5030' }}>
                    <div>Last verified: {status?.lastVerifiedAt ? new Date(status.lastVerifiedAt).toLocaleString() : '—'}</div>
                    <div>Last event received: {status?.lastEventReceivedAt ? new Date(status.lastEventReceivedAt).toLocaleString() : '—'}</div>
                    {status?.lastError ? <div style={{ color: '#dc2626', fontWeight: 600 }}>Last error: {status.lastError}</div> : null}
                </div>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Start setup</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Initialize keys and prepare the tracking connection.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ ...copyStyle, padding: '6px 10px' }}>
                            <option value="custom">Custom</option>
                            <option value="manual">Manual</option>
                            <option value="gtm">GTM</option>
                            <option value="shopify">Shopify</option>
                            <option value="woocommerce">WooCommerce</option>
                        </select>
                        <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ ...copyStyle, padding: '6px 10px' }}>
                            <option value="manual">Manual</option>
                            <option value="pixel">Pixel</option>
                            <option value="webhook">Webhook</option>
                            <option value="connected">Connected</option>
                        </select>
                        <button onClick={() => void startSetup()} style={copyStyle} disabled={actionLoading}>
                            <ShieldCheck size={14} />
                            Start Setup
                        </button>
                    </div>
                </div>
                <p style={{ fontSize: 12, color: '#7A5030', lineHeight: 1.6 }}>
                    Campaign Links: {prettyStatus(status?.linksStatus)}. Sales Tracking: {prettyStatus(status?.salesStatus)}.
                </p>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Website Tracking Code</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Add the shared pixel script to the brand site and fire purchases from the checkout page.</p>
                    </div>
                    <button onClick={() => void copy(pixelCode, 'pixel')} style={copyStyle}>
                        {copied === 'pixel' ? <Check size={14} /> : <Copy size={14} />}
                        {copied === 'pixel' ? 'Copied' : 'Copy Pixel Script'}
                    </button>
                </div>
                <pre style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.8)', padding: '16px', fontSize: '12px', lineHeight: 1.6, color: '#1A0A00', fontFamily: 'monospace' }}>
                    {pixelCode}
                </pre>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#7A5030', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ExternalLink size={14} />
                        <span>Pixel script URL: {pixelScriptUrl}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Code2 size={14} />
                        <span>Pixel purchase endpoint: {pixelEndpoint}</span>
                    </div>
                    <button onClick={() => void copy(pixelPurchaseExample, 'pixel-example')} style={{ ...copyStyle, alignSelf: 'flex-start' }}>
                        {copied === 'pixel-example' ? <Check size={14} /> : <Copy size={14} />}
                        {copied === 'pixel-example' ? 'Copied' : 'Copy Pixel Purchase Example'}
                    </button>
                </div>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Server Webhook</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Best for backend checkout or order confirmation handlers.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => void copy(webhookEndpoint, 'webhook-url')} style={copyStyle}>
                            {copied === 'webhook-url' ? <Check size={14} /> : <Copy size={14} />}
                            {copied === 'webhook-url' ? 'Copied' : 'Copy Webhook URL'}
                        </button>
                        <button onClick={() => void copy(status?.webhookSecret || '', 'webhook-secret')} style={copyStyle} disabled={!status?.webhookSecret}>
                            {copied === 'webhook-secret' ? <Check size={14} /> : <Copy size={14} />}
                            {copied === 'webhook-secret' ? 'Copied' : 'Copy Webhook Secret'}
                        </button>
                    </div>
                </div>
                <pre style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.8)', padding: '16px', fontSize: '12px', lineHeight: 1.6, color: '#1A0A00', fontFamily: 'monospace' }}>
                    {webhookCode}
                </pre>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7A5030' }}>
                    <Webhook size={14} />
                    <span>Use the webhook only after the order is confirmed server-side.</span>
                </div>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Test Tracking</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Confirm the tracking pipeline with a live or test purchase.</p>
                    </div>
                    <button onClick={() => void checkTestStatus()} style={copyStyle} disabled={actionLoading}>
                        <Link2 size={14} />
                        Check Test Status
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7A5030' }}>
                    {status?.salesStatus === 'active' ? <Check size={14} color="#059669" /> : <AlertTriangle size={14} color="#b45309" />}
                    <span>
                        {status?.salesStatus === 'active' ? 'Sales Tracking: Active' : 'Sales Tracking: Waiting for Test Order'}
                    </span>
                </div>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Advanced Details</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Use these values when wiring custom checkout code.</p>
                    </div>
                    <button onClick={() => void copy(status?.trackingKey || '', 'tracking-key')} style={copyStyle} disabled={!status?.trackingKey}>
                        {copied === 'tracking-key' ? <Check size={14} /> : <Copy size={14} />}
                        {copied === 'tracking-key' ? 'Copied' : 'Copy Tracking Key'}
                    </button>
                </div>
                <div style={{ display: 'grid', gap: 8, fontSize: 12, color: '#7A5030' }}>
                    <div>Tracking Key: {status?.trackingKey || '—'}</div>
                    <div>Platform: {status?.platform || platform}</div>
                    <div>Pixel status: {prettyStatus(status?.pixelStatus)}</div>
                    <div>Webhook status: {prettyStatus(status?.webhookStatus)}</div>
                </div>
            </div>
        </div>
    );
}
