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

    if (loading) return <div className="p-6 text-sm font-bold text-slate-400 bg-slate-50 rounded-2xl text-center border border-slate-100">Loading campaign data...</div>;
    if (error) return <div className="p-6 text-sm font-bold text-red-500 bg-red-50 rounded-2xl text-center border border-red-100">Could not load campaign data: {error}</div>;

    const m = metrics.data;
    const c = clicks.data;
    const f = followers.data;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const fmtMoney = (n) => (n == null ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    const fmtX = (n) => (n == null ? '—' : `${Number(n).toFixed(2)}x`);
    const windowStatus = m?.windowStatus || 'active';
    const statusColors = {
        active: 'bg-green-100 text-green-700 border-green-200',
        grace_period: 'bg-amber-100 text-amber-700 border-amber-200',
        completed: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
        <div className="space-y-8 pt-4 border-t border-slate-100">
            {m ? (
                <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="font-bold text-[#172033] text-sm">Campaign Window</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                            {m.campaignStartDate ? new Date(m.campaignStartDate).toLocaleDateString() : '—'} → {m.campaignEndDate ? new Date(m.campaignEndDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {m.daysRemaining > 0 ? <span className="text-xs font-bold text-stone-700">{m.daysRemaining} days left</span> : null}
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusColors[windowStatus] || statusColors.active}`}>
                            {windowStatus.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            ) : null}

            {m ? <p className="text-xs italic text-slate-400 font-medium">{m.dataLabel}</p> : null}

            <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Traffic</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <MetricCard index={0} label="Total clicks" value={fmt(c?.totalClicks)} sub="on tracking link" />
                    <MetricCard index={1} label="Unique visitors" value={fmt(c?.uniqueVisitors)} />
                    <MetricCard index={2} label="Click-through rate" value={c?.ctr != null ? `${Number(c.ctr).toFixed(1)}%` : '—'} />
                </div>
            </div>

            {m?.metrics?.conversions > 0 ? (
                <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Revenue & ROI</p>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <MetricCard index={3} label="Orders" value={fmt(m.metrics.conversions)} accent />
                        <MetricCard index={4} label="Total revenue" value={fmtMoney(m.metrics.revenue)} accent />
                        <MetricCard index={5} label="ROAS" value={fmtX(m.metrics.roas)} sub="revenue / influencer cost" />
                        <MetricCard index={6} label="Cost per order" value={fmtMoney(m.metrics.cpa)} />
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-inner">
                    <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-sm font-bold text-slate-700">No promo code purchases recorded yet</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">Make sure your checkout is calling the Porchest purchase webhook</p>
                </div>
            )}

            {m?.metrics?.reach > 0 ? (
                <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Post performance</p>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        <MetricCard index={7} label="Post reach" value={fmt(m.metrics.reach)} />
                        <MetricCard index={8} label="Impressions" value={fmt(m.metrics.impressions)} />
                        <MetricCard index={9} label="Engagement rate" value={m.metrics.engagementRate != null ? `${Number(m.metrics.engagementRate).toFixed(1)}%` : '—'} />
                    </div>
                </div>
            ) : null}

            {f ? (
                <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Follower growth</p>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <MetricCard index={10} label="Baseline followers" value={fmt(f.baseline)} sub={f.baselineDate ? new Date(f.baselineDate).toLocaleDateString() : ''} />
                        <MetricCard index={11} label="Current followers" value={fmt(f.currentCount)} />
                        <MetricCard index={12} label="Net new followers" value={`${Number(f.netNewFollowers || 0) >= 0 ? '+' : ''}${fmt(f.netNewFollowers)}`} accent={Number(f.netNewFollowers) > 0} />
                        <MetricCard index={13} label="Growth rate" value={f.growthRate != null ? `${Number(f.growthRate).toFixed(2)}%` : '—'} />
                    </div>
                    <p className="mt-3 text-[11px] font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Follower growth is measured from campaign start to now. Attribution is inferred, not exact.
                    </p>

                    {Array.isArray(f.dailyReadings) && f.dailyReadings.length > 1 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="mt-5 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.92)] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"
                        >
                            <p className="mb-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Daily follower count</p>
                            <div className="flex h-24 items-end gap-1">
                                {(() => {
                                    const readings = f.dailyReadings;
                                    const min = Math.min(...readings.map((r) => Number(r.count || 0)));
                                    const max = Math.max(...readings.map((r) => Number(r.count || 0)));
                                    const range = max - min || 1;
                                    return readings.map((r, index) => (
                                        <div
                                            key={`${r.date || index}-${index}`}
                                            className="min-h-[4px] flex-1 rounded-sm bg-stone-500 hover:bg-stone-400 transition-colors cursor-pointer"
                                            style={{ height: `${Math.round(((Number(r.count || 0) - min) / range) * 80) + 4}px` }}
                                            title={`${new Date(r.date).toLocaleDateString()}: ${Number(r.count || 0).toLocaleString()}`}
                                        />
                                    ));
                                })()}
                            </div>
                            <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 uppercase">
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
