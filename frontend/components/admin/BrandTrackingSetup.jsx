'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck, Webhook, ExternalLink, Code2 } from 'lucide-react';
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
    if (value === 'issue_detected') return '#dc2626';
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
                setStatus((prev) => ({ ...(prev || {}), ...data }));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const checkTestStatus = async () => {
        setActionLoading(true);
        try {
            const { data } = await api.post('/tracking/check-test-status');
            if (data?.success) {
                setStatus((prev) => ({ ...(prev || {}), ...data }));
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
    };

    const statusRow = (label, value) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#7A5030', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 13, color: statusTone(value), fontWeight: 800 }}>{prettyStatus(value)}</span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ borderRadius: 18, border: '1px solid rgba(194,52,10,0.18)', background: 'rgba(194,52,10,0.06)', padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C2340A' }}>Brand tracking setup</p>
                <h3 style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: '#1A0A00' }}>Track visits, purchases, and revenue</h3>
                <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.6 }}>
                    Start setup, confirm your platform, and validate the test order flow.
                </p>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00' }}>Overview</p>
                        <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>Live status from the backend tracking connection.</p>
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
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00' }}>Start setup</p>
                        <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>Initialize keys and prepare the tracking connection.</p>
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
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00' }}>Server webhook</p>
                        <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>Best for backend checkout or order confirmation handlers.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => void copy(status?.setupInstructions?.webhookPurchaseEndpoint || '', 'webhook-url')} style={copyStyle}>
                            {copied === 'webhook-url' ? <Check size={14} /> : <Copy size={14} />}
                            {copied === 'webhook-url' ? 'Copied' : 'Copy webhook URL'}
                        </button>
                        <button onClick={() => void checkTestStatus()} style={copyStyle}>
                            Check test status
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#7A5030', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ExternalLink size={14} />
                        <span>Webhook endpoint: {status?.setupInstructions?.webhookPurchaseEndpoint || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Code2 size={14} />
                        <span>Tracking token: {status?.trackingToken || '—'}</span>
                    </div>
                </div>
            </div>

            <div style={blockStyle}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00' }}>Test status</p>
                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>
                    {status?.testPurchaseReceived ? 'A test purchase has been received.' : 'Waiting for a confirmed test purchase.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7A5030', fontSize: 12 }}>
                    <Webhook size={14} />
                    <span>{status?.testPurchaseReceived ? 'Test purchase received' : 'No test purchase received yet'}</span>
                </div>
            </div>
        </div>
    );
}
