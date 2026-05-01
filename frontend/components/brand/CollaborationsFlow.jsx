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
    pending:          { bg: 'bg-blue-50 border-blue-200',      color: 'text-blue-700',      label: 'Pending' },
    countered:        { bg: 'bg-amber-50 border-amber-200',    color: 'text-amber-700',     label: 'Countered' },
    accepted:         { bg: 'bg-green-50 border-green-200',    color: 'text-green-700',     label: 'Accepted' },
    active:           { bg: 'bg-green-50 border-green-200',    color: 'text-green-700',     label: 'Active' },
    content_submitted:{ bg: 'bg-purple-50 border-purple-200',  color: 'text-purple-700',    label: 'Content submitted' },
    content_approved: { bg: 'bg-purple-50 border-purple-200',  color: 'text-purple-700',    label: 'Content approved' },
    posted:           { bg: 'bg-amber-50 border-amber-200',    color: 'text-amber-700',     label: 'Posted' },
    completed:        { bg: 'bg-green-50 border-green-200',    color: 'text-green-700',     label: 'Completed' },
    declined:         { bg: 'bg-red-50 border-red-200',        color: 'text-red-700',       label: 'Declined' },
};

function StatusBadge({ status }) {
    const s = STATUS_BADGE[status] || { bg: 'bg-slate-100 border-slate-200', color: 'text-slate-600', label: status };
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

    const cardClass = 'p-6 rounded-[28px] bg-[rgba(255,255,255,0.95)] border border-[rgba(148,163,184,0.18)] shadow-[0_12px_30px_rgba(15,23,42,0.04)] space-y-5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all';

    return (
        <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-2 p-1.5 rounded-2xl bg-[rgba(255,255,255,0.92)] border border-[rgba(148,163,184,0.18)] shadow-[0_8px_20px_rgba(15,23,42,0.04)] w-fit">
                {TABS.map((tab, i) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(i)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === i ? 'bg-[#7B3FF2] text-white shadow-md shadow-purple-500/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <p className="text-slate-500 text-sm font-medium">Loading...</p>}

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
                                <img
                                    src={c.influencerProfile.profilePictureURL}
                                    alt=""
                                    className="w-14 h-14 rounded-[14px] object-cover border border-slate-100 shadow-sm flex-shrink-0"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                                    {(c.influencerUsername || c.influencerProfile?.igUsername || 'C')[0].toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="text-[#172033] font-bold text-lg">
                                    {c.brief?.campaignObjective || c.campaignTitle || 'Collaboration'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs font-bold text-slate-500">
                                        @{c.influencerProfile?.igUsername || c.influencerUsername || 'creator'}
                                    </p>
                                    <span className="text-slate-300">•</span>
                                    <p className="text-xs text-slate-400">
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right space-y-2 pt-1">
                            <p className="text-2xl font-bold text-[#7B3FF2] leading-none">
                                ${Number(c.pricing?.agreedFee || c.pricing?.brandOffer || 0).toLocaleString()}
                            </p>
                            <StatusBadge status={c.status} />
                        </div>
                    </div>

                    {/* ── REQUESTS TAB ── Countered by influencer */}
                    {c.status === 'countered' && c.pricing?.influencerCounter && (
                        <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 space-y-4">
                            <div className="flex gap-8 items-center">
                                <div>
                                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wide mb-1">Your offer</p>
                                    <p className="text-orange-900 font-bold text-xl line-through opacity-70">
                                        ${Number(c.pricing.brandOffer || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-orange-400/50">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-1">Influencer counter</p>
                                    <p className="text-orange-600 font-bold text-2xl">
                                        ${Number(c.pricing.influencerCounter).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => action(c._id, 'accept-counter')}
                                    disabled={acting}
                                    className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 disabled:opacity-40 transition-all"
                                >
                                    Accept Counter (${Number(c.pricing.influencerCounter).toLocaleString()})
                                </button>
                                <button
                                    onClick={() => action(c._id, 'decline')}
                                    disabled={acting}
                                    className="px-6 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-40"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── ACTIVE TAB ── Content submitted for review */}
                    {c.status === 'content_submitted' && c.content?.driveLink && (
                        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </div>
                                <div className="pt-1.5 flex-1 min-w-0">
                                    <p className="text-blue-800 font-bold text-sm">Review Submitted Content</p>
                                    <a
                                        href={c.content.driveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 text-sm hover:text-blue-700 underline break-all block mt-1"
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
                        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-green-800 font-bold text-sm">Content Approved</p>
                                <p className="text-green-600 text-xs mt-0.5">Waiting for the influencer to post the content live.</p>
                            </div>
                        </div>
                    )}

                    {/* Post submitted — admin verifying */}
                    {c.status === 'posted' && c.content?.postLink && (
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1 flex-1 min-w-0">
                                <p className="text-amber-800 font-bold text-sm">Live Post Submitted</p>
                                <p className="text-amber-600 text-xs mt-0.5 mb-2">Our admins are currently reviewing the live post for compliance.</p>
                                <a
                                    href={c.content.postLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-700 text-sm hover:text-amber-800 underline break-all font-medium"
                                >
                                    {c.content.postLink}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Tracking assets */}
                    {c.brief?.trackingLink && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Campaign tracking assets</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-12 flex-shrink-0">Link</span>
                                    <p className="text-sm text-purple-600 font-mono font-medium truncate flex-1 bg-white px-3 py-1.5 rounded-lg border border-slate-100">{c.brief.trackingLink}</p>
                                </div>
                                {c.brief?.promoCode && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-500 w-12 flex-shrink-0">Code</span>
                                        <p className="text-sm text-purple-600 font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{c.brief.promoCode}</p>
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
                <div className="text-center py-16 bg-[rgba(255,255,255,0.92)] border border-[rgba(148,163,184,0.18)] rounded-[28px]">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p className="text-slate-900 font-bold text-lg mb-1">
                        {activeTab === 0
                            ? 'No Pending Requests'
                            : activeTab === 1
                            ? 'No Active Campaigns'
                            : 'No Completed Campaigns'}
                    </p>
                    <p className="text-slate-500 text-sm">
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
