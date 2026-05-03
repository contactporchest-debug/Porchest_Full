'use client';

import { useState } from 'react';
import { useInstagramMetrics } from '../../hooks/useInstagramMetrics';

function token() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || localStorage.getItem('porchest_token') || '';
}

export default function InstagramConnect({ role = 'influencer' }) {
    const { metrics, loading, refetch } = useInstagramMetrics();
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
            // Keep the card interactive even if the request fails.
        } finally {
            setConnecting(false);
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
            // Ignore disconnect errors here.
        }
    }

    const connected = Boolean(metrics?.igUsername || metrics?.isConnected);
    const followerCount = Number(metrics?.igFollowersCount ?? metrics?.followersCount ?? metrics?.followers ?? 0);
    const lastSyncedAt = metrics?.igLastSyncedAt ?? metrics?.lastSyncedAt;
    const profileImage = metrics?.igProfileUrl ?? metrics?.profilePictureUrl ?? metrics?.profilePictureURL ?? '';
    const followingCount = Number(metrics?.igFollowingCount ?? metrics?.followingCount ?? metrics?.followsCount ?? 0);
    const postCount = Number(metrics?.igMediaCount ?? metrics?.mediaCount ?? metrics?.postsCount ?? 0);

    if (loading) {
        return (
            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5">
                <p className="text-sm text-gray-400">Checking Instagram connection...</p>
            </div>
        );
    }

    if (connected) {
        return (
            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5">
                <div className="mb-4 flex flex-col gap-3 border-b border-[#2A2A30] pb-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        {profileImage ? (
                            <img src={profileImage} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-[#2A2A30]" />
                        ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                                IG
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-white">@{metrics?.igUsername || 'instagram'}</p>
                                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                                    Connected
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                                Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                    <a
                        href={`https://instagram.com/${metrics?.igUsername || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="self-start rounded-full border border-[#2A2A30] bg-[#202025] px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-[#2A2A30]"
                    >
                        View
                    </a>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Followers</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{followerCount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Following</p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                            {followingCount.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Posts</p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                            {postCount.toLocaleString()}
                        </p>
                    </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">Everything refreshes automatically within 24 hours.</p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                        onClick={handleDisconnect}
                        disabled={connecting}
                        className="rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-[#2A2A30] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {connecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5">
            <p className="text-sm font-semibold text-white">Connect your Instagram</p>
            <p className="mt-1 mb-4 text-sm text-gray-400">
                {role === 'brand'
                    ? 'Connect to track campaign follower growth and brand account performance.'
                    : 'Required to show your analytics to brands and appear in search results.'}
            </p>
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {connecting ? 'Connecting...' : 'Connect Instagram'}
            </button>
        </div>
    );
}
