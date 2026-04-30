'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiPost, useApi } from '../../hooks/useApi';
import MetricCard from '../metrics/MetricCard';

export default function InstagramAnalytics() {
    const { data, loading, error, refetch } = useApi('/instagram/metrics');
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');

    async function handleSync() {
        setSyncing(true);
        setSyncMsg('');

        try {
            const result = await apiPost('/instagram/sync', {});

            if (result?.success) {
                setSyncMsg('Synced successfully');
                await refetch();
            } else if (typeof result?.error === 'string' && result.error.toLowerCase().includes('too recent')) {
                setSyncMsg('Sync too recent - try again later');
            } else {
                setSyncMsg(result?.error || result?.message || 'Sync failed');
            }
        } finally {
            setSyncing(false);
        }
    }

    if (loading) return <div className="p-6 text-sm text-gray-400">Loading analytics...</div>;
    if (error) return <div className="p-6 text-sm text-red-400">Could not load analytics: {error}</div>;
    if (!data) return null;

    const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
    const fmtPct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);
    const fmtScore = (n) => (n == null ? '—' : Math.round(Number(n)));
    const tier = data.followerTier || 'nano';
    const tierColors = {
        nano: 'text-gray-400',
        micro: 'text-sky-400',
        macro: 'text-purple-400',
        mega: 'text-amber-400',
    };

    const audience = data.audienceDemographics || data.audience || {};

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-lg font-medium text-white">Instagram analytics</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {data.igLastSyncedAt ? `Last synced ${new Date(data.igLastSyncedAt).toLocaleString()}` : 'Not yet synced'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {syncMsg ? <span className="text-xs text-gray-400">{syncMsg}</span> : null}
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="rounded-lg border border-purple-500/40 bg-purple-900/30 px-4 py-2 text-sm text-purple-300 transition-all hover:bg-purple-900/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {syncing ? 'Syncing...' : 'Sync now'}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                {data.igProfileUrl ? (
                    <img
                        src={data.igProfileUrl}
                        alt="profile"
                        className="h-14 w-14 rounded-full border border-white/10 object-cover"
                    />
                ) : null}
                <div className="min-w-0">
                    <p className="font-medium text-white">@{data.igUsername || '—'}</p>
                    <p className={`mt-0.5 text-xs font-medium capitalize ${tierColors[tier] || 'text-gray-400'}`}>
                        {tier} influencer
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{data.igBio || ''}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-2xl font-semibold text-white">{fmt(data.igFollowersCount)}</p>
                    <p className="text-xs text-gray-500">followers</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard index={0} label="Porchest score" value={`${fmtScore(data.porchestScore)} / 100`} accent />
                <MetricCard index={1} label="Engagement rate" value={fmtPct(data.avgEngagementRate)} sub="last 90 days" />
                <MetricCard index={2} label="Avg reach / post" value={fmt(data.avgReachPerPost)} sub="last 90 days" />
                <MetricCard index={3} label="Authenticity" value={`${fmtScore(data.authenticityScore)}%`} />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard index={4} label="Total reach (90d)" value={fmt(data.totalReach90d)} />
                <MetricCard index={5} label="Impressions (90d)" value={fmt(data.totalImpressions90d)} />
                <MetricCard index={6} label="Follower growth (90d)" value={`${data.followerGrowth90d >= 0 ? '+' : ''}${fmt(data.followerGrowth90d)}`} />
                <MetricCard index={7} label="Posts / week" value={data.postingFrequency != null ? Number(data.postingFrequency).toFixed(1) : '—'} />
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
                        <div className="space-y-2">
                            {(audience.topCountries || []).slice(0, 5).map((item, index) => (
                                <div key={`${item.country || 'country'}-${index}`} className="flex items-center gap-2">
                                    <span className="w-10 text-sm text-white">{item.country || item.name || '—'}</span>
                                    <div className="h-1.5 flex-1 rounded-full bg-white/10">
                                        <div
                                            className="h-1.5 rounded-full bg-purple-500"
                                            style={{ width: `${Math.max(0, Math.min(100, Math.round((Number(item.value ?? item.pct ?? 0) * 100))))}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-right text-xs text-gray-400">
                                        {Math.round(Number(item.value ?? item.pct ?? 0) * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gray-400">Top cities</p>
                        <div className="space-y-2">
                            {(audience.topCities || []).slice(0, 5).map((item, index) => (
                                <div key={`${item.city || 'city'}-${index}`} className="flex items-center gap-2">
                                    <span className="flex-1 truncate text-sm text-white">{item.city || item.name || '—'}</span>
                                    <div className="h-1.5 w-20 rounded-full bg-white/10">
                                        <div
                                            className="h-1.5 rounded-full bg-teal-500"
                                            style={{ width: `${Math.max(0, Math.min(100, Math.round((Number(item.value ?? item.pct ?? 0) * 100))))}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-right text-xs text-gray-400">
                                        {Math.round(Number(item.value ?? item.pct ?? 0) * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </div>
    );
}
