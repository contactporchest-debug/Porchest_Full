'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CollaborationMetrics from '@/components/brand/CollaborationMetrics';
import { adminAPI } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { isAdminRole } from '@/lib/accessRoles';
import toast from 'react-hot-toast';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Loader2,
    PlayCircle,
    Search,
    ShieldAlert,
    SquareArrowOutUpRight,
    StopCircle,
    Users,
} from 'lucide-react';

type CollaborationStatus =
    | 'pending'
    | 'countered'
    | 'brand_payment_pending'
    | 'brand_paid_work_can_start'
    | 'campaign_active'
    | 'content_submitted'
    | 'content_approved'
    | 'posted'
    | 'completed'
    | 'declined'
    | 'cancelled'
    | string;

interface CollaborationItem {
    _id: string;
    status: CollaborationStatus;
    campaignTitle?: string;
    campaignDescription?: string;
    agreedPrice?: number;
    pricing?: {
        agreedFee?: number;
        brandOffer?: number;
        influencerCounter?: number;
        currency?: string;
    };
    brandName?: string;
    influencerName?: string;
    influencerUsername?: string;
    influencerNiche?: string;
    brandLogoUrl?: string;
    influencerProfilePic?: string;
    postingDeadline?: string;
    requestCode?: string;
    acceptedAt?: string;
    brandPaymentReceivedAt?: string;
    verifiedLiveAt?: string;
    campaignStartAt?: string;
    campaignEndAt?: string;
    campaignCompletedAt?: string;
    cancelledAt?: string;
    adminStoppedAt?: string;
    adminStopReason?: string;
    brandPaymentStatus?: string;
    brandPaymentIntentId?: string;
    platformFeeAmount?: number;
    platformFeePercent?: number;
    influencerNetAmount?: number;
    firstPayoutAmount?: number;
    secondPayoutAmount?: number;
    firstPayoutReleasedAt?: string;
    secondPayoutReleasedAt?: string;
    brief?: {
        brandIntro?: string;
        campaignObjective?: string;
        productDetails?: string;
        targetAudienceDesc?: string;
        keyMessage?: string;
        contentType?: string[];
        creativeDirection?: string;
        mandatoryPoints?: string;
        dosAndDonts?: string;
        captionGuidelines?: string;
        hashtags?: string[];
        callToAction?: string;
        trackingLink?: string;
        promoCode?: string;
        visualRequirements?: string;
        postingDeadline?: string;
        approvalProcess?: string;
        deliverables?: string;
        usageRightsText?: string;
        disclosureRequirements?: string;
        porchestContact?: string;
    };
    content?: {
        driveLink?: string;
        driveSubmittedAt?: string;
        brandApprovedDrive?: boolean;
        brandApprovedAt?: string;
        postLink?: string;
        postSubmittedAt?: string;
        brandVerifiedPost?: boolean;
        brandVerifiedAt?: string;
        adminVerified?: boolean;
        adminVerifiedAt?: string;
    };
    metrics?: {
        clicks?: number;
        visits?: number;
        conversions?: number;
        revenue?: number;
        reach?: number;
        impressions?: number;
        engagementRate?: number;
        roas?: number;
        cpa?: number;
        lastUpdatedAt?: string;
    };
    followerSnapshot?: {
        baseline?: { count?: number; timestamp?: string };
        currentCount?: number;
        netNewFollowers?: number;
        growthRate?: number;
        lastPolledAt?: string;
        dailyReadings?: Array<{ count?: number; timestamp?: string }>;
    };
}

const FILTERS = [
    { key: 'all', label: 'All collaborations' },
    { key: 'pending,countered,brand_payment_pending', label: 'Requests' },
    { key: 'brand_paid_work_can_start,campaign_active,content_submitted,content_approved,posted', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'declined,cancelled', label: 'Stopped' },
];

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string; icon: JSX.Element }> = {
    pending: { label: 'Pending', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.20)', icon: <Clock3 size={12} /> },
    countered: { label: 'Countered', bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.20)', icon: <AlertTriangle size={12} /> },
    brand_payment_pending: { label: 'Payment pending', bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.20)', icon: <Clock3 size={12} /> },
    brand_paid_work_can_start: { label: 'Payment confirmed', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.20)', icon: <CheckCircle2 size={12} /> },
    campaign_active: { label: 'Campaign active', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.20)', icon: <PlayCircle size={12} /> },
    content_submitted: { label: 'Content submitted', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.20)', icon: <PlayCircle size={12} /> },
    content_approved: { label: 'Content approved', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.20)', icon: <CheckCircle2 size={12} /> },
    posted: { label: 'Awaiting verification', bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.20)', icon: <ShieldAlert size={12} /> },
    completed: { label: 'Completed', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.20)', icon: <CheckCircle2 size={12} /> },
    declined: { label: 'Declined', bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.20)', icon: <AlertTriangle size={12} /> },
    cancelled: { label: 'Stopped', bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.20)', icon: <StopCircle size={12} /> },
};

