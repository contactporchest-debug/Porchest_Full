'use client';

import { useState } from 'react';
import { useInstagramMetrics } from '../../hooks/useInstagramMetrics';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function token() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || localStorage.getItem('porchest_token') || '';
}

export default function InstagramConnect({ role = 'influencer' }) {
    const { user, updateUser, refreshUser } = useAuth();
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
        setConnecting(true);
        try {
            const endpoint = role === 'brand' ? '/brand/instagram/disconnect' : '/influencer/instagram/disconnect';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (res.ok) {
                toast.success('Instagram disconnected successfully');
                if (refreshUser) await refreshUser();
                await refetch();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to disconnect Instagram');
            }
        } catch {
            toast.error('An error occurred while disconnecting');
        } finally {
            setConnecting(false);
        }
    }

    const connected = Boolean(metrics?.igUsername || metrics?.isConnected);
    const followerCount = Number(metrics?.igFollowersCount ?? metrics?.followersCount ?? metrics?.followers ?? 0);
    const lastSyncedAt = metrics?.igLastSyncedAt ?? metrics?.lastSyncedAt;
    const profileImage = metrics?.igProfileUrl ?? metrics?.profilePictureUrl ?? metrics?.profilePictureURL ?? '';
    const followingCount = Number(metrics?.igFollowingCount ?? metrics?.followingCount ?? metrics?.followsCount ?? 0);
    const postCount = Number(metrics?.igMediaCount ?? metrics?.mediaCount ?? metrics?.postsCount ?? 0);

    const sectionStyle = {
        borderRadius: '24px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.4)',
        padding: '24px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(26,10,0,0.02)'
    };

    const cardStyle = {
        borderRadius: '16px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.6)',
        padding: '16px'
    };

    if (loading) {
        return (
            <div style={sectionStyle}>
                <p style={{ fontSize: '14px', color: '#7A5030' }}>Checking Instagram connection...</p>
            </div>
        );
    }

    if (connected) {
        return (
            <div style={sectionStyle}>
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #EDD9BC' }} className="md:flex-row md:items-start md:justify-between">
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        {profileImage ? (
                            <img src={profileImage} alt="" style={{ height: '48px', width: '48px', borderRadius: '50%', objectCover: 'cover', border: '1px solid #EDD9BC' }} />
                        ) : (
                            <div style={{ display: 'flex', height: '48px', width: '48px', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#C2340A', fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                                IG
                            </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>@{metrics?.igUsername || 'instagram'}</p>
                                <span style={{ borderRadius: '99px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#059669' }}>
                                    Connected
                                </span>
                            </div>
                            <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>
                                Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                    <a
                        href={`https://instagram.com/${metrics?.igUsername || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ borderRadius: '99px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: '#1A0A00', textDecoration: 'none', transition: 'background-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}
                    >
                        View Profile
                    </a>
                </div>

                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div style={cardStyle}>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Followers</p>
                        <p style={{ marginTop: '8px', fontSize: '24px', fontWeight: 800, color: '#1A0A00' }}>{followerCount.toLocaleString()}</p>
                    </div>
                    <div style={cardStyle}>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Following</p>
                        <p style={{ marginTop: '8px', fontSize: '24px', fontWeight: 800, color: '#1A0A00' }}>{followingCount.toLocaleString()}</p>
                    </div>
                    <div style={cardStyle}>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Posts</p>
                        <p style={{ marginTop: '8px', fontSize: '24px', fontWeight: 800, color: '#1A0A00' }}>{postCount.toLocaleString()}</p>
                    </div>
                </div>

                <p style={{ marginTop: '12px', fontSize: '12px', color: '#7A5030' }}>Data refreshes automatically within 24 hours.</p>

                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={handleDisconnect}
                        disabled={connecting}
                        style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, color: '#1A0A00', cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.6 : 1, transition: 'background-color 0.15s' }}
                        onMouseEnter={e => { if (!connecting) e.currentTarget.style.background = '#fff' }}
                        onMouseLeave={e => { if (!connecting) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
                    >
                        {connecting ? 'Disconnecting...' : 'Disconnect Instagram'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A0A00' }}>Connect your Instagram</h3>
            <p style={{ marginTop: '4px', marginBottom: '16px', fontSize: '14px', color: '#7A5030', lineHeight: 1.5 }}>
                {role === 'brand'
                    ? 'Connect to track campaign follower growth and brand account performance.'
                    : 'Required to show your analytics to brands, engagement data, and appear in search results.'}
            </p>
            <button
                onClick={handleConnect}
                disabled={connecting}
                style={{ borderRadius: '12px', background: '#C2340A', padding: '12px 24px', fontSize: '14px', fontWeight: 700, color: '#fff', border: 'none', cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.6 : 1, transition: 'background-color 0.15s' }}
                onMouseEnter={e => { if (!connecting) e.currentTarget.style.background = '#E8400A' }}
                onMouseLeave={e => { if (!connecting) e.currentTarget.style.background = '#C2340A' }}
            >
                {connecting ? 'Connecting...' : 'Connect Instagram'}
            </button>
        </div>
    );
}
