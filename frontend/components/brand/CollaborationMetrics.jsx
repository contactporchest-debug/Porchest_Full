'use client';

import { motion } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

export default function CollaborationMetrics({ collaborationId }) {
    const metrics = useApi(`/instagram/collaboration/${collaborationId}/metrics`);
    const clicks = useApi(`/tracking/collaboration/${collaborationId}/clicks`);
    const followers = useApi(`/instagram/collaboration/${collaborationId}/followers`);

    const loading = metrics.loading || clicks.loading || followers.loading;
    const error = metrics.error || clicks.error || followers.error;

    if (loading) return <div className="p-4 text-sm text-gray-400">Loading campaign data...</div>;
    if (error) return <div className="p-4 text-sm text-red-400">Could not load campaign data: {error}</div>;

    const m = metrics.data;
    const c = clicks.data;
    const f = followers.data;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const fmtMoney = (n) => (n == null ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    const fmtX = (n) => (n == null ? '—' : `${Number(n).toFixed(2)}x`);
    const windowStatus = m?.windowStatus || 'active';
    const statusColors = {
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        grace_period: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    return (
        <div className="space-y-6">
            {m ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="font-medium text-white">Campaign window</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                            {m.campaignStartDate ? new Date(m.campaignStartDate).toLocaleDateString() : '—'} → {m.campaignEndDate ? new Date(m.campaignEndDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {m.daysRemaining > 0 ? <span className="text-sm text-gray-400">{m.daysRemaining} days left</span> : null}
                        <span className={`rounded-full border px-3 py-1 text-xs capitalize ${statusColors[windowStatus] || statusColors.active}`}>
                            {windowStatus.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            ) : null}

            {m ? <p className="text-xs italic text-gray-500">{m.dataLabel}</p> : null}

            <div>
                <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gray-400">Traffic</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <MetricCard index={0} label="Total clicks" value={fmt(c?.totalClicks)} sub="on tracking link" />
                    <MetricCard index={1} label="Unique visitors" value={fmt(c?.uniqueVisitors)} />
                    <MetricCard index={2} label="Click-through rate" value={c?.ctr != null ? `${Number(c.ctr).toFixed(1)}%` : '—'} />
                </div>
            </div>

            {m?.metrics?.conversions > 0 ? (
                <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gray-400">Revenue & ROI</p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <MetricCard index={3} label="Orders" value={fmt(m.metrics.conversions)} accent />
                        <MetricCard index={4} label="Total revenue" value={fmtMoney(m.metrics.revenue)} accent />
                        <MetricCard index={5} label="ROAS" value={fmtX(m.metrics.roas)} sub="revenue / influencer cost" />
                        <MetricCard index={6} label="Cost per order" value={fmtMoney(m.metrics.cpa)} />
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-sm text-gray-400">No promo code purchases recorded yet</p>
                    <p className="mt-1 text-xs text-gray-500">Make sure your checkout is calling the Porchest purchase webhook</p>
                </div>
            )}

            {m?.metrics?.reach > 0 ? (
                <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gray-400">Post performance</p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <MetricCard index={7} label="Post reach" value={fmt(m.metrics.reach)} />
                        <MetricCard index={8} label="Impressions" value={fmt(m.metrics.impressions)} />
                        <MetricCard index={9} label="Engagement rate" value={m.metrics.engagementRate != null ? `${Number(m.metrics.engagementRate).toFixed(1)}%` : '—'} />
                    </div>
                </div>
            ) : null}

            {f ? (
                <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gray-400">Follower growth</p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <MetricCard index={10} label="Baseline followers" value={fmt(f.baseline)} sub={f.baselineDate ? new Date(f.baselineDate).toLocaleDateString() : ''} />
                        <MetricCard index={11} label="Current followers" value={fmt(f.currentCount)} />
                        <MetricCard index={12} label="Net new followers" value={`${Number(f.netNewFollowers || 0) >= 0 ? '+' : ''}${fmt(f.netNewFollowers)}`} accent={Number(f.netNewFollowers) > 0} />
                        <MetricCard index={13} label="Growth rate" value={f.growthRate != null ? `${Number(f.growthRate).toFixed(2)}%` : '—'} />
                    </div>
                    <p className="mt-2 text-xs italic text-gray-500">
                        Follower growth is measured from campaign start to now. Attribution is inferred, not exact.
                    </p>

                    {Array.isArray(f.dailyReadings) && f.dailyReadings.length > 1 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                        >
                            <p className="mb-3 text-xs text-gray-400">Daily follower count</p>
                            <div className="flex h-20 items-end gap-1">
                                {(() => {
                                    const readings = f.dailyReadings;
                                    const min = Math.min(...readings.map((r) => Number(r.count || 0)));
                                    const max = Math.max(...readings.map((r) => Number(r.count || 0)));
                                    const range = max - min || 1;
                                    return readings.map((r, index) => (
                                        <div
                                            key={`${r.date || index}-${index}`}
                                            className="min-h-[4px] flex-1 rounded-sm bg-purple-500/70"
                                            style={{ height: `${Math.round(((Number(r.count || 0) - min) / range) * 64) + 4}px` }}
                                            title={`${new Date(r.date).toLocaleDateString()}: ${Number(r.count || 0).toLocaleString()}`}
                                        />
                                    ));
                                })()}
                            </div>
                            <div className="mt-1 flex justify-between text-xs text-gray-500">
                                <span>{new Date(f.dailyReadings[0].date).toLocaleDateString()}</span>
                                <span>{new Date(f.dailyReadings[f.dailyReadings.length - 1].date).toLocaleDateString()}</span>
                            </div>
                        </motion.div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
