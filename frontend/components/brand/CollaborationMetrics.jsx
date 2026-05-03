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

    if (loading) return <div style={{ padding: '24px', fontSize: '14px', fontWeight: 600, color: '#C4A882', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', textAlign: 'center', border: '1px solid #EDD9BC' }}>Loading campaign data...</div>;
    if (error) return <div style={{ padding: '24px', fontSize: '14px', fontWeight: 600, color: '#E8400A', background: 'rgba(232,64,10,0.06)', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(232,64,10,0.15)' }}>Could not load campaign data: {error}</div>;

    const m = metrics.data;
    const c = clicks.data;
    const f = followers.data;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const fmtMoney = (n) => (n == null ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    const fmtX = (n) => (n == null ? '—' : `${Number(n).toFixed(2)}x`);
    const windowStatus = m?.windowStatus || 'active';
    const statusColors = {
        active: { bg: 'rgba(16,185,129,0.1)', color: '#059669', border: 'rgba(16,185,129,0.2)' },
        grace_period: { bg: 'rgba(245,158,11,0.1)', color: '#d97706', border: 'rgba(245,158,11,0.2)' },
        completed: { bg: 'rgba(255,255,255,0.6)', color: '#7A5030', border: '#EDD9BC' },
    };

    const st = statusColors[windowStatus] || statusColors.active;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingTop: '16px', borderTop: '1px solid #EDD9BC' }}>
            {m ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '16px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.4)', padding: '20px' }} className="md:flex-row md:items-center md:justify-between">
                    <div>
                        <p style={{ fontWeight: 700, color: '#1A0A00', fontSize: '14px' }}>Campaign Window</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: '#7A5030' }}>
                            {m.campaignStartDate ? new Date(m.campaignStartDate).toLocaleDateString() : '—'} → {m.campaignEndDate ? new Date(m.campaignEndDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {m.daysRemaining > 0 ? <span style={{ fontSize: '12px', fontWeight: 700, color: '#C2340A' }}>{m.daysRemaining} days left</span> : null}
                        <span style={{ borderRadius: '99px', border: `1px solid ${st.border}`, background: st.bg, color: st.color, padding: '4px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {windowStatus.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            ) : null}

            {m ? <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#C4A882', fontWeight: 500 }}>{m.dataLabel}</p> : null}

            <div>
                <p style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7A5030' }}>Traffic</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <MetricCard index={0} label="Total clicks" value={fmt(c?.totalClicks)} sub="on tracking link" />
                    <MetricCard index={1} label="Unique visitors" value={fmt(c?.uniqueVisitors)} />
                    <MetricCard index={2} label="Click-through rate" value={c?.ctr != null ? `${Number(c.ctr).toFixed(1)}%` : '—'} />
                </div>
            </div>

            {m?.metrics?.conversions > 0 ? (
                <div>
                    <p style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7A5030' }}>Revenue & ROI</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <MetricCard index={3} label="Orders" value={fmt(m.metrics.conversions)} accent />
                        <MetricCard index={4} label="Total revenue" value={fmtMoney(m.metrics.revenue)} accent />
                        <MetricCard index={5} label="ROAS" value={fmtX(m.metrics.roas)} sub="revenue / influencer cost" />
                        <MetricCard index={6} label="Cost per order" value={fmtMoney(m.metrics.cpa)} />
                    </div>
                </div>
            ) : (
                <div style={{ borderRadius: '16px', border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.4)', padding: '24px', textAlign: 'center' }}>
                    <svg width="32" height="32" style={{ color: '#C4A882', margin: '0 auto 8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>No promo code purchases recorded yet</p>
                    <p style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: '#7A5030' }}>Make sure your checkout is calling the Porchest purchase webhook</p>
                </div>
            )}

            {m?.metrics?.reach > 0 ? (
                <div>
                    <p style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7A5030' }}>Post performance</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <MetricCard index={7} label="Post reach" value={fmt(m.metrics.reach)} />
                        <MetricCard index={8} label="Impressions" value={fmt(m.metrics.impressions)} />
                        <MetricCard index={9} label="Engagement rate" value={m.metrics.engagementRate != null ? `${Number(m.metrics.engagementRate).toFixed(1)}%` : '—'} />
                    </div>
                </div>
            ) : null}

            {f ? (
                <div>
                    <p style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7A5030' }}>Follower growth</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <MetricCard index={10} label="Baseline followers" value={fmt(f.baseline)} sub={f.baselineDate ? new Date(f.baselineDate).toLocaleDateString() : ''} />
                        <MetricCard index={11} label="Current followers" value={fmt(f.currentCount)} />
                        <MetricCard index={12} label="Net new followers" value={`${Number(f.netNewFollowers || 0) >= 0 ? '+' : ''}${fmt(f.netNewFollowers)}`} accent={Number(f.netNewFollowers) > 0} />
                        <MetricCard index={13} label="Growth rate" value={f.growthRate != null ? `${Number(f.growthRate).toFixed(2)}%` : '—'} />
                    </div>
                    <p style={{ marginTop: '12px', fontSize: '11px', fontWeight: 700, color: '#C4A882', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.4)', border: '1px solid #EDD9BC', padding: '10px', borderRadius: '8px' }}>
                        <svg width="14" height="14" style={{ color: '#C4A882' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Follower growth is measured from campaign start to now. Attribution is inferred, not exact.
                    </p>

                    {Array.isArray(f.dailyReadings) && f.dailyReadings.length > 1 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            style={{ marginTop: '20px', borderRadius: '24px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.4)', padding: '24px' }}
                        >
                            <p style={{ marginBottom: '16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030' }}>Daily follower count</p>
                            <div style={{ display: 'flex', height: '96px', alignItems: 'flex-end', gap: '4px' }}>
                                {(() => {
                                    const readings = f.dailyReadings;
                                    const min = Math.min(...readings.map((r) => Number(r.count || 0)));
                                    const max = Math.max(...readings.map((r) => Number(r.count || 0)));
                                    const range = max - min || 1;
                                    return readings.map((r, index) => (
                                        <div
                                            key={`${r.date || index}-${index}`}
                                            style={{ minHeight: '4px', flex: 1, borderRadius: '2px', background: 'rgba(194,52,10,0.5)', cursor: 'pointer', transition: 'background 0.15s', height: `${Math.round(((Number(r.count || 0) - min) / range) * 80) + 4}px` }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(194,52,10,0.8)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(194,52,10,0.5)'}
                                            title={`${new Date(r.date).toLocaleDateString()}: ${Number(r.count || 0).toLocaleString()}`}
                                        />
                                    ));
                                })()}
                            </div>
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#C4A882', textTransform: 'uppercase' }}>
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
