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
    pending:          { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa',  label: 'Pending' },
    countered:        { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24',  label: 'Countered' },
    accepted:         { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80',  label: 'Accepted' },
    active:           { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80',  label: 'Active' },
    content_submitted:{ bg: 'rgba(167,139,250,0.12)', color: '#a78bfa',  label: 'Content submitted' },
    content_approved: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa',  label: 'Content approved' },
    posted:           { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24',  label: 'Posted' },
    completed:        { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80',  label: 'Completed' },
    declined:         { bg: 'rgba(248,113,113,0.12)', color: '#f87171',  label: 'Declined' },
};

function StatusBadge({ status }) {
    const s = STATUS_BADGE[status] || { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: status };
    return (
        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
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

    return (
        <div className="space-y-5">
            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
                {TABS.map((tab, i) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(i)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === i ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <p className="text-gray-400 text-sm">Loading...</p>}

            {collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4"
                >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {c.influencerProfile?.profilePictureURL && (
                                <img
                                    src={c.influencerProfile.profilePictureURL}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                                />
                            )}
                            <div>
                                <p className="text-white font-medium">
                                    {c.brief?.campaignObjective || c.campaignTitle || 'Collaboration'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    @{c.influencerProfile?.igUsername || c.influencerUsername || 'creator'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                                </p>
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-xl font-semibold text-white">
                                ${Number(c.pricing?.agreedFee || c.pricing?.brandOffer || 0).toLocaleString()}
                            </p>
                            <StatusBadge status={c.status} />
                        </div>
                    </div>

                    {/* ── REQUESTS TAB ── Countered by influencer */}
                    {c.status === 'countered' && c.pricing?.influencerCounter && (
                        <div className="p-4 rounded-xl bg-orange-900/20 border border-orange-500/30 space-y-3">
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-xs text-gray-500">Your offer</p>
                                    <p className="text-white font-semibold">
                                        ${Number(c.pricing.brandOffer || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-orange-400 text-lg font-bold self-center">→</div>
                                <div>
                                    <p className="text-xs text-gray-500">Influencer counter</p>
                                    <p className="text-orange-300 font-bold text-lg">
                                        ${Number(c.pricing.influencerCounter).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => action(c._id, 'accept-counter')}
                                    disabled={acting}
                                    className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-40"
                                >
                                    Accept ${Number(c.pricing.influencerCounter).toLocaleString()}
                                </button>
                                <button
                                    onClick={() => action(c._id, 'decline')}
                                    disabled={acting}
                                    className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-900/20 text-red-400 text-sm disabled:opacity-40"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── ACTIVE TAB ── Content submitted for review */}
                    {c.status === 'content_submitted' && c.content?.driveLink && (
                        <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30 space-y-3">
                            <p className="text-blue-300 text-sm font-medium">
                                Content submitted for review
                            </p>
                            <a
                                href={c.content.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 text-sm hover:text-purple-300 underline break-all block"
                            >
                                {c.content.driveLink}
                            </a>
                            <button
                                onClick={() => action(c._id, 'approve-drive')}
                                disabled={acting}
                                className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-40"
                            >
                                Approve content → influencer can now post
                            </button>
                        </div>
                    )}

                    {/* Content approved — waiting for live post */}
                    {c.status === 'content_approved' && (
                        <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                            <p className="text-green-400 text-sm">
                                Content approved — waiting for influencer to go live
                            </p>
                        </div>
                    )}

                    {/* Post submitted — admin verifying */}
                    {c.status === 'posted' && c.content?.postLink && (
                        <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-500/30 space-y-2">
                            <p className="text-yellow-300 text-sm font-medium">
                                Post submitted — pending admin compliance check
                            </p>
                            <a
                                href={c.content.postLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 text-sm hover:text-purple-300 underline break-all block"
                            >
                                {c.content.postLink}
                            </a>
                        </div>
                    )}

                    {/* Tracking assets */}
                    {c.brief?.trackingLink && (
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Campaign tracking</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-16 flex-shrink-0">Link</span>
                                <p className="text-xs text-purple-300 font-mono truncate">{c.brief.trackingLink}</p>
                            </div>
                            {c.brief?.promoCode && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">Code</span>
                                    <p className="text-xs text-purple-300 font-bold font-mono">{c.brief.promoCode}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Metrics — shown for active and beyond */}
                    {['accepted', 'active', 'content_submitted', 'content_approved', 'posted', 'completed'].includes(c.status) && (
                        <CollaborationMetrics collaborationId={c._id} />
                    )}
                </motion.div>
            ))}

            {!loading && collabs.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-sm">
                    {activeTab === 0
                        ? 'No pending or countered requests'
                        : activeTab === 1
                        ? 'No active campaigns'
                        : 'No completed campaigns yet'}
                </div>
            )}
        </div>
    );
}
