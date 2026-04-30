'use client';

import { useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

export default function CampaignMetricsCard({ collaborationId }) {
    const { data: metricsData, loading: metricsLoading, error: metricsError } = useApi(`/instagram/collaboration/${collaborationId}/metrics`);
    const { data: clicksData, loading: clicksLoading, error: clicksError } = useApi(`/tracking/collaboration/${collaborationId}/clicks`);

    if (metricsLoading || clicksLoading) return <div className="p-3 text-sm text-gray-400">Loading...</div>;
    if (metricsError || clicksError) return <div className="p-3 text-sm text-red-400">Could not load campaign metrics.</div>;
    if (!metricsData) return null;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const m = metricsData;
    const c = clicksData;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <MetricCard index={0} label="Link clicks" value={fmt(c?.totalClicks)} sub="from your tracking link" />
                <MetricCard index={1} label="Unique visitors" value={fmt(c?.uniqueVisitors)} />
            </div>

            {m.metrics?.reach > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                    <MetricCard index={2} label="Post reach" value={fmt(m.metrics.reach)} />
                    <MetricCard index={3} label="Impressions" value={fmt(m.metrics.impressions)} />
                    <MetricCard index={4} label="Engagement" value={m.metrics.engagementRate != null ? `${Number(m.metrics.engagementRate).toFixed(1)}%` : '—'} />
                </div>
            ) : null}

            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-gray-400">
                Campaign window: {m.campaignStartDate ? new Date(m.campaignStartDate).toLocaleDateString() : '—'} — {m.campaignEndDate ? new Date(m.campaignEndDate).toLocaleDateString() : '—'}
                {m.daysRemaining > 0 ? <span className="ml-2 text-purple-400">{m.daysRemaining} days remaining</span> : null}
            </div>
        </div>
    );
}
