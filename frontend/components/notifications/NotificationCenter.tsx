'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Clock3, ExternalLink, Inbox, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { brandAPI, influencerAPI } from '@/lib/api';

type Role = 'brand' | 'influencer';

type NotificationItem = {
    _id: string;
    type: string;
    title: string;
    message?: string;
    isRead: boolean;
    createdAt: string;
    senderName?: string;
    senderAvatar?: string;
    campaignRequestId?: string | { _id?: string };
};

const typeToneMap: Record<string, { label: string; bg: string; color: string }> = {
    collaboration_request: { label: 'Request', bg: 'rgba(194,52,10,0.10)', color: '#C2340A' },
    request_viewed: { label: 'Viewed', bg: 'rgba(245,158,11,0.12)', color: '#B45309' },
    request_accepted: { label: 'Accepted', bg: 'rgba(16,185,129,0.12)', color: '#047857' },
    request_rejected: { label: 'Rejected', bg: 'rgba(239,68,68,0.12)', color: '#B91C1C' },
    negotiation: { label: 'Negotiation', bg: 'rgba(59,130,246,0.12)', color: '#1D4ED8' },
    counter_offer: { label: 'Counter', bg: 'rgba(14,165,233,0.12)', color: '#0369A1' },
    deal_closed: { label: 'Deal', bg: 'rgba(124,58,237,0.12)', color: '#6D28D9' },
    request_cancelled: { label: 'Cancelled', bg: 'rgba(107,114,128,0.14)', color: '#4B5563' },
    request_expired: { label: 'Expired', bg: 'rgba(107,114,128,0.14)', color: '#4B5563' },
    cashout_requested: { label: 'Cashout', bg: 'rgba(245,158,11,0.12)', color: '#B45309' },
    cashout_approved: { label: 'Cashout', bg: 'rgba(16,185,129,0.12)', color: '#047857' },
    cashout_rejected: { label: 'Cashout', bg: 'rgba(239,68,68,0.12)', color: '#B91C1C' },
    system: { label: 'System', bg: 'rgba(100,116,139,0.12)', color: '#334155' },
};

