'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, PlayCircle, Search, ShieldAlert, SquareArrowOutUpRight, StopCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CollaborationMetrics from '@/components/brand/CollaborationMetrics';
import { adminAPI } from '@/lib/api';

type StatusMeta = {
    label: string;
    bg: string;
    color: string;
    border: string;
    icon: JSX.Element;
};

type CollaborationContent = {
    postLink?: string;
    adminVerified?: boolean;
};

type CollaborationItem = {
    _id: string;
    status: string;
    campaignTitle?: string;
    brandName?: string;
    brandLogoUrl?: string;
    influencerName?: string;
    influencerUsername?: string;
    campaignStartAt?: string;
    verifiedLiveAt?: string;
    acceptedAt?: string;
    campaignEndAt?: string;
    pricing?: { agreedFee?: number };
    agreedPrice?: number;
    firstPayoutAmount?: number;
    secondPayoutAmount?: number;
    platformFeeAmount?: number;
    content?: CollaborationContent;
    brief?: {
        campaignObjective?: string;
        postingDeadline?: string;
        brandIntro?: string;
        productDetails?: string;
        targetAudienceDesc?: string;
        keyMessage?: string;
        contentType?: string[];
        hashtags?: string[];
        callToAction?: string;
        usageRightsText?: string;
        disclosureRequirements?: string;
    };
};

const FILTERS = [
    { key: 'all', label: 'All collaborations' },
    { key: 'pending,brand_payment_pending', label: 'Requests' },
    { key: 'brand_paid_work_can_start,campaign_active,content_submitted,content_approved,posted', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'declined,cancelled', label: 'Stopped' },
];

