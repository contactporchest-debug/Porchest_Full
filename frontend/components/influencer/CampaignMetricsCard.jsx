'use client';

import { useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

export default function CampaignMetricsCard({ collaborationId }) {
    const { data: metricsData, loading: metricsLoading, error: metricsError } = useApi(`/instagram/collaboration/${collaborationId}/metrics`);
    const { data: clicksData, loading: clicksLoading, error: clicksError } = useApi(`/tracking/collaboration/${collaborationId}/clicks`);

    if (metricsLoading || clicksLoading) return <div className="p-4 text-sm font-bold text-white/30 bg-white/[0.03] rounded-xl text-center border border-white/[0.06]">Loading metrics...</div>;
    if (metricsError || clicksError) return <div className="p-4 text-sm font-bold text-red-400 bg-red-500/[0.06] rounded-xl text-center border border-red-500/[0.12]">Could not load campaign metrics.</div>;
    if (!metricsData) return null;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const m = metricsData;
    const c = clicksData;
    const metricsReady = Boolean(m.metricsReady);

    return (
        <div className="space-y-4 pt-4 border-t border-[#EDD9BC]">
            <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide">Performance Metrics</p>

            {!metricsReady ? (
                <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4 backdrop-blur-[12px]">
                    <p className="text-sm font-semibold text-[#1A0A00]">Metrics unlock after the final post is submitted</p>
                    <p className="mt-1 text-xs text-[#7A5030]">{m.dataLabel || 'Submit the live Instagram post link to start analysis and visualization.'}</p>
                </div>
            ) : null}
            
            {metricsReady ? (
                <div className="grid grid-cols-2 gap-4">
                    <MetricCard index={0} label="Link clicks" value={fmt(c?.totalClicks)} sub="from your tracking link" />
                    <MetricCard index={1} label="Unique visitors" value={fmt(c?.uniqueVisitors)} />
                </div>
            ) : null}

            {metricsReady && m.metrics?.reach > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                    <MetricCard index={2} label="Post reach" value={fmt(m.metrics.reach)} />
                    <MetricCard index={3} label="Impressions" value={fmt(m.metrics.impressions)} />
                    <MetricCard index={4} label="Engagement" value={m.metrics.engagementRate != null ? `${Number(m.metrics.engagementRate).toFixed(1)}%` : '—'} />
                </div>
            ) : null}

            {metricsReady ? (
            <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4 flex items-center justify-between backdrop-blur-[12px]">
                <div>
                    <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-0.5">Campaign Window</p>
                    <p className="text-sm font-bold text-[#1A0A00]">
                        {m.campaignStartDate ? new Date(m.campaignStartDate).toLocaleDateString() : '—'} — {m.campaignEndDate ? new Date(m.campaignEndDate).toLocaleDateString() : '—'}
                    </p>
                </div>
                {m.daysRemaining > 0 ? (
                    <span className="px-3 py-1 bg-[#C2340A]/10 text-[#C2340A] rounded-full text-xs font-bold border border-[#EDD9BC]">
                        {m.daysRemaining} days remaining
                    </span>
                ) : null}
            </div>
            ) : null}
        </div>
    );
}
