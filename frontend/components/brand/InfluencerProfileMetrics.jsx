'use client';

import { motion } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

export default function InfluencerProfileMetrics({ influencerId }) {
    const { data, loading, error } = useApi(`/instagram/influencer/${influencerId}/metrics`);

    if (loading) return <div className="p-6 text-sm font-bold text-white/40 bg-white/[0.03] rounded-[20px] text-center border border-white/[0.07]">Loading influencer metrics...</div>;
    if (error) return <div className="p-6 text-sm font-bold text-red-400 bg-red-500/[0.06] rounded-[20px] text-center border border-red-500/[0.12]">Could not load metrics: {error}</div>;
    if (!data) return null;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const fmtPct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);
    const fitScore = data.audienceBrandFitScore ?? null;
    const fitColor = fitScore == null ? 'text-white/40' : fitScore >= 70 ? 'text-green-500' : fitScore >= 40 ? 'text-amber-500' : 'text-red-500';
    const fitLabel = fitScore == null ? 'No fit data' : fitScore >= 70 ? 'Strong fit' : fitScore >= 40 ? 'Moderate fit' : 'Low fit';
    const audience = data.audienceDemographics || {};

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-5 p-5 bg-white/[0.03] border border-white/[0.07] rounded-[24px]">
                {data.igProfileUrl ? (
                    <img
                        src={data.igProfileUrl}
                        alt=""
                        className="h-16 w-16 rounded-[16px] border border-white/[0.08] object-cover shadow-sm"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                        {(data.igUsername || 'C')[0].toUpperCase()}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold text-white">@{data.igUsername || '—'}</p>
                    <p className="truncate text-sm font-medium capitalize text-white/50 mt-0.5">
                        {data.followerTier || '—'} {data.niche?.length ? `· ${data.niche.join(', ')}` : ''}
                    </p>
                    {data.country ? <p className="text-xs font-medium text-white/40 mt-1">{data.country}</p> : null}
                </div>
                {fitScore != null ? (
                    <div className="ml-auto text-right bg-white/[0.04] px-5 py-3 rounded-2xl border border-white/[0.08]">
                        <p className={`text-3xl font-black tracking-tight ${fitColor}`}>{Math.round(fitScore)}</p>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide mt-0.5">Audience fit</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${fitColor}`}>{fitLabel}</p>
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard index={0} label="Porchest score" value={`${Math.round(data.porchestScore ?? 0)} / 100`} accent />
                <MetricCard index={1} label="Followers" value={fmt(data.igFollowersCount)} />
                <MetricCard index={2} label="Engagement rate" value={fmtPct(data.avgEngagementRate)} sub="90 days" />
                <MetricCard index={3} label="Authenticity" value={`${Math.round(data.authenticityScore ?? 0)}%`} />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard index={4} label="Avg reach / post" value={fmt(data.avgReachPerPost)} />
                <MetricCard index={5} label="Avg saves / post" value={fmt(data.avgSavesPerPost)} />
                <MetricCard index={6} label="Posts / week" value={data.postingFrequency != null ? Number(data.postingFrequency).toFixed(1) : '—'} />
                <MetricCard index={7} label="Total reach (90d)" value={fmt(data.totalReach90d)} />
            </div>

            {audience && Object.keys(audience).length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2"
                >
                    {audience.topCountries?.length > 0 && (
                        <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] p-6 shadow-none">
                            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Top countries</p>
                            <div className="space-y-3">
                                {(audience.topCountries || []).slice(0, 5).map((item, index) => (
                                    <div key={`${item.country || 'country'}-${index}`} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/40">{index + 1}</div>
                                            <span className="text-sm font-bold text-white/80">{item.country || item.name || '—'}</span>
                                        </div>
                                        <span className="text-sm font-bold text-white/60 bg-white/[0.04] px-2.5 py-1 rounded-md">{Math.round(Number(item.value ?? item.pct ?? 0) * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {audience.ageGender && Object.keys(audience.ageGender).length > 0 && (
                        <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] p-6 shadow-none">
                            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Age & gender</p>
                            <div className="space-y-3">
                                {Object.entries(audience.ageGender || {})
                                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                                    .slice(0, 5)
                                    .map(([key, val], index) => {
                                        let iconColor = 'text-white/40';
                                        if (key.includes('F')) iconColor = 'text-pink-500';
                                        if (key.includes('M')) iconColor = 'text-blue-500';
                                        
                                        return (
                                            <div key={key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-bold text-xs ${iconColor}`}>
                                                        {key.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-white/80">{key.replace(/^[FM]\./, '')}</span>
                                                </div>
                                                <span className="text-sm font-bold text-white/60 bg-white/[0.04] px-2.5 py-1 rounded-md">{Math.round(Number(val) * 100)}%</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </motion.div>
            ) : null}
        </div>
    );
}
