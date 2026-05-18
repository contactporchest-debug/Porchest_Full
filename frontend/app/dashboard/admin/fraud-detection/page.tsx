'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Loader2,
    RefreshCw,
    Search,
    ShieldAlert,
    Sparkles,
    UserMinus,
    UserPlus,
    Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';

type FraudLevel = 'clean' | 'review' | 'suspicious' | 'high_risk';
type FraudStatus = 'clean' | 'review' | 'verification_requested' | 'flagged';

type FraudRecord = {
    userId: string;
    profileId: string | null;
    email: string;
    role: string;
    status: string;
    fullName: string;
    username: string;
    profilePictureUrl: string;
    followersCount: number;
    followingCount: number;
    mediaCount: number;
    createdAt: string | null;
    profileComplete: boolean;
    verified: boolean;
    fraudDetection: {
        score: number;
        level: FraudLevel;
        status: FraudStatus;
        flags: string[];
        details?: {
            followers?: number;
            following?: number;
            followerFollowingRatio?: number | null;
            mediaCount?: number;
            profilePictureExists?: boolean;
            engagementPerPost?: number;
            engagementRatio?: number;
            accountAgeDays?: number | null;
            username?: string;
        } | null;
        analyzedAt?: string | null;
        verificationRequestedAt?: string | null;
        flaggedAt?: string | null;
        flagReason?: string;
    };
};

type FraudResponse = {
    influencers: FraudRecord[];
    newInfluencers: FraudRecord[];
    suspiciousInfluencers: FraudRecord[];
    summary: {
        total: number;
        newRegistrations: number;
        suspicious: number;
        flagged: number;
        verificationRequested: number;
        clean: number;
    };
    range?: {
        registeredFrom: string | null;
        registeredTo: string | null;
    };
};

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
}

function formatRelativeDays(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
    return `${diff}d`;
}

function toDateInput(value: Date) {
    return value.toISOString().slice(0, 10);
}

function levelMeta(level: FraudLevel) {
    switch (level) {
        case 'high_risk':
            return { label: 'High risk', bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.20)' };
        case 'suspicious':
            return { label: 'Suspicious', bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.20)' };
        case 'review':
            return { label: 'Review', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.20)' };
        default:
            return { label: 'Clean', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.20)' };
    }
}

function statusMeta(status: FraudStatus) {
    switch (status) {
        case 'verification_requested':
            return { label: 'Verification requested', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.20)' };
        case 'flagged':
            return { label: 'Flagged', bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.20)' };
        case 'review':
            return { label: 'Under review', bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.20)' };
        default:
            return { label: 'Clean', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.20)' };
    }
}

function Badge({
    label,
    bg,
    color,
    border,
}: {
    label: string;
    bg: string;
    color: string;
    border: string;
}) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: bg,
                color,
                border: `1px solid ${border}`,
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </span>
    );
}

function MetricCard({
    label,
    value,
    sub,
    icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.42)',
                backdropFilter: 'blur(12px)',
                border: '1px solid #EDD9BC',
                borderRadius: 22,
                padding: 22,
                boxShadow: '0 4px 20px rgba(26,10,0,0.02)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.75)', border: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2340A' }}>
                    {icon}
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            </div>
            <p style={{ fontSize: 30, fontWeight: 900, color: '#1A0A00', lineHeight: 1 }}>{value}</p>
            {sub ? <p style={{ marginTop: 6, fontSize: 13, color: '#C4A882', fontWeight: 500 }}>{sub}</p> : null}
        </motion.div>
    );
}

function Avatar({ record }: { record: FraudRecord }) {
    if (record.profilePictureUrl) {
        return (
            <img
                src={record.profilePictureUrl}
                alt={record.fullName || record.username || record.email}
                style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }}
            />
        );
    }
    return (
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#C2340A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
            {(record.fullName || record.username || record.email || '?')[0]?.toUpperCase()}
        </div>
    );
}