function formatDate(input?: string) {
    if (!input) return 'Just now';
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function getPortalDestination(role: Role, item: NotificationItem) {
    const requestId = typeof item.campaignRequestId === 'string'
        ? item.campaignRequestId
        : item.campaignRequestId?._id;

    if (item.type.startsWith('cashout_')) {
        return role === 'influencer' ? '/dashboard/influencer/earnings' : '/dashboard/brand';
    }

    if (requestId) {
        return role === 'brand'
            ? `/dashboard/brand/collaborations?request=${requestId}`
            : `/dashboard/influencer/collaborations?request=${requestId}`;
    }

    return role === 'brand' ? '/dashboard/brand/collaborations' : '/dashboard/influencer/collaborations';
}

export default function NotificationCenter({ role }: { role: Role }) {
    const api = role === 'brand' ? brandAPI : influencerAPI;
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const loadNotifications = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await api.getNotifications({ limit: 100 });
            setNotifications(res.data?.notifications || []);
            setError(null);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to load notifications';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
    const filtered = useMemo(
        () => (filter === 'unread' ? notifications.filter((item) => !item.isRead) : notifications),
        [filter, notifications]
    );

    const markSingleRead = async (id: string) => {
        setMarkingId(id);
        try {
            await api.markNotificationRead(id);
            setNotifications((current) => current.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to mark notification as read');
        } finally {
            setMarkingId(null);
        }
    };

    const markAllRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
            toast.success('All notifications marked as read');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to mark all notifications as read');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    borderRadius: 20,
                    border: '1px solid rgba(194,52,10,0.14)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,248,241,0.94) 100%)',
                    boxShadow: '0 24px 60px rgba(124,63,34,0.08)',
                    padding: 24,
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(194,52,10,0.08)', border: '1px solid rgba(194,52,10,0.12)', marginBottom: 12 }}>
                            <Bell size={14} style={{ color: '#C2340A' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C2340A' }}>Notifications</span>
                        </div>
                        <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1, fontWeight: 800, color: '#1A0A00', letterSpacing: '-0.03em' }}>Notification center</h1>
                        <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: '#7A5030', maxWidth: 760 }}>
                            Keep track of collaboration requests, status changes, cashout updates, and system events without leaving the portal.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ minWidth: 120, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.72)', border: '1px solid #EDD9BC' }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#C4A882', textTransform: 'uppercase' }}>Unread</p>
                            <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 800, color: '#1A0A00' }}>{unreadCount}</p>
                        </div>
                        <button
                            onClick={() => void loadNotifications(true)}
                            disabled={refreshing}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                                border: '1px solid #EDD9BC',
                                background: 'rgba(255,255,255,0.74)',
                                color: '#7A5030',
                                borderRadius: 14,
                                padding: '12px 16px',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
                            Refresh
                        </button>
                        <button
                            onClick={() => void markAllRead()}
                            disabled={!unreadCount}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                                border: 'none',
                                background: unreadCount ? '#C2340A' : 'rgba(194,52,10,0.28)',
                                color: '#fff',
                                borderRadius: 14,
                                padding: '12px 16px',
                                cursor: unreadCount ? 'pointer' : 'not-allowed',
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                        >
                            <CheckCheck size={14} />
                            Mark all read
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                    {(['all', 'unread'] as const).map((item) => {
                        const active = filter === item;
                        return (
                            <button
                                key={item}
                                onClick={() => setFilter(item)}
                                style={{
                                    border: '1px solid',
                                    borderColor: active ? 'rgba(194,52,10,0.2)' : '#EDD9BC',
                                    background: active ? 'rgba(194,52,10,0.10)' : 'rgba(255,255,255,0.72)',
                                    color: active ? '#C2340A' : '#7A5030',
                                    borderRadius: 999,
                                    padding: '8px 14px',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {item === 'all' ? 'All notifications' : 'Unread only'}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {error && (
                <div style={{ borderRadius: 16, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(254,242,242,0.9)', padding: 16, color: '#991B1B', fontSize: 14 }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: 32, borderRadius: 18, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.7)', color: '#7A5030' }}>
                    Loading notifications...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '48px 24px', borderRadius: 18, border: '1px dashed #E4C8A3', background: 'rgba(255,255,255,0.66)', textAlign: 'center' }}>
                    <Inbox size={34} style={{ color: '#C4A882', margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1A0A00' }}>No notifications yet</p>
                    <p style={{ margin: '8px auto 0', fontSize: 14, color: '#7A5030', maxWidth: 540, lineHeight: 1.7 }}>
                        When collaboration requests, responses, cashout decisions, or system updates arrive, they will appear here.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                    {filtered.map((item, index) => {
                        const tone = typeToneMap[item.type] || typeToneMap.system;
                        const destination = getPortalDestination(role, item);
                        return (
                            <motion.article
                                key={item._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.04, 0.35) }}
                                style={{
                                    borderRadius: 18,
                                    border: item.isRead ? '1px solid #EDD9BC' : '1px solid rgba(194,52,10,0.18)',
                                    background: item.isRead ? 'rgba(255,255,255,0.72)' : 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,249,244,0.98) 100%)',
                                    boxShadow: item.isRead ? 'none' : '0 18px 36px rgba(124,63,34,0.08)',
                                    padding: 18,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 14,
                                }}
                            >
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 14,
                                        background: 'rgba(194,52,10,0.08)',
                                        display: 'grid',
                                        placeItems: 'center',
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                    }}>
                                        {item.senderAvatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.senderAvatar} alt={item.senderName || 'Sender'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Bell size={18} style={{ color: '#C2340A' }} />
                                        )}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                                            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1A0A00' }}>{item.title}</p>
                                            <span style={{ padding: '4px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                {tone.label}
                                            </span>
                                            {!item.isRead && (
                                                <span style={{ width: 8, height: 8, borderRadius: 999, background: '#E8400A', boxShadow: '0 0 0 4px rgba(232,64,10,0.12)' }} />
                                            )}
                                        </div>

                                        <p style={{ margin: 0, color: '#7A5030', fontSize: 14, lineHeight: 1.7 }}>
                                            {item.message || 'No message available.'}
                                        </p>

                                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 12, color: '#9C6F45' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <Clock3 size={13} />
                                                {formatDate(item.createdAt)}
                                            </span>
                                            {item.senderName && (
                                                <span>
                                                    From <strong style={{ color: '#7A5030' }}>{item.senderName}</strong>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <Link
                                            href={destination}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                borderRadius: 12,
                                                padding: '10px 14px',
                                                background: '#C2340A',
                                                color: '#fff',
                                                textDecoration: 'none',
                                                fontSize: 13,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Open related view
                                            <ExternalLink size={14} />
                                        </Link>
                                        {!item.isRead && (
                                            <button
                                                onClick={() => void markSingleRead(item._id)}
                                                disabled={markingId === item._id}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    borderRadius: 12,
                                                    padding: '10px 14px',
                                                    border: '1px solid #EDD9BC',
                                                    background: 'rgba(255,255,255,0.82)',
                                                    color: '#7A5030',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>

                                    <span style={{ fontSize: 12, color: '#C4A882' }}>
                                        {item.campaignRequestId ? 'Linked to a collaboration' : 'General update'}
                                    </span>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
