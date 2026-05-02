'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi, apiPatch } from '../../hooks/useApi';
import CollaborationMetrics from './CollaborationMetrics';

const TABS = [
    { key: 'pending,countered', label: 'Requests sent' },
    { key: 'accepted,active,content_submitted,content_approved,posted', label: 'Active' },
    { key: 'completed', label: 'Completed' },
];

const STATUS_BADGE = {
    pending:          { bg: 'bg-blue-500/10 border-blue-500/20',      color: 'text-blue-400',      label: 'Pending' },
    countered:        { bg: 'bg-amber-500/10 border-amber-500/20',    color: 'text-amber-400',     label: 'Countered' },
    accepted:         { bg: 'bg-green-500/10 border-green-500/20',    color: 'text-green-400',     label: 'Accepted' },
    active:           { bg: 'bg-green-500/10 border-green-500/20',    color: 'text-green-400',     label: 'Active' },
    content_submitted:{ bg: 'bg-purple-500/10 border-purple-500/20',  color: 'text-purple-400',    label: 'Content submitted' },
    content_approved: { bg: 'bg-purple-500/10 border-purple-500/20',  color: 'text-purple-400',    label: 'Content approved' },
    posted:           { bg: 'bg-amber-500/10 border-amber-500/20',    color: 'text-amber-400',     label: 'Posted' },
    completed:        { bg: 'bg-green-500/10 border-green-500/20',    color: 'text-green-400',     label: 'Completed' },
    declined:         { bg: 'bg-red-500/10 border-red-500/20',        color: 'text-red-400',       label: 'Declined' },
};