const STATUS_META: Record<string, StatusMeta> = {
    pending: { label: 'Pending', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.20)', icon: <Clock3 size={12} /> },
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

function fmtMoney(value?: number | null) {
    return value == null ? '—' : `$${Number(value).toLocaleString()}`;
}

function StatPill({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-4 backdrop-blur-[12px]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#7A5030] font-medium">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1A0A00]">{value}</p>
        </div>
    );
}

export default function AdminCollaborationsView() {
    const [collabs, setCollabs] = useState<CollaborationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selected, setSelected] = useState<CollaborationItem | null>(null);
    const [actioning, setActioning] = useState(false);

    const loadCollaborations = async (status: string = filter) => {
        const params = status === 'all' ? {} : { status };
        const res = await adminAPI.getCollaborations(params);
        const next: CollaborationItem[] = res.data.collaborations || [];
        setCollabs(next);
        setSelected((prev) => {
            if (!prev) return next[0] || null;
            return next.find((item) => item._id === prev._id) || next[0] || null;
        });
        if (!selectedId && next[0]) setSelectedId(next[0]._id);
    };

    useEffect(() => {
        setLoading(true);
        loadCollaborations()
            .catch(() => toast.error('Failed to load collaborations'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return collabs.filter((item) => {
            const matchesFilter = filter === 'all' ? true : filter.split(',').includes(item.status);
            const haystack = [
                item.brandName,
                item.influencerName,
                item.influencerUsername,
                item.campaignTitle,
                item.brief?.campaignObjective,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return matchesFilter && (!q || haystack.includes(q));
        });
    }, [collabs, filter, search]);

    useEffect(() => {
        if (!selected && filtered[0]) {
            setSelected(filtered[0]);
            setSelectedId(filtered[0]._id);
        }
    }, [filtered, selected]);

    const counts = useMemo(() => {
        return {
            total: collabs.length,
            active: collabs.filter((c) => ['brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(c.status)).length,
            awaiting: collabs.filter((c) => c.status === 'posted' && !c.content?.adminVerified).length,
            completed: collabs.filter((c) => c.status === 'completed').length,
        };
    }, [collabs]);

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
                <div className="mx-auto max-w-7xl space-y-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-6 backdrop-blur-[12px]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#7A5030]">Admin portal</p>
                                <h1 className="mt-2 text-3xl font-bold text-[#1A0A00]">Collaborations</h1>
                                <p className="mt-2 max-w-3xl text-sm text-[#7A5030]">
                                    Review every collaboration in one place, monitor live analytics, verify posts, release the first payout, and stop anything that needs intervention.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#7A5030]">
                                <span className="rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] px-3 py-1.5">{counts.total} total</span>
                                <span className="rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] px-3 py-1.5">{counts.awaiting} awaiting review</span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                        <StatPill label="Total collaborations" value={counts.total} />
                        <StatPill label="Active campaigns" value={counts.active} />
                        <StatPill label="Awaiting verification" value={counts.awaiting} />
                        <StatPill label="Completed" value={counts.completed} />
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="flex w-fit flex-wrap gap-2 rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-1 backdrop-blur-[12px]">
                            {FILTERS.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilter(item.key)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                        filter === item.key ? 'bg-[#C2340A] text-white' : 'text-[#7A5030] hover:bg-[rgba(255,255,255,0.55)] hover:text-[#1A0A00]'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-1 max-w-2xl">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A5030]" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search collaborations, brands, influencers..."
                                className="w-full rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] py-3 pl-11 pr-4 text-sm text-[#1A0A00] placeholder:text-[#A88C6D] backdrop-blur-[12px] focus:border-[#C2340A] focus:outline-none"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-[#7A5030]">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Loading collaborations...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="space-y-4">
                                {filtered.length === 0 ? (
                                    <div className="rounded-[14px] border border-dashed border-[#EDD9BC] bg-[rgba(255,255,255,0.38)] p-10 text-center backdrop-blur-[12px]">
                                        <Users className="mx-auto mb-4 h-10 w-10 text-[#C4A882]" />
                                        <p className="font-medium text-[#1A0A00]">No collaborations found</p>
                                        <p className="mt-2 text-sm text-[#7A5030]">Try adjusting the search or filter chips.</p>
                                    </div>
                                ) : (
                                    filtered.map((item) => {
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
                                                className={`w-full rounded-[14px] border p-5 text-left backdrop-blur-[12px] transition-all ${
                                                    active ? 'border-[#C2340A] shadow-lg shadow-[#C2340A]/10' : 'border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] hover:border-[#EDD9BC]'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex min-w-0 items-start gap-4">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EDD9BC] bg-[rgba(255,255,255,0.55)]">
                                                            {item.brandLogoUrl ? (
                                                                <img src={item.brandLogoUrl} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-sm font-bold text-[#C2340A]">{(item.brandName || 'B').slice(0, 1).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-[#1A0A00]">{item.campaignTitle || item.brief?.campaignObjective || 'Collaboration'}</p>
                                                            <p className="mt-1 truncate text-sm text-[#7A5030]">
                                                                {item.brandName || 'Brand'} · {item.influencerName || 'Influencer'}
                                                            </p>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <span className="rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] px-2.5 py-1 text-xs text-[#7A5030]">
                                                                    Start: {fmtDate(item.campaignStartAt || item.verifiedLiveAt || item.acceptedAt)}
                                                                </span>
                                                                <span className="rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] px-2.5 py-1 text-xs text-[#7A5030]">
                                                                    End: {fmtDate(item.campaignEndAt || item.brief?.postingDeadline)}
                                                                </span>
                                                                {needsReview && (
                                                                    <span className="rounded-full border border-[#EDD9BC] bg-[#C2340A]/10 px-2.5 py-1 text-xs text-[#C2340A]">Awaiting admin verification</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-lg font-bold text-[#1A0A00]">{fmtMoney(item.pricing?.agreedFee ?? item.agreedPrice)}</p>
                                                        <span
                                                            className="mt-2 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
                                                            style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                                                        >
                                                            {badge.icon}
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="space-y-4 sticky top-4">
                                {selected ? (
                                    <>
                                        <div className="rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-6 backdrop-blur-[12px]">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#7A5030]">Selected collaboration</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-[#1A0A00]">{selected.campaignTitle || selected.brief?.campaignObjective || 'Collaboration'}</h2>
                                                    <p className="mt-2 text-sm text-[#7A5030]">
                                                        {selected.brandName || 'Brand'} with {selected.influencerName || 'Influencer'}
                                                    </p>
                                                </div>
                                                <span
                                                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
                                                    style={{ background: selectedStatus?.bg, color: selectedStatus?.color, borderColor: selectedStatus?.border }}
                                                >
                                                    {selectedStatus?.icon}
                                                    {selectedStatus?.label}
                                                </span>
                                            </div>

                                            <div className="mt-6 grid grid-cols-2 gap-3">
                                                <StatPill label="Agreed fee" value={fmtMoney(selected.pricing?.agreedFee ?? selected.agreedPrice)} />
                                                <StatPill label="First payout" value={fmtMoney(selected.firstPayoutAmount)} />
                                                <StatPill label="Second payout" value={fmtMoney(selected.secondPayoutAmount)} />
                                                <StatPill label="Platform fee" value={fmtMoney(selected.platformFeeAmount)} />
                                            </div>

                                            <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                                <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#7A5030]">Accepted</p>
                                                    <p className="mt-1 font-medium text-[#1A0A00]">{fmtDate(selected.acceptedAt)}</p>
                                                </div>
                                                <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#7A5030]">Start time</p>
                                                    <p className="mt-1 font-medium text-[#1A0A00]">{fmtDate(selected.campaignStartAt || selected.verifiedLiveAt || selected.acceptedAt)}</p>
                                                </div>
                                                <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#7A5030]">Campaign end</p>
                                                    <p className="mt-1 font-medium text-[#1A0A00]">{fmtDate(selected.campaignEndAt || selected.brief?.postingDeadline)}</p>
                                                </div>
                                                <div className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#7A5030]">Payment status</p>
                                                    <p className="mt-1 font-medium text-[#1A0A00]">{selected.brandPaymentStatus || 'pending'}</p>
                                                </div>
                                            </div>

                                            {(selected.status === 'posted' || (selected.content?.postLink && !selected.content?.adminVerified)) && (
                                                <div className="mt-6 rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.45)] p-4 backdrop-blur-[12px]">
                                                    <p className="text-sm font-semibold text-[#C2340A]">Post submitted and awaiting verification</p>
                                                    <p className="mt-2 text-xs text-[#7A5030]">Verify the post to release the first payout.</p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <button onClick={() => void handleVerify()} disabled={actioning} className="rounded-full bg-[#C2340A] px-4 py-2 text-sm font-medium text-white hover:bg-[#E8400A] disabled:opacity-50">
                                                            Verify & release first payout
                                                        </button>
                                                        <a
                                                            href={selected.content?.postLink || '#'}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-2 rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] px-4 py-2 text-sm font-medium text-[#7A5030]"
                                                        >
                                                            Open post <SquareArrowOutUpRight className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                                                <button onClick={() => void handleStop()} disabled={actioning} className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#EDD9BC] bg-[#C2340A]/10 px-4 py-2.5 text-sm font-medium text-[#C2340A] hover:bg-[#C2340A]/15 disabled:opacity-50">
                                                    <StopCircle className="h-4 w-4" />
                                                    Stop collaboration
                                                </button>
                                            )}
                                        </div>

                                        <div className="rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-6 backdrop-blur-[12px]">
                                            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#7A5030]">Brief summary</p>
                                            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
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
                                                ]
                                                    .filter(([, value]) => value)
                                                    .map(([label, value]) => (
                                                        <div key={label} className="rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.48)] p-4">
                                                            <p className="text-[10px] uppercase tracking-[0.18em] text-[#7A5030]">{label}</p>
                                                            <p className="mt-1 leading-6 text-[#1A0A00]">{value}</p>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        <div className="rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-6 backdrop-blur-[12px]">
                                            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#7A5030]">Ongoing analytics</p>
                                            <CollaborationMetrics collaborationId={selected._id} />
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
