'use client';

import { motion } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

export default function InfluencerProfileMetrics({ influencerId }) {
    const { data, loading, error } = useApi(`/instagram/influencer/${influencerId}/metrics`);

    if (loading) return <div className="p-4 text-sm text-gray-400">Loading influencer data...</div>;
    if (error) return <div className="p-4 text-sm text-red-400">Could not load metrics: {error}</div>;
    if (!data) return null;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const fmtPct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);
    const fitScore = data.audienceBrandFitScore ?? null;
    const fitColor = fitScore == null ? 'text-gray-400' : fitScore >= 70 ? 'text-green-400' : fitScore >= 40 ? 'text-yellow-400' : 'text-red-400';
    const fitLabel = fitScore == null ? 'No fit data' : fitScore >= 70 ? 'Strong fit' : fitScore >= 40 ? 'Moderate fit' : 'Low fit';
    const audience = data.audienceDemographics || {};

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-4">
                {data.igProfileUrl ? (
                    <img
                        src={data.igProfileUrl}
                        alt=""
                        className="h-16 w-16 rounded-full border border-white/10 object-cover"
                    />
                ) : null}
                <div className="min-w-0">
                    <p className="text-lg font-medium text-white">@{data.igUsername || '—'}</p>
                    <p className="truncate text-xs capitalize text-gray-400">
                        {data.followerTier || '—'} {data.niche?.length ? `· ${data.niche.join(', ')}` : ''}
                    </p>
                    {data.country ? <p className="text-xs text-gray-500">{data.country}</p> : null}
                </div>
                {fitScore != null ? (
                    <div className="ml-auto text-right">
                        <p className={`text-3xl font-semibold ${fitColor}`}>{Math.round(fitScore)}</p>
                        <p className="text-xs text-gray-400">Audience fit</p>
                        <p className={`text-xs font-medium ${fitColor}`}>{fitLabel}</p>
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard index={0} label="Porchest score" value={`${Math.round(data.porchestScore ?? 0)} / 100`} accent />
                <MetricCard index={1} label="Followers" value={fmt(data.igFollowersCount)} />
                <MetricCard index={2} label="Engagement rate" value={fmtPct(data.avgEngagementRate)} sub="90 days" />
                <MetricCard index={3} label="Authenticity" value={`${Math.round(data.authenticityScore ?? 0)}%`} />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard index={4} label="Avg reach / post" value={fmt(data.avgReachPerPost)} />
                <MetricCard index={5} label="Avg saves / post" value={fmt(data.avgSavesPerPost)} />
                <MetricCard index={6} label="Posts / week" value={data.postingFrequency != null ? Number(data.postingFrequency).toFixed(1) : '—'} />
                <MetricCard index={7} label="Total reach (90d)" value={fmt(data.totalReach90d)} />
            </div>

            {audience ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gray-400">Top countries</p>
                        {(audience.topCountries || []).slice(0, 5).map((item, index) => (
                            <div key={`${item.country || 'country'}-${index}`} className="flex items-center justify-between border-b border-white/5 py-1.5 text-sm">
                                <span className="text-white">{item.country || item.name || '—'}</span>
                                <span className="text-gray-400">{Math.round(Number(item.value ?? item.pct ?? 0) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gray-400">Age & gender</p>
                        {Object.entries(audience.ageGender || {})
                            .sort((a, b) => Number(b[1]) - Number(a[1]))
                            .slice(0, 6)
                            .map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between border-b border-white/5 py-1.5 text-sm">
                                    <span className="text-white">{key}</span>
                                    <span className="text-gray-400">{Math.round(Number(val) * 100)}%</span>
                                </div>
                            ))}
                    </div>
                </motion.div>
            ) : null}
        </div>
    );
}
