'use client';

import { useState } from 'react';
import { useInstagramMetrics } from '../../hooks/useInstagramMetrics';

function token() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || localStorage.getItem('porchest_token') || '';
}

export default function InstagramConnect({ role = 'influencer' }) {
    const { metrics, loading, syncing, triggerSync, refetch } = useInstagramMetrics();
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

    async function handleDisconnect() {
        try {
            const endpoint = role === 'brand' ? '/brand/instagram/disconnect' : '/influencer/instagram/disconnect';
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}` },
            });
            await refetch();
        } catch {
            // Keep the UI resilient even if disconnect fails.
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
            <div className="rounded-[28px] border border-[#e8e1d4] bg-[#f8f3eb] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
                <div className="mb-4 flex flex-col gap-3 border-b border-[#e8e1d4] pb-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        {profileImage ? (
                            <img src={profileImage} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/70 shadow-sm" />
                        ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c79b6a] text-sm font-bold text-white shadow-sm">
                                IG
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-[#251d14]">@{metrics?.igUsername || 'instagram'}</p>
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                    Connected
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-[#7c6d58]">
                                Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                    <a
                        href={`https://instagram.com/${metrics?.igUsername || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="self-start rounded-full border border-[#e8e1d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#6a553f] transition hover:bg-[#faf7f1]"
                    >
                        View
                    </a>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93b88d]">Followers</p>
                        <p className="mt-2 text-2xl font-semibold text-[#2a241c]">{followerCount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93b88d]">Following</p>
                        <p className="mt-2 text-2xl font-semibold text-[#2a241c]">
                            {Number(metrics?.igFollowingCount ?? metrics?.followsCount ?? 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93b88d]">Posts</p>
                        <p className="mt-2 text-2xl font-semibold text-[#2a241c]">
                            {Number(metrics?.igMediaCount ?? metrics?.mediaCount ?? 0).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[#e8e1d4] bg-white p-4 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a7c68]">Engagement</p>
                        <p className="mt-1 text-lg font-semibold text-[#2a241c]">
                            {engagementValue != null
                                ? `${Number(engagementValue).toFixed(1)}%`
                                : '0.0%'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-[#e8e1d4] bg-white p-4 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a7c68]">Porchest score</p>
                        <p className="mt-1 text-lg font-semibold text-[#2a241c]">{porchestScore}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e8e1d4] bg-white p-4 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a7c68]">Status</p>
                        <p className="mt-1 text-lg font-semibold text-[#2a241c]">Ready</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex-1 rounded-xl bg-[#d8c0a7] px-4 py-2.5 text-sm font-semibold text-[#3c2d20] transition hover:bg-[#cfb28f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {syncing ? 'Syncing...' : 'Refresh Sync'}
                    </button>
                    <button
                        onClick={handleDisconnect}
                        disabled={connecting}
                        className="rounded-xl border border-[#e3d4c2] bg-white px-4 py-2.5 text-sm font-semibold text-[#a45f4b] transition hover:bg-[#fff8f3] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {connecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-[28px] border border-[#e8e1d4] bg-[#f8f3eb] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
            <p className="text-sm font-semibold text-[#251d14]">Connect your Instagram</p>
            <p className="mt-1 mb-4 text-sm text-[#7c6d58]">
                {role === 'brand'
                    ? 'Connect to track campaign follower growth and brand account performance.'
                    : 'Required to show your analytics to brands and appear in search results.'}
            </p>
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="rounded-xl bg-[#d8c0a7] px-5 py-2.5 text-sm font-semibold text-[#3c2d20] transition hover:bg-[#cfb28f] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {connecting ? 'Connecting...' : 'Connect Instagram'}
            </button>
        </div>
    );
}
