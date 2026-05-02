'use client';

import { useState } from 'react';
import { useInstagramMetrics } from '../../hooks/useInstagramMetrics';

function token() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || localStorage.getItem('porchest_token') || '';
}

export default function InstagramConnect({ role = 'influencer' }) {
    const { metrics, loading, syncing, triggerSync } = useInstagramMetrics();
    const [connecting, setConnecting] = useState(false);

    async function handleConnect() {
        setConnecting(true);
        try {
            const endpoint = role === 'brand' ? '/brand/instagram/connect' : '/influencer/instagram/connect';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (data.authURL) window.location.href = data.authURL;
        } catch {
            // Leave the CTA available; higher-level pages can surface errors if needed.
        } finally {
            setConnecting(false);
        }
    }

    async function handleSync() {
        try {
            await triggerSync();
        } catch {
            // The hook surfaces its own error state; the UI keeps working either way.
        }
    }

    const connected = Boolean(metrics?.igUsername || metrics?.isConnected);
    const followerCount = Number(metrics?.igFollowersCount ?? metrics?.followersCount ?? 0);
    const engagementValue = metrics?.avgEngagementRate ?? metrics?.engagementRate;
    const porchestScore = metrics?.porchestScore ?? metrics?.influencerScore ?? 0;
    const lastSyncedAt = metrics?.igLastSyncedAt ?? metrics?.lastSyncedAt;
    const profileImage = metrics?.igProfileUrl ?? metrics?.profilePictureURL ?? metrics?.profilePictureUrl;

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-white/50">Checking Instagram connection...</p>
            </div>
        );
    }

    if (connected) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-3">
                        {profileImage && (
                            <img src={profileImage} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10" />
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">@{metrics?.igUsername || 'instagram'}</p>
                            <p className="text-xs text-emerald-400">Instagram connected</p>
                            <p className="text-xs text-white/45">
                                Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {syncing ? 'Syncing...' : 'Sync now'}
                        </button>
                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="rounded-xl bg-gradient-to-r from-[#8f6a45] to-[#c79b6a] px-4 py-2.5 text-sm font-semibold text-white transition-shadow hover:shadow-[0_16px_32px_rgba(199,155,106,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {connecting ? 'Connecting...' : 'Reconnect'}
                        </button>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Followers</p>
                        <p className="mt-1 text-lg font-semibold text-white">{followerCount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Engagement</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                            {engagementValue != null
                                ? `${Number(engagementValue).toFixed(1)}%`
                                : '0.0%'}
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Porchest score</p>
                        <p className="mt-1 text-lg font-semibold text-white">{porchestScore}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <p className="text-sm font-semibold text-white">Connect your Instagram</p>
            <p className="mt-1 mb-4 text-sm text-white/45">
                {role === 'brand'
                    ? 'Connect to track campaign follower growth and brand account performance.'
                    : 'Required to show your analytics to brands and appear in search results.'}
            </p>
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="rounded-xl bg-gradient-to-r from-[#8f6a45] to-[#c79b6a] px-5 py-2.5 text-sm font-semibold text-white transition-shadow hover:shadow-[0_16px_32px_rgba(199,155,106,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {connecting ? 'Connecting...' : 'Connect Instagram'}
            </button>
        </div>
    );
}
