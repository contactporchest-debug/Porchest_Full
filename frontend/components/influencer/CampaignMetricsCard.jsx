'use client';

import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

const PERIODS = [
    { key: 1, label: 'Today' },
    { key: 10, label: '10 days' },
    { key: 20, label: '20 days' },
    { key: 30, label: '30 days' },
];

function formatNumber(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString();
}

function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CampaignMetricsCard({ collaborationId, brandFeedback = [] }) {
    const [periodDays, setPeriodDays] = useState(30);
    const { data: collaborationAnalytics, loading: analyticsLoading, error: analyticsError } = useApi(`/collaborations/${collaborationId}/analytics?period=${periodDays}`);
    const { data: metricsData, loading: metricsLoading, error: metricsError } = useApi(`/instagram/collaboration/${collaborationId}/metrics`);

    const loading = analyticsLoading || metricsLoading;
    const error = analyticsError || metricsError;

    const summary = collaborationAnalytics?.summary || {};
    const metrics = metricsData?.metrics || {};
    const metricsReady = Boolean(metricsData?.metricsReady);

    const cards = useMemo(() => ([
        { label: 'Link clicks', value: formatNumber(summary.clickCount ?? metrics.clicks) },
        { label: 'Unique visitors', value: formatNumber(summary.uniqueClicks ?? metrics.visits) },
        { label: 'Conversions', value: formatNumber(summary.purchaseCount ?? metrics.conversions) },
        { label: 'Revenue', value: formatCurrency(summary.revenue ?? metrics.revenue) },
        { label: 'Reach', value: formatNumber(metrics.reach) },
        { label: 'Impressions', value: formatNumber(metrics.impressions) },
        { label: 'Engagement', value: metrics.engagementRate != null ? `${Number(metrics.engagementRate).toFixed(1)}%` : '—' },
        { label: 'ROAS', value: metrics.roas != null ? `${Number(metrics.roas).toFixed(2)}x` : (summary.metrics?.roas != null ? `${Number(summary.metrics.roas).toFixed(2)}x` : '—') },
        { label: 'CPA', value: metrics.cpa != null ? formatCurrency(metrics.cpa) : (summary.metrics?.cpa != null ? formatCurrency(summary.metrics.cpa) : '—') },
    ]), [metrics, summary]);

    if (loading) {
        return <div className="p-4 text-sm font-bold text-[#7A5030] bg-[rgba(255,255,255,0.38)] rounded-xl text-center border border-[#EDD9BC]">Loading analytics...</div>;
    }
    if (error) {
        return <div className="p-4 text-sm font-bold text-red-400 bg-red-500/[0.06] rounded-xl text-center border border-red-500/[0.12]">Could not load campaign analytics.</div>;
    }
    if (!metricsData && !collaborationAnalytics) return null;

    return (
        <div className="space-y-4 pt-4 border-t border-[#EDD9BC]">
            <div className="flex flex-wrap gap-2">
                {PERIODS.map((period) => (
                    <button
                        key={period.key}
                        onClick={() => setPeriodDays(period.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                            periodDays === period.key
                                ? 'bg-[#C2340A] text-white border-[#C2340A]'
                                : 'bg-[rgba(255,255,255,0.48)] text-[#7A5030] border-[#EDD9BC] hover:bg-[rgba(255,255,255,0.65)]'
                        }`}
                    >
                        {period.label}
                    </button>
                ))}
            </div>

            {!metricsReady ? (
                <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4 backdrop-blur-[12px]">
                    <p className="text-sm font-semibold text-[#1A0A00]">Metrics unlock after the final post is submitted</p>
                    <p className="mt-1 text-xs text-[#7A5030]">{collaborationAnalytics?.dataLabel || 'Submit the live Instagram post link to start analysis and visualization.'}</p>
                </div>
            ) : null}

            {metricsReady ? (
                <>
                    {brandFeedback?.length ? (
                        <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4 backdrop-blur-[12px]">
                            <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-2">Brand feedback</p>
                            <ul className="space-y-1">
                                {brandFeedback.slice(-2).map((feedback, index) => (
                                    <li key={`${feedback}-${index}`} className="text-sm text-[#1A0A00]">
                                        • {feedback}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {cards.map((card) => (
                            <MetricCard key={card.label} label={card.label} value={card.value} />
                        ))}
                    </div>

                    <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4 backdrop-blur-[12px]">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-0.5">Campaign window</p>
                                <p className="text-sm font-bold text-[#1A0A00]">
                                    {collaborationAnalytics?.summary?.deadline ? `${collaborationAnalytics.summary.deadline}` : '—'}
                                </p>
                            </div>
                            {collaborationAnalytics?.summary?.daysRemaining > 0 ? (
                                <span className="px-3 py-1 bg-[#C2340A]/10 text-[#C2340A] rounded-full text-xs font-bold border border-[#EDD9BC]">
                                    {collaborationAnalytics.summary.daysRemaining} days remaining
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {Array.isArray(collaborationAnalytics?.recentPurchases) && collaborationAnalytics.recentPurchases.length > 0 ? (
                        <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4 backdrop-blur-[12px]">
                            <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-2">Recent conversions</p>
                            <div className="space-y-2">
                                {collaborationAnalytics.recentPurchases.slice(0, 3).map((purchase) => (
                                    <div key={purchase.id} className="flex items-center justify-between gap-3 text-xs text-[#1A0A00]">
                                        <span>{purchase.orderId || purchase.id}</span>
                                        <span className="font-bold">${Number(purchase.orderValue || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