function fmtDate(value?: string | null) {
    return value ? new Date(value).toLocaleString() : '—';
}

function fmtMoney(value?: number) {
    return value == null ? '—' : `$${Number(value).toLocaleString()}`;
}

function StatPill({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-medium">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    );
}

export default function AdminCollaborationsPage() {
    const { socket } = useSocket();
    const [collabs, setCollabs] = useState<CollaborationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selected, setSelected] = useState<CollaborationItem | null>(null);
    const [actioning, setActioning] = useState(false);

    const loadCollaborations = async (status = filter) => {
        const params = status === 'all' ? {} : { status };
        const res = await adminAPI.getCollaborations(params);
        const next = res.data.collaborations || [];
        setCollabs(next);
        setSelected((prev) => {
            if (prev) {
                return next.find((item: CollaborationItem) => item._id === prev._id) || next[0] || null;
            }
            return next[0] || null;
        });
        if (!selectedId && next[0]) {
            setSelectedId(next[0]._id);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadCollaborations()
            .catch(() => toast.error('Failed to load collaborations'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (payload: { collaborationId?: string; status?: string; action?: string }) => {
            void loadCollaborations().catch(() => {});
            if (payload?.action === 'submit-post') {
                toast.success('A collaboration post was submitted for verification.');
            } else if (payload?.action === 'verify-admin') {
                toast.success('The first payout was released.');
            } else if (payload?.action === 'stop') {
                toast('A collaboration was stopped by admin.');
            }
        };

        socket.on('collaboration:updated', handleUpdate);
        return () => {
            socket.off('collaboration:updated', handleUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, filter]);

    useEffect(() => {
        if (!selectedId) return;
        setSelected(collabs.find((item) => item._id === selectedId) || collabs[0] || null);
    }, [collabs, selectedId]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return collabs.filter((item) => {
            const matchesFilter = filter === 'all'
                ? true
                : filter.split(',').includes(item.status);
            const haystack = [
                item.brandName,
                item.influencerName,
                item.influencerUsername,
                item.campaignTitle,
                item.brief?.campaignObjective,
            ].filter(Boolean).join(' ').toLowerCase();
            const matchesSearch = !q || haystack.includes(q);
            return matchesFilter && matchesSearch;
        });
    }, [collabs, filter, search]);

    useEffect(() => {
        if (!selected && filtered[0]) {
            setSelected(filtered[0]);
            setSelectedId(filtered[0]._id);
        }
    }, [filtered, selected]);

    const counts = useMemo(() => ({
        total: collabs.length,
        active: collabs.filter((c) => ['brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(c.status)).length,
        awaiting: collabs.filter((c) => c.status === 'posted' && !c.content?.adminVerified).length,
        completed: collabs.filter((c) => c.status === 'completed').length,
    }), [collabs]);

    const handleStop = async () => {
        if (!selected) return;
        const reason = window.prompt('Reason for stopping this collaboration?', 'Stopped by admin') || 'Stopped by admin';
        setActioning(true);
        try {
            await adminAPI.stopCollaboration(selected._id, reason);
            toast.success('Collaboration stopped.');
            await loadCollaborations(filter);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.message || 'Failed to stop collaboration');
        } finally {
            setActioning(false);
        }
    };

    const handleVerify = async () => {
        if (!selected) return;
        setActioning(true);
        try {
            await adminAPI.verifyCollaboration(selected._id);
            toast.success('Post verified and first payout released.');
            await loadCollaborations(filter);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.message || 'Failed to verify collaboration');
        } finally {
            setActioning(false);
        }
    };

    const selectedStatus = selected ? STATUS_META[selected.status] || STATUS_META.pending : null;

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="max-w-7xl mx-auto space-y-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-6">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-medium">Admin portal</p>
                                <h1 className="text-3xl font-bold text-white mt-2">Collaborations</h1>
                                <p className="text-sm text-gray-400 mt-2 max-w-3xl">
                                    Review every collaboration in one place, monitor live analytics, verify posts, release the first payout, and stop anything that needs intervention.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="px-3 py-1.5 rounded-full bg-[#202025] border border-[#2A2A30]">{counts.total} total</span>
                                <span className="px-3 py-1.5 rounded-full bg-[#202025] border border-[#2A2A30]">{counts.awaiting} awaiting review</span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        <StatPill label="Total collaborations" value={counts.total} />
                        <StatPill label="Active campaigns" value={counts.active} />
                        <StatPill label="Awaiting verification" value={counts.awaiting} />
                        <StatPill label="Completed" value={counts.completed} />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                        <div className="flex flex-wrap gap-2 p-1 bg-[#1A1A1E] border border-[#2A2A30] rounded-xl w-fit">
                            {FILTERS.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilter(item.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filter === item.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#202025]'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-1 max-w-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search collaborations, brands, influencers..."
                                className="w-full bg-[#1A1A1E] border border-[#2A2A30] rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Loading collaborations...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
                            <div className="space-y-4">
                                {filtered.length === 0 ? (
                                    <div className="bg-[#1A1A1E] border border-dashed border-[#2A2A30] rounded-xl p-10 text-center">
                                        <Users className="w-10 h-10 text-gray-500 mx-auto mb-4" />
                                        <p className="text-white font-medium">No collaborations found</p>
                                        <p className="text-gray-400 text-sm mt-2">Try adjusting the search or filter chips.</p>
                                    </div>
                                ) : filtered.map((item) => {
                                    const badge = STATUS_META[item.status] || STATUS_META.pending;
                                    const active = selectedId === item._id;
                                    const needsReview = item.status === 'posted' && !item.content?.adminVerified;
                                    return (
                                        <motion.button
                                            key={item._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => {
                                                setSelectedId(item._id);
                                                setSelected(item);
                                            }}
                                            className={`w-full text-left bg-[#1A1A1E] border rounded-xl p-5 transition-all ${
                                                active ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-[#2A2A30] hover:border-[#3A3A42]'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#202025] border border-[#2A2A30] flex items-center justify-center shrink-0">
                                                        {item.brandLogoUrl ? (
                                                            <img src={item.brandLogoUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-bold text-orange-500">{(item.brandName || 'B').slice(0, 1).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-white font-semibold truncate">{item.campaignTitle || item.brief?.campaignObjective || 'Collaboration'}</p>
                                                        <p className="text-sm text-gray-400 mt-1 truncate">
                                                            {item.brandName || 'Brand'} · {item.influencerName || 'Influencer'}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            <span className="px-2.5 py-1 rounded-full bg-[#202025] border border-[#2A2A30] text-xs text-gray-300">
                                                                Start: {fmtDate(item.campaignStartAt || item.verifiedLiveAt || item.acceptedAt)}
                                                            </span>
                                                            <span className="px-2.5 py-1 rounded-full bg-[#202025] border border-[#2A2A30] text-xs text-gray-300">
                                                                End: {fmtDate(item.campaignEndAt || item.brief?.postingDeadline)}
                                                            </span>
                                                            {needsReview && (
                                                                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                                                                    Awaiting admin verification
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-bold text-white">{fmtMoney(item.pricing?.agreedFee ?? item.agreedPrice)}</p>
                                                    <span className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
                                                        {badge.icon} {badge.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="sticky top-4 space-y-4">
                                {selected ? (
                                    <>
                                        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">Selected collaboration</p>
                                                    <h2 className="text-2xl font-bold text-white mt-2">{selected.campaignTitle || selected.brief?.campaignObjective || 'Collaboration'}</h2>
                                                    <p className="text-sm text-gray-400 mt-2">{selected.brandName || 'Brand'} with {selected.influencerName || 'Influencer'}</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide" style={{ background: selectedStatus?.bg, color: selectedStatus?.color, borderColor: selectedStatus?.border }}>
                                                    {selectedStatus?.icon} {selectedStatus?.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-6">
                                                <StatPill label="Agreed fee" value={fmtMoney(selected.pricing?.agreedFee ?? selected.agreedPrice)} />
                                                <StatPill label="First payout" value={fmtMoney(selected.firstPayoutAmount)} />
                                                <StatPill label="Second payout" value={fmtMoney(selected.secondPayoutAmount)} />
                                                <StatPill label="Platform fee" value={fmtMoney(selected.platformFeeAmount)} />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-sm">
                                                <div className="bg-[#202025] border border-[#2A2A30] rounded-xl p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Accepted</p>
                                                    <p className="text-white font-medium mt-1">{fmtDate(selected.acceptedAt)}</p>
                                                </div>
                                                <div className="bg-[#202025] border border-[#2A2A30] rounded-xl p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Start time</p>
                                                    <p className="text-white font-medium mt-1">{fmtDate(selected.campaignStartAt || selected.verifiedLiveAt || selected.acceptedAt)}</p>
                                                </div>
                                                <div className="bg-[#202025] border border-[#2A2A30] rounded-xl p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Campaign end</p>
                                                    <p className="text-white font-medium mt-1">{fmtDate(selected.campaignEndAt || selected.brief?.postingDeadline)}</p>
                                                </div>
                                                <div className="bg-[#202025] border border-[#2A2A30] rounded-xl p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Payment status</p>
                                                    <p className="text-white font-medium mt-1">{selected.brandPaymentStatus || 'pending'}</p>
                                                </div>
                                            </div>

                                            {(selected.status === 'posted' || (selected.content?.postLink && !selected.content?.adminVerified)) && (
                                                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                                                    <p className="text-amber-300 font-semibold text-sm">Post submitted and awaiting verification</p>
                                                    <p className="text-amber-200/70 text-xs mt-2">
                                                        The influencer has submitted the live post link. Verify the post to release the first payout.
                                                    </p>
                                                    <div className="mt-3 flex gap-2 flex-wrap">
                                                        <button
                                                            onClick={handleVerify}
                                                            disabled={actioning}
                                                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
                                                        >
                                                            Verify & release first payout
                                                        </button>
                                                        <a
                                                            href={selected.content?.postLink || '#'}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-4 py-2 rounded-lg bg-[#202025] border border-[#2A2A30] text-gray-300 text-sm font-medium inline-flex items-center gap-2"
                                                        >
                                                            Open post <SquareArrowOutUpRight className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                                                <button
                                                    onClick={handleStop}
                                                    disabled={actioning}
                                                    className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/15 disabled:opacity-50"
                                                >
                                                    <StopCircle className="w-4 h-4" />
                                                    Stop collaboration
                                                </button>
                                            )}
                                        </div>

                                        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-6">
                                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium mb-4">Brief summary</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                {[
                                                    ['Objective', selected.brief?.campaignObjective],
                                                    ['Brand intro', selected.brief?.brandIntro],
                                                    ['Product details', selected.brief?.productDetails],
                                                    ['Target audience', selected.brief?.targetAudienceDesc],
                                                    ['Key message', selected.brief?.keyMessage],
                                                    ['Content types', selected.brief?.contentType?.join(', ')],
                                                    ['Hashtags', selected.brief?.hashtags?.join(' ')],
                                                    ['CTA', selected.brief?.callToAction],
                                                    ['Usage rights', selected.brief?.usageRightsText],
                                                    ['Disclosure', selected.brief?.disclosureRequirements],
                                                ].filter(([, value]) => value).map(([label, value]) => (
                                                    <div key={label} className="bg-[#202025] border border-[#2A2A30] rounded-xl p-4">
                                                        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">{label}</p>
                                                        <p className="text-white mt-1 leading-6">{value as string}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-6">
                                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium mb-4">Ongoing analytics</p>
                                            <CollaborationMetrics collaborationId={selected._id} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-[#1A1A1E] border border-dashed border-[#2A2A30] rounded-xl p-8 text-center">
                                        <Users className="w-10 h-10 text-gray-500 mx-auto mb-4" />
                                        <p className="text-white font-medium">Select a collaboration</p>
                                        <p className="text-gray-400 text-sm mt-2">Open any collaboration from the list to review its details and analytics.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