function StatusBadge({ status }) {
    const s = STATUS_BADGE[status] || { bg: 'bg-white/5 border-white/10', color: 'text-white/50', label: status };
    return (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${s.bg} ${s.color}`}>
            {s.label}
        </span>
    );
}

export default function CollaborationsFlow() {
    const [activeTab, setActiveTab] = useState(0);
    const [acting, setActing] = useState(false);
    const { data, loading, refetch } = useApi(`/collaborations?status=${TABS[activeTab].key}`);
    const collabs = data?.collaborations || [];

    async function action(id, endpoint, body = {}) {
        setActing(true);
        try {
            await apiPatch(`/collaborations/${id}/${endpoint}`, body);
            await refetch();
        } finally {
            setActing(false);
        }
    }

    const cardClass = 'p-6 rounded-[20px] bg-white/[0.03] border border-white/[0.07] space-y-5 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all';

    return (
        <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] w-fit">
                {TABS.map((tab, i) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(i)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === i ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <p className="text-white/40 text-sm font-medium">Loading...</p>}

            {collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cardClass}
                >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {c.influencerProfile?.profilePictureURL ? (
                                <img src={c.influencerProfile.profilePictureURL} alt="" className="w-14 h-14 rounded-[14px] object-cover border border-white/[0.08] flex-shrink-0" />
                            ) : (
                                <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {(c.influencerUsername || c.influencerProfile?.igUsername || 'C')[0].toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="text-white font-bold text-lg">
                                    {c.brief?.campaignObjective || c.campaignTitle || 'Collaboration'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs font-bold text-white/40">
                                        @{c.influencerProfile?.igUsername || c.influencerUsername || 'creator'}
                                    </p>
                                    <span className="text-white/20">•</span>
                                    <p className="text-xs text-white/30">
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right space-y-2 pt-1">
                            <p className="text-2xl font-bold text-purple-400 leading-none">
                                ${Number(c.pricing?.agreedFee || c.pricing?.brandOffer || 0).toLocaleString()}
                            </p>
                            <StatusBadge status={c.status} />
                        </div>
                    </div>

                    {/* ── REQUESTS TAB ── Countered by influencer */}
                    {c.status === 'countered' && c.pricing?.influencerCounter && (
                        <div className="p-5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/[0.12] space-y-4">
                            <div className="flex gap-8 items-center">
                                <div>
                                    <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wide mb-1">Your offer</p>
                                    <p className="text-amber-400/50 font-bold text-xl line-through">
                                        ${Number(c.pricing.brandOffer || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-amber-500/40">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1">Influencer counter</p>
                                    <p className="text-amber-300 font-bold text-2xl">
                                        ${Number(c.pricing.influencerCounter).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => action(c._id, 'accept-counter')}
                                    disabled={acting}
                                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-40 transition-all"
                                >
                                    Accept Counter (${Number(c.pricing.influencerCounter).toLocaleString()})
                                </button>
                                <button
                                    onClick={() => action(c._id, 'decline')}
                                    disabled={acting}
                                    className="px-6 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-400 text-sm font-bold hover:bg-red-500/[0.12] transition-colors disabled:opacity-40"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── ACTIVE TAB ── Content submitted for review */}
                    {c.status === 'content_submitted' && c.content?.driveLink && (
                        <div className="p-5 rounded-2xl bg-blue-500/[0.06] border border-blue-500/[0.12] space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </div>
                                <div className="pt-1.5 flex-1 min-w-0">
                                    <p className="text-blue-300 font-bold text-sm">Review Submitted Content</p>
                                    <a
                                        href={c.content.driveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 text-sm hover:text-blue-300 underline break-all block mt-1"
                                    >
                                        {c.content.driveLink}
                                    </a>
                                </div>
                            </div>
                            <button
                                onClick={() => action(c._id, 'approve-drive')}
                                disabled={acting}
                                className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold shadow-md shadow-green-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Approve Content — Clear for Posting
                            </button>
                        </div>
                    )}

                    {/* Content approved — waiting for live post */}
                    {c.status === 'content_approved' && (
                        <div className="p-4 rounded-xl bg-green-500/[0.06] border border-green-500/[0.12] flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center text-green-400 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-green-300 font-bold text-sm">Content Approved</p>
                                <p className="text-green-400/60 text-xs mt-0.5">Waiting for the influencer to post the content live.</p>
                            </div>
                        </div>
                    )}

                    {/* Post submitted — admin verifying */}
                    {c.status === 'posted' && c.content?.postLink && (
                        <div className="p-5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/[0.12] flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1 flex-1 min-w-0">
                                <p className="text-amber-300 font-bold text-sm">Live Post Submitted</p>
                                <p className="text-amber-400/60 text-xs mt-0.5 mb-2">Our admins are currently reviewing the live post for compliance.</p>
                                <a
                                    href={c.content.postLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-400 text-sm hover:text-amber-300 underline break-all font-medium"
                                >
                                    {c.content.postLink}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Tracking assets */}
                    {c.brief?.trackingLink && (
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-3">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Campaign tracking assets</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-white/40 w-12 flex-shrink-0">Link</span>
                                    <p className="text-sm text-white/60 font-mono font-medium truncate flex-1 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">{c.brief.trackingLink}</p>
                                </div>
                                {c.brief?.promoCode && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-white/40 w-12 flex-shrink-0">Code</span>
                                        <p className="text-sm text-white/60 font-mono font-bold bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06] inline-block">{c.brief.promoCode}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metrics — shown for active and beyond */}
                    {['accepted', 'active', 'content_submitted', 'content_approved', 'posted', 'completed'].includes(c.status) && (
                        <div className="pt-2">
                            <CollaborationMetrics collaborationId={c._id} />
                        </div>
                    )}
                </motion.div>
            ))}

            {!loading && collabs.length === 0 && (
                <div className="text-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-[20px]">
                    <svg className="w-12 h-12 text-white/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p className="text-white font-bold text-lg mb-1">
                        {activeTab === 0
                            ? 'No Pending Requests'
                            : activeTab === 1
                            ? 'No Active Campaigns'
                            : 'No Completed Campaigns'}
                    </p>
                    <p className="text-white/40 text-sm">
                        {activeTab === 0
                            ? "You haven't sent any requests, or they've all been processed."
                            : activeTab === 1
                            ? "You don't have any ongoing campaigns right now."
                            : "Completed campaigns will appear here once finalized."}
                    </p>
                </div>
            )}
        </div>
    );
}