export default function FraudDetectionPage() {
    const [records, setRecords] = useState<FraudRecord[]>([]);
    const [newRecords, setNewRecords] = useState<FraudRecord[]>([]);
    const [suspiciousRecords, setSuspiciousRecords] = useState<FraudRecord[]>([]);
    const [summary, setSummary] = useState<FraudResponse['summary'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [search, setSearch] = useState('');
    const [registeredFrom, setRegisteredFrom] = useState(() => toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
    const [registeredTo, setRegisteredTo] = useState(() => toDateInput(new Date()));
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getFraudDetection({
                search: search.trim() || undefined,
                registeredFrom,
                registeredTo,
            });
            const payload: FraudResponse = response.data;
            setRecords(payload.influencers || []);
            setNewRecords(payload.newInfluencers || []);
            setSuspiciousRecords(payload.suspiciousInfluencers || []);
            setSummary(payload.summary || null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to load fraud data.');
        } finally {
            setLoading(false);
        }
    }, [registeredFrom, registeredTo, search]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const runAnalysis = async () => {
        try {
            setAnalyzing(true);
            await adminAPI.analyzeFraudDetection({
                search: search.trim() || undefined,
            });
            toast.success('Fraud analysis completed.');
            await loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to analyze fraud.');
        } finally {
            setAnalyzing(false);
        }
    };

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const clearSelection = () => setSelectedIds([]);

    const toggleSelectAllSuspicious = () => {
        const suspiciousIds = filteredSuspiciousRecords.map((record) => record.userId);
        if (!suspiciousIds.length) return;

        const allSuspiciousSelected = suspiciousIds.every((id) => selectedSet.has(id));
        setSelectedIds((prev) => {
            if (allSuspiciousSelected) {
                return prev.filter((id) => !suspiciousIds.includes(id));
            }
            return Array.from(new Set([...prev, ...suspiciousIds]));
        });
    };

    const requestVerification = async (ids: string[]) => {
        if (!ids.length) return;
        try {
            await adminAPI.requestFraudVerification({
                influencerIds: ids,
            });
            toast.success('Verification request sent.');
            clearSelection();
            await loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to request verification.');
        }
    };

    const flagInfluencers = async (ids: string[], record?: FraudRecord) => {
        if (!ids.length) return;
        const defaultReason = record?.fraudDetection.flags?.length
            ? record.fraudDetection.flags.join(', ')
            : 'Flagged after fraud review.';
        const reason = window.prompt('Flag reason', defaultReason) || defaultReason;
        const confirmed = window.confirm(`Flag ${ids.length} influencer${ids.length === 1 ? '' : 's'} and suspend access?`);
        if (!confirmed) return;

        try {
            await adminAPI.flagFraudInfluencers({
                influencerIds: ids,
                reason,
            });
            toast.success('Influencer(s) flagged.');
            clearSelection();
            await loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to flag influencers.');
        }
    };

    const hardDeleteInfluencers = async (ids: string[]) => {
        if (!ids.length) return;

        const lookup = new Map(records.map((record) => [record.userId, record]));
        suspiciousRecords.forEach((record) => lookup.set(record.userId, record));

        const selectedRecords = ids.map((id) => lookup.get(id)).filter((record): record is FraudRecord => Boolean(record));
        const flaggedRecords = selectedRecords.filter((record) => record.fraudDetection.status === 'flagged' && record.status === 'suspended');

        if (!flaggedRecords.length) {
            toast.error('Only flagged and suspended accounts can be permanently deleted.');
            return;
        }

        if (flaggedRecords.length !== selectedRecords.length) {
            toast.error('Please deselect accounts that are not flagged and suspended.');
            return;
        }

        const confirmed = window.confirm(
            `Permanently delete ${flaggedRecords.length} flagged account${flaggedRecords.length === 1 ? '' : 's'}? This cannot be undone.`
        );
        if (!confirmed) return;

        const typed = window.prompt('Type DELETE to confirm permanent removal.');
        if (typed !== 'DELETE') return;

        try {
            await adminAPI.hardDeleteFraudInfluencers({ influencerIds: ids });
            toast.success('Flagged account(s) permanently deleted.');
            clearSelection();
            await loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to delete flagged accounts.');
        }
    };

    const filteredRecords = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return records;
        return records.filter((record) => {
            const haystack = [
                record.fullName,
                record.username,
                record.email,
                record.fraudDetection.flags.join(' '),
                String(record.fraudDetection.score),
                record.fraudDetection.status,
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [records, search]);

    const filteredNewRecords = useMemo(() => {
        const q = search.trim().toLowerCase();
        return newRecords.filter((record) => {
            const haystack = [record.fullName, record.username, record.email].join(' ').toLowerCase();
            return !q || haystack.includes(q);
        });
    }, [newRecords, search]);

    const filteredSuspiciousRecords = useMemo(() => {
        const q = search.trim().toLowerCase();
        return suspiciousRecords.filter((record) => {
            const haystack = [record.fullName, record.username, record.email, record.fraudDetection.flags.join(' ')].join(' ').toLowerCase();
            return !q || haystack.includes(q);
        });
    }, [search, suspiciousRecords]);

    const selectedFlaggedRecords = useMemo(() => {
        const lookup = new Map(records.map((record) => [record.userId, record]));
        suspiciousRecords.forEach((record) => lookup.set(record.userId, record));
        return selectedIds
            .map((id) => lookup.get(id))
            .filter((record): record is FraudRecord => Boolean(record))
            .filter((record) => record.fraudDetection.status === 'flagged' && record.status === 'suspended');
    }, [records, selectedIds, suspiciousRecords]);

    const canHardDelete = (record: FraudRecord) => record.fraudDetection.status === 'flagged' && record.status === 'suspended';

    const renderTable = (rows: FraudRecord[], emptyCopy: string, showEmptyState = true) => {
        if (!rows.length && showEmptyState) {
            return (
                <div style={{ padding: 32, textAlign: 'center', color: '#7A5030', fontSize: 14 }}>
                    {emptyCopy}
                </div>
            );
        }

        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1040 }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.55)' }}>
                            {['Select', 'Influencer', 'Score', 'Flags', 'Registered', 'Status', 'Actions'].map((heading) => (
                                <th key={heading} style={{ textAlign: 'left', padding: '16px 18px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A5030', fontWeight: 700, borderBottom: '1px solid #EDD9BC' }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((record, index) => {
                            const level = levelMeta(record.fraudDetection.level);
                            const status = statusMeta(record.fraudDetection.status);
                            const isSelected = selectedSet.has(record.userId);
                            const score = record.fraudDetection.score;
                            const rowBg = score >= 75 ? 'rgba(239,68,68,0.04)' : score >= 50 ? 'rgba(245,158,11,0.04)' : index % 2 === 0 ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.48)';

                            return (
                                <tr key={record.userId} style={{ background: rowBg }}>
                                    <td style={{ padding: '16px 18px', borderBottom: '1px solid rgba(237,217,188,0.8)', verticalAlign: 'top' }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelected(record.userId)}
                                            style={{ width: 16, height: 16, accentColor: '#C2340A' }}
                                        />
                                    </td>
                                    <td style={{ padding: '16px 18px', borderBottom: '1px solid rgba(237,217,188,0.8)', verticalAlign: 'top' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Avatar record={record} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>{record.fullName || record.email}</p>
                                                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>@{record.username || 'unknown'} · {record.email}</p>
                                                <p style={{ marginTop: 4, fontSize: 12, color: '#7A5030' }}>
                                                    {record.followersCount.toLocaleString()} followers · {record.followingCount.toLocaleString()} following · {record.mediaCount.toLocaleString()} posts
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 18px', borderBottom: '1px solid rgba(237,217,188,0.8)', verticalAlign: 'top' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <Badge label={`${score}/100`} bg={level.bg} color={level.color} border={level.border} />
                                            <Badge label={level.label} bg="rgba(255,255,255,0.55)" color="#7A5030" border="#EDD9BC" />
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 18px', borderBottom: '1px solid rgba(237,217,188,0.8)', verticalAlign: 'top' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 320 }}>
                                            {record.fraudDetection.flags.length ? record.fraudDetection.flags.map((flag) => (
                                                <span key={`${record.userId}-${flag}`} style={{ padding: '5px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.55)', border: '1px solid #EDD9BC', color: '#7A5030', fontSize: 11, fontWeight: 700 }}>
                                                    {flag}
                                                </span>
                                            )) : (
                                                <span style={{ color: '#C4A882', fontSize: 12 }}>No flags yet</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 18px', borderBottom: '1px solid rgba(237,217,188,0.8)', verticalAlign: 'top', color: '#7A5030', fontSize: 13 }}>
                                        <div>{formatDate(record.createdAt)}</div>
                                        <div style={{ marginTop: 4, color: '#C4A882' }}>~{formatRelativeDays(record.createdAt)} ago</div>
                                    </td>
                                    <td style={{ padding: '16px 18px', borderBottom: '1px solid rgba(237,217,188,0.8)', verticalAlign: 'top' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <Badge {...status} />
                                            <span style={{ fontSize: 12, color: '#7A5030' }}>
                                                {record.profileComplete ? 'Profile complete' : 'Profile incomplete'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 18px', borderBottom: '1px solid rgba(237,217,188,0.8)', verticalAlign: 'top' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            <button
                                                type="button"
                                                onClick={() => requestVerification([record.userId])}
                                                className="px-4 py-2 rounded-full bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#0284c7] text-xs font-bold hover:bg-[rgba(255,255,255,0.75)] transition-colors"
                                            >
                                                Request Verification
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => flagInfluencers([record.userId], record)}
                                                className="px-4 py-2 rounded-full bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.20)] text-[#dc2626] text-xs font-bold hover:bg-[rgba(239,68,68,0.14)] transition-colors"
                                            >
                                                Flag
                                            </button>
                                            {canHardDelete(record) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void hardDeleteInfluencers([record.userId])}
                                                    className="px-4 py-2 rounded-full bg-[rgba(127,29,29,0.08)] border border-[rgba(127,29,29,0.18)] text-[#991b1b] text-xs font-bold hover:bg-[rgba(127,29,29,0.12)] transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(255,255,255,0.38)',
                            border: '1px solid rgba(255,255,255,0.65)',
                            borderRadius: 20,
                            padding: 28,
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <p style={{ textTransform: 'uppercase', letterSpacing: '0.25em', color: '#7A5030', fontSize: 12, fontWeight: 700 }}>Admin portal</p>
                        <h1 style={{ marginTop: 8, fontSize: 36, fontWeight: 900, color: '#1A0A00' }}>Fraud Detection</h1>
                        <p style={{ marginTop: 10, color: '#7A5030', lineHeight: 1.7, maxWidth: 920 }}>
                            Review all influencers, inspect recent signups by date, run a fraud scan, and then request verification or flag accounts for suspension.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <MetricCard label="Influencers" value={summary?.total ?? '—'} icon={<Users size={18} />} />
                        <MetricCard label="New registrations" value={summary?.newRegistrations ?? '—'} icon={<UserPlus size={18} />} />
                        <MetricCard label="Suspicious" value={summary?.suspicious ?? '—'} icon={<ShieldAlert size={18} />} />
                        <MetricCard label="Verification requested" value={summary?.verificationRequested ?? '—'} icon={<CheckCircle2 size={18} />} />
                        <MetricCard label="Flagged" value={summary?.flagged ?? '—'} icon={<UserMinus size={18} />} />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#C4A882' }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search influencer, email, or fraud flag"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 40px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #EDD9BC',
                                    color: '#1A0A00',
                                    fontSize: 14,
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registered from</span>
                            <input
                                type="date"
                                value={registeredFrom}
                                onChange={(e) => setRegisteredFrom(e.target.value)}
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #EDD9BC',
                                    color: '#1A0A00',
                                    fontSize: 14,
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                }}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registered to</span>
                            <input
                                type="date"
                                value={registeredTo}
                                onChange={(e) => setRegisteredTo(e.target.value)}
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #EDD9BC',
                                    color: '#1A0A00',
                                    fontSize: 14,
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                }}
                            />
                        </label>
                        <button
                            onClick={() => void loadData()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '12px 18px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.8)',
                                border: '1px solid #EDD9BC',
                                color: '#1A0A00',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                        <button
                            onClick={() => void runAnalysis()}
                            disabled={analyzing}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '12px 18px',
                                borderRadius: 12,
                                background: '#C2340A',
                                border: '1px solid #C2340A',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: 14,
                                cursor: analyzing ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                opacity: analyzing ? 0.7 : 1,
                            }}
                        >
                            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Analyze fraud
                        </button>
                    </div>

                    {selectedIds.length > 0 ? (
                        <div style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', borderRadius: 18, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>{selectedIds.length} selected</p>
                                <p style={{ fontSize: 12, color: '#7A5030', marginTop: 4 }}>Run a bulk verification request or flag the selected accounts.</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => void requestVerification(selectedIds)}
                                    className="px-4 py-2 rounded-full bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#0284c7] text-xs font-bold hover:bg-[rgba(255,255,255,0.75)] transition-colors"
                                >
                                    Request Verification
                                </button>
                                <button
                                    onClick={() => void flagInfluencers(selectedIds, suspiciousRecords.find((record) => selectedIds.includes(record.userId)))}
                                    className="px-4 py-2 rounded-full bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.20)] text-[#dc2626] text-xs font-bold hover:bg-[rgba(239,68,68,0.14)] transition-colors"
                                >
                                    Flag selected
                                </button>
                                <button
                                    onClick={() => void hardDeleteInfluencers(selectedIds)}
                                    disabled={!selectedFlaggedRecords.length || selectedFlaggedRecords.length !== selectedIds.length}
                                    className="px-4 py-2 rounded-full bg-[rgba(127,29,29,0.08)] border border-[rgba(127,29,29,0.18)] text-[#991b1b] text-xs font-bold hover:bg-[rgba(127,29,29,0.12)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hard delete flagged
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-4 py-2 rounded-full bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#7A5030] text-xs font-bold hover:bg-[rgba(255,255,255,0.75)] transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {loading ? (
                        <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A5030', gap: 12 }}>
                            <Loader2 size={18} className="animate-spin" />
                            Loading fraud data...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid #EDD9BC', borderRadius: 24, overflow: 'hidden', backdropFilter: 'blur(12px)' }}
                            >
                                <div style={{ padding: '18px 22px', borderBottom: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>Likely fake or fraud accounts</h2>
                                        <p style={{ marginTop: 4, fontSize: 13, color: '#7A5030' }}>Accounts scoring 50+ or already flagged by an admin review.</p>
                                    </div>
                                    <Badge {...levelMeta('suspicious')} />
                                </div>
                                <div style={{ padding: '0 22px 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={toggleSelectAllSuspicious}
                                        className="px-4 py-2 rounded-full bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#7A5030] text-xs font-bold hover:bg-[rgba(255,255,255,0.75)] transition-colors"
                                    >
                                        {filteredSuspiciousRecords.length > 0 && filteredSuspiciousRecords.every((record) => selectedSet.has(record.userId))
                                            ? 'Clear suspicious selection'
                                            : 'Select all suspicious'}
                                    </button>
                                </div>
                                {renderTable(filteredSuspiciousRecords, 'No suspicious accounts found for the current filters.')}
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid #EDD9BC', borderRadius: 24, overflow: 'hidden', backdropFilter: 'blur(12px)' }}
                            >
                                <div style={{ padding: '18px 22px', borderBottom: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>New registered influencers</h2>
                                        <p style={{ marginTop: 4, fontSize: 13, color: '#7A5030' }}>
                                            Filtered by your selected date period, from {registeredFrom || 'start'} to {registeredTo || 'today'}.
                                        </p>
                                    </div>
                                    <Badge label="Date filtered" bg="rgba(56,189,248,0.10)" color="#0284c7" border="rgba(56,189,248,0.20)" />
                                </div>
                                {renderTable(filteredNewRecords, 'No new registrations in the selected period.')}
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid #EDD9BC', borderRadius: 24, overflow: 'hidden', backdropFilter: 'blur(12px)' }}
                            >
                                <div style={{ padding: '18px 22px', borderBottom: '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>All influencers</h2>
                                        <p style={{ marginTop: 4, fontSize: 13, color: '#7A5030' }}>Use the scan to refresh fraud scores and review each account individually.</p>
                                    </div>
                                    <Badge label={`${records.length} total`} bg="rgba(255,255,255,0.55)" color="#7A5030" border="#EDD9BC" />
                                </div>
                                {renderTable(filteredRecords, 'No influencers found for the current search.')}
                            </motion.section>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
