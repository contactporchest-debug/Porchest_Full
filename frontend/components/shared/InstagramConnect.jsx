'use client';

import { useState } from 'react';
import { useApi, apiPost } from '../../hooks/useApi';

function token() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || localStorage.getItem('porchest_token') || '';
}

export default function InstagramConnect({ role = 'influencer' }) {
    const { data: metrics, refetch } = useApi('/instagram/metrics');
    const [syncing, setSyncing] = useState(false);
    const [connecting, setConnecting] = useState(false);

    async function handleConnect() {
        setConnecting(true);
        const endpoint = role === 'brand' ? '/brand/instagram/connect' : '/influencer/instagram/connect';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        if (data.authURL) window.location.href = data.authURL;
        setConnecting(false);
    }

    async function handleSync() {
        setSyncing(true);
        await apiPost('/instagram/sync', {});
        await refetch();
        setSyncing(false);
    }

    if (metrics?.igUsername) {
        return (
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {metrics.igProfileUrl && (
                            <img src={metrics.igProfileUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        )}
                        <div>
                            <p className="text-white text-sm font-medium">@{metrics.igUsername}</p>
                            <p className="text-xs text-green-400">Instagram connected</p>
                            <p className="text-xs text-gray-500">
                                Last synced: {metrics.igLastSyncedAt ? new Date(metrics.igLastSyncedAt).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="text-sm px-4 py-2 rounded-lg border border-stone-500/10 bg-stone-900/30 text-stone-300 hover:bg-stone-900/50 disabled:opacity-40 transition-all"
                    >
                        {syncing ? 'Syncing...' : 'Sync now'}
                    </button>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <p className="text-white font-semibold">{metrics.igFollowersCount?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold">{metrics.avgEngagementRate != null ? `${Number(metrics.avgEngagementRate).toFixed(1)}%` : '0.0%'}</p>
                        <p className="text-xs text-gray-500">Eng. rate</p>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold">{metrics.porchestScore ?? 0}</p>
                        <p className="text-xs text-gray-500">Porchest score</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 rounded-xl border border-stone-500/10 bg-stone-900/20">
            <p className="text-white font-medium">Connect your Instagram</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
                {role === 'brand'
                    ? 'Connect to track campaign follower growth and brand account performance.'
                    : 'Required to show your analytics to brands and appear in search results.'}
            </p>
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-5 py-2.5 rounded-lg bg-stone-700 hover:bg-stone-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
                {connecting ? 'Connecting...' : 'Connect Instagram'}
            </button>
        </div>
    );
}
