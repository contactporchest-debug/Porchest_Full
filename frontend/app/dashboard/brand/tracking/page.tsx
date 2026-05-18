'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Store } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GlassCard, GlowButton } from '@/components/ui';
import { shopifyAPI, trackingAPI } from '@/lib/api';

function StatusChip({ label, tone }: { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
    const palette = {
        success: { bg: 'rgba(16,185,129,0.12)', color: '#059669', border: 'rgba(16,185,129,0.24)' },
        warning: { bg: 'rgba(245,158,11,0.12)', color: '#d97706', border: 'rgba(245,158,11,0.24)' },
        danger: { bg: 'rgba(194,52,10,0.12)', color: '#C2340A', border: 'rgba(194,52,10,0.24)' },
        neutral: { bg: 'rgba(148,163,184,0.12)', color: '#64748b', border: 'rgba(148,163,184,0.24)' },
    } as const;

    const styles = palette[tone];
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 999,
            padding: '8px 12px',
            background: styles.bg,
            border: `1px solid ${styles.border}`,
            color: styles.color,
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
        }}>
            {label}
        </span>
    );
}

export default function TrackingSetupPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [shopDomain, setShopDomain] = useState('');

    const loadStatus = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await trackingAPI.getStatus();
            const nextStatus = res.data || null;
            setStatus(nextStatus);
            setShopDomain(nextStatus?.availableIntegrations?.shopify?.shopDomain || nextStatus?.shopDomain || '');
        } catch (error: any) {
            setStatus(null);
            toast.error(error?.response?.data?.error || error?.message || 'Failed to load Shopify setup');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadStatus();
    }, []);

    const shopifyConnected = Boolean(status?.availableIntegrations?.shopify?.connected);
    const shopifyDomain = status?.availableIntegrations?.shopify?.shopDomain || status?.shopDomain || '';
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
            if (!installUrl) throw new Error('Could not start Shopify connect');
            window.location.href = installUrl;
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.message || 'Could not connect Shopify. Try again.');
        } finally {
            setConnecting(false);
        }
    }

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720, margin: '0 auto' }}>
                    <GlassCard
                        padding="28px"
                        style={{
                            overflow: 'hidden',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,252,247,0.98) 100%)',
                            border: '1px solid rgba(43,157,70,0.12)',
                            borderRadius: 22,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{
                                width: 58,
                                height: 58,
                                borderRadius: 18,
                                background: 'linear-gradient(135deg, #95BF47, #5A9E3B)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 18px 36px rgba(90,158,59,0.22)',
                                color: '#fff',
                                flexShrink: 0,
                            }}>
                                <Store size={26} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Shopify
                                </p>
                                <h1 style={{ marginTop: 8, fontSize: 32, fontWeight: 900, color: '#1A0A00', letterSpacing: '-0.04em' }}>
                                    {shopifyConnected ? 'Connected' : 'Connect Shopify'}
                                </h1>
                                <p style={{ marginTop: 8, fontSize: 14, color: '#7A5030', lineHeight: 1.7 }}>
                                    {shopifyConnected
                                        ? 'Your Shopify store is connected.'
                                        : 'Enter your Shopify store domain to start the connection.'}
                                </p>
                                <div style={{ marginTop: 14 }}>
                                    <StatusChip
                                        label={shopifyConnected ? 'Connected' : 'Not connected'}
                                        tone={shopifyConnected ? 'success' : 'neutral'}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
                            {!shopifyConnected && (
                                <>
                                    <label style={{ fontSize: 13, fontWeight: 800, color: '#1A0A00' }}>Shopify Store Domain</label>
                                    <input
                                        value={shopDomain}
                                        onChange={(e) => setShopDomain(e.target.value)}
                                        placeholder="your-store.myshopify.com"
                                        autoComplete="off"
                                        className="input-dark"
                                        style={{
                                            height: 48,
                                            borderRadius: 14,
                                            border: '1px solid #EDD9BC',
                                            background: 'rgba(255,255,255,0.82)',
                                            padding: '0 14px',
                                            fontSize: 14,
                                            color: '#1A0A00',
                                        }}
                                    />
                                    <GlowButton onClick={() => void handleConnectShopify()} loading={connecting} style={{ width: '100%' }}>
                                        <CheckCircle2 size={14} />
                                        {connecting ? 'Connecting...' : 'Connect Shopify'}
                                    </GlowButton>
                                </>
                            )}

                            <GlowButton variant="outline" onClick={() => void loadStatus(true)} loading={refreshing}>
                                Sync status
                            </GlowButton>
                        </div>
                    </GlassCard>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
