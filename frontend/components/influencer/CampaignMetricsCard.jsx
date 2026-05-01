'use client';

import { useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

export default function CampaignMetricsCard({ collaborationId }) {
    const { data: metricsData, loading: metricsLoading, error: metricsError } = useApi(`/instagram/collaboration/${collaborationId}/metrics`);
    const { data: clicksData, loading: clicksLoading, error: clicksError } = useApi(`/tracking/collaboration/${collaborationId}/clicks`);

    if (metricsLoading || clicksLoading) return <div className="p-4 text-sm font-bold text-slate-400 bg-slate-50 rounded-xl text-center border border-slate-100">Loading metrics...</div>;
    if (metricsError || clicksError) return <div className="p-4 text-sm font-bold text-red-500 bg-red-50 rounded-xl text-center border border-red-100">Could not load campaign metrics.</div>;
    if (!metricsData) return null;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const m = metricsData;
    const c = clicksData;

    return (
        <div className="space-y-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Performance Metrics</p>
            
            <div className="grid grid-cols-2 gap-4">
                <MetricCard index={0} label="Link clicks" value={fmt(c?.totalClicks)} sub="from your tracking link" />
                <MetricCard index={1} label="Unique visitors" value={fmt(c?.uniqueVisitors)} />
            </div>

            {m.metrics?.reach > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                    <MetricCard index={2} label="Post reach" value={fmt(m.metrics.reach)} />
                    <MetricCard index={3} label="Impressions" value={fmt(m.metrics.impressions)} />
                    <MetricCard index={4} label="Engagement" value={m.metrics.engagementRate != null ? `${Number(m.metrics.engagementRate).toFixed(1)}%` : '—'} />
                </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Campaign Window</p>
                    <p className="text-sm font-bold text-slate-700">
                        {m.campaignStartDate ? new Date(m.campaignStartDate).toLocaleDateString() : '—'} — {m.campaignEndDate ? new Date(m.campaignEndDate).toLocaleDateString() : '—'}
                    </p>
                </div>
                {m.daysRemaining > 0 ? (
                    <span className="px-3 py-1 bg-stone-100 text-stone-800 rounded-full text-xs font-bold border border-stone-200">
                        {m.daysRemaining} days remaining
                    </span>
                ) : null}
            </div>
        </div>
    );
}
