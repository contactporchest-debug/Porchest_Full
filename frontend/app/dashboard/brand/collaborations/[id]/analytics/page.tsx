'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { brandAPI } from '@/lib/api';
import { GlassCard, GlowButton, StatCard, LoadingSpinner } from '@/components/ui';
import CollaborationMetrics from '@/components/brand/CollaborationMetrics';
import { ArrowLeft, Calendar, Download, ExternalLink, FileText, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';

function fmtMoney(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtNumber(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString();
}

function fmtRate(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Number(value).toFixed(2)}%`;
}

function statusLabel(status?: string) {
    if (!status) return 'Active';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function CollaborationAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const collaborationId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    const load = async () => {
        if (!collaborationId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await brandAPI.getCollaborationAnalytics(collaborationId);
            setData(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to load campaign analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [collaborationId]);

    const collaboration = data?.collaboration;
    const summary = data?.summary;

    const downloadPdf = async () => {
        if (!collaborationId) return;
        try {
            setDownloading(true);
            const res = await brandAPI.downloadCollaborationPdf(collaborationId);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${(summary?.campaignName || 'collaboration').replace(/[^a-z0-9-_]+/gi, '_').replace(/_+/g, '_').toLowerCase() || 'collaboration'}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF download started.');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to download PDF.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['brand']}>
                <DashboardLayout>
                    <LoadingSpinner text="Loading campaign analytics..." />
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute allowedRoles={['brand']}>
                <DashboardLayout>
                    <GlassCard>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>{error}</p>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <GlowButton onClick={load}>Retry</GlowButton>
                            <GlowButton variant="outline" onClick={() => router.push('/dashboard/brand/collaborations')}>
                                Back to Collaborations
                            </GlowButton>
                        </div>
                    </GlassCard>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Link href="/dashboard/brand/collaborations" style={{ color: '#7A5030', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <ArrowLeft size={14} />
                                Back to collaborations
                            </Link>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Campaign Analytics</p>
                            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1A0A00', letterSpacing: '-0.03em' }}>{summary?.campaignName || 'Campaign'}</h1>
                            <p style={{ fontSize: '15px', color: '#7A5030', lineHeight: 1.7, maxWidth: '760px' }}>
                                Review live performance, tracking results, and campaign status for this collaboration.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <GlowButton variant="outline" onClick={downloadPdf} loading={downloading}>
                                <Download size={14} />
                                Download PDF
                            </GlowButton>
                            {collaboration?.content?.postLink || collaboration?.postLink ? (
                                <GlowButton variant="outline" onClick={() => window.open(collaboration?.content?.postLink || collaboration?.postLink, '_blank', 'noopener,noreferrer')}>
                                    <ExternalLink size={14} />
                                    Open Posted Content
                                </GlowButton>
                            ) : null}
                        </div>
                    </div>

                    <GlassCard>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                            <span style={{ padding: '6px 12px', borderRadius: '999px', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)', color: '#059669', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {statusLabel(summary?.status)}
                            </span>
                            <span style={{ fontSize: '13px', color: '#7A5030', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={14} />
                                {summary?.influencerName || '—'}
                            </span>
                            <span style={{ fontSize: '13px', color: '#7A5030', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} />
                                Deadline: {summary?.deadline || '—'}
                            </span>
                        </div>
                    </GlassCard>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        <StatCard title="Clicks" value={fmtNumber(summary?.clickCount ?? summary?.metrics?.clicks)} icon={<TrendingUp size={18} />} />
                        <StatCard title="Unique Visitors" value={fmtNumber(summary?.uniqueClicks ?? summary?.metrics?.visits)} icon={<Users size={18} />} />
                        <StatCard title="Conversions" value={fmtNumber(summary?.purchaseCount ?? summary?.metrics?.conversions)} icon={<ShieldCheck size={18} />} />
                        <StatCard title="Revenue" value={fmtMoney(summary?.metrics?.revenue ?? summary?.revenue)} icon={<FileText size={18} />} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        <StatCard title="Impressions" value={fmtNumber(summary?.metrics?.impressions)} icon={<TrendingUp size={18} />} />
                        <StatCard title="Reach" value={fmtNumber(summary?.metrics?.reach)} icon={<Users size={18} />} />
                        <StatCard title="Engagement Rate" value={fmtRate(summary?.metrics?.engagementRate)} icon={<ShieldCheck size={18} />} />
                        <StatCard title="ROAS" value={summary?.metrics?.roas != null ? `${Number(summary.metrics.roas).toFixed(2)}x` : '—'} icon={<TrendingUp size={18} />} />
                    </div>

                    <GlassCard>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Live Campaign Metrics</p>
                        <CollaborationMetrics collaborationId={collaborationId} />
                    </GlassCard>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <GlassCard>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Recent Clicks</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(data?.recentClicks || []).length ? data.recentClicks.map((click: any) => (
                                    <div key={click.id} style={{ padding: '14px 16px', borderRadius: '14px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>{click.campaignName} received a click from Instagram.</p>
                                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030', lineHeight: 1.6 }}>
                                            {click.timestamp} · {click.influencerName} · {click.referrer}
                                        </p>
                                    </div>
                                )) : (
                                    <p style={{ fontSize: '14px', color: '#7A5030' }}>No click events recorded yet.</p>
                                )}
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Recent Purchases</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(data?.recentPurchases || []).length ? data.recentPurchases.map((purchase: any) => (
                                    <div key={purchase.id} style={{ padding: '14px 16px', borderRadius: '14px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Order #{purchase.orderId} matched successfully.</p>
                                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030', lineHeight: 1.6 }}>
                                            {purchase.timestamp} · {fmtMoney(purchase.orderValue)} · {purchase.source} · {purchase.withinWindow ? 'within campaign window' : 'outside campaign window'}
                                        </p>
                                    </div>
                                )) : (
                                    <p style={{ fontSize: '14px', color: '#7A5030' }}>No purchase events recorded yet.</p>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
