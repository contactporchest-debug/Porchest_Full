'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi, apiPatch } from '../../hooks/useApi';
import CampaignMetricsCard from './CampaignMetricsCard';

const STATUS_TABS = [
    { key: 'pending,countered', label: 'Requests' },
    { key: 'accepted,active,content_submitted,content_approved,posted', label: 'Active' },
    { key: 'completed', label: 'Completed' },
];

const PROGRESS_STEPS = [
    { label: 'Campaign accepted',               done: (c) => true },
    { label: 'Drive content submitted',         done: (c) => !!c.content?.driveLink },
    { label: 'Brand approved content',          done: (c) => !!c.content?.brandApprovedDrive },
    { label: 'Live post submitted',             done: (c) => !!c.content?.postLink },
    { label: 'Admin verified post',             done: (c) => !!c.content?.adminVerified },
    { label: 'Payment released',                done: (c) => c.payment?.status !== 'pending' },
];

export default function CampaignsFlow() {
    const [activeTab, setActiveTab] = useState(0);
    const [expanded, setExpanded] = useState(null);
    const [acting, setActing] = useState(false);

    // Per-card input state — keyed by collab _id to prevent bleed-over
    const [driveLinkMap, setDriveLinkMap] = useState({});
    const [postLinkMap, setPostLinkMap]   = useState({});
    const [counterMap, setCounterMap]     = useState({});

    const { data, loading, refetch } = useApi(`/collaborations?status=${STATUS_TABS[activeTab].key}`);
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
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
                {STATUS_TABS.map((tab, i) => (
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

            {/* ── REQUESTS TAB ── */}
            {activeTab === 0 && collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-white font-medium">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Collaboration request'}
                            </p>
                            <p className="text-xs text-gray-400">
                                From: {c.brandProfile?.businessName || c.brandName || 'Brand'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-semibold text-white">
                                ${Number(c.pricing?.brandOffer || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">Brand offer</p>
                        </div>
                    </div>

                    {/* Brief preview chips */}
                    <div className="flex flex-wrap gap-2">
                        {c.brief?.contentTypes?.length > 0 && (
                            <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                                {c.brief.contentTypes.join(', ')}
                            </span>
                        )}
                        {c.brief?.postingSchedule && (
                            <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                                Deadline: {new Date(c.brief.postingSchedule).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* Toggle full brief */}
                    <button
                        onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                        className="text-xs text-purple-400 hover:text-purple-300"
                    >
                        {expanded === c._id ? 'Hide brief ▲' : 'View full brief ▼'}
                    </button>

                    {expanded === c._id && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm border-t border-white/10 pt-3">
                            {[
                                ['Brand intro',          c.brief?.brandIntro],
                                ['Product details',      c.brief?.productDetails],
                                ['Key message',          c.brief?.keyMessage],
                                ['Creative direction',   c.brief?.creativeDirection],
                                ['Mandatory points',     c.brief?.mandatoryTalkingPoints?.join(', ')],
                                ["Do's & don'ts",        c.brief?.dosAndDonts],
                                ['Caption guidelines',   c.brief?.captionGuidelines],
                                ['Deliverables',         c.brief?.deliverables?.join(', ')],
                                ['Usage rights',         c.brief?.usageRights],
                                ['Disclosure',           c.brief?.disclosureRequired],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <div key={label} className="p-3 rounded-lg bg-white/5">
                                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                    <p className="text-white text-xs">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions — pending */}
                    {c.status === 'pending' && (
                        <div className="flex flex-col md:flex-row gap-3 pt-2">
                            <button
                                onClick={() => action(c._id, 'accept')}
                                disabled={acting}
                                className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-40"
                            >
                                Accept ${Number(c.pricing?.brandOffer || 0).toLocaleString()}
                            </button>

                            <div className="flex gap-2 flex-1">
                                <input
                                    type="number"
                                    placeholder="Counter amount"
                                    value={counterMap[c._id] || ''}
                                    onChange={(e) => setCounterMap((m) => ({ ...m, [c._id]: e.target.value }))}
                                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                />
                                <button
                                    onClick={() => action(c._id, 'counter', { counterAmount: Number(counterMap[c._id]) })}
                                    disabled={acting || !counterMap[c._id]}
                                    className="px-4 py-2 rounded-lg border border-purple-500/40 bg-purple-900/30 text-purple-300 text-sm hover:bg-purple-900/50 disabled:opacity-40"
                                >
                                    Counter
                                </button>
                            </div>

                            <button
                                onClick={() => action(c._id, 'decline')}
                                disabled={acting}
                                className="px-4 py-2.5 rounded-lg border border-red-500/30 bg-red-900/20 text-red-400 text-sm disabled:opacity-40"
                            >
                                Decline
                            </button>
                        </div>
                    )}

                    {/* Countered — waiting for brand */}
                    {c.status === 'countered' && (
                        <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                            <p className="text-yellow-400 text-sm">
                                You countered at ${Number(c.pricing?.influencerCounter || 0).toLocaleString()} — waiting for brand response
                            </p>
                        </div>
                    )}
                </motion.div>
            ))}

            {/* ── ACTIVE TAB ── */}
            {activeTab === 1 && collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-5"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-white font-medium">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Active campaign'}
                            </p>
                            <p className="text-xs text-gray-400">{c.brandProfile?.businessName || c.brandName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-white">
                                ${Number(c.pricing?.agreedFee || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">Agreed fee</p>
                        </div>
                    </div>

                    {/* Campaign tools — tracking link + promo code */}
                    {(c.brief?.trackingLink || c.brief?.promoCode) && (
                        <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 space-y-3">
                            <p className="text-sm font-medium text-purple-300">Your campaign tools</p>
                            {c.brief?.trackingLink && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">
                                        Tracking link — use this in your post bio/caption
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={c.brief.trackingLink}
                                            className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-purple-300 text-xs font-mono"
                                        />
                                        <button
                                            onClick={() => navigator.clipboard.writeText(c.brief.trackingLink)}
                                            className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                            {c.brief?.promoCode && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Promo code — mention this in your post</p>
                                    <div className="flex gap-2 items-center">
                                        <span className="px-4 py-2 rounded-lg bg-black/30 border border-purple-500/30 text-purple-300 font-mono font-bold tracking-wider text-sm">
                                            {c.brief.promoCode}
                                        </span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(c.brief.promoCode)}
                                            className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                            {c.brief?.requiredHashtags?.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Required hashtags</p>
                                    <p className="text-purple-300 text-sm">{c.brief.requiredHashtags.join(' ')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress steps */}
                    <div className="space-y-2">
                        {PROGRESS_STEPS.map((step, idx) => {
                            const done = step.done(c);
                            return (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${
                                        done ? 'bg-green-500' : 'bg-white/10 border border-white/20'
                                    }`}>
                                        {done ? '✓' : ''}
                                    </div>
                                    <p className={`text-sm ${done ? 'text-gray-500 line-through' : 'text-white'}`}>
                                        {step.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Submit Drive link */}
                    {!c.content?.driveLink && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-400">
                                Submit your content Google Drive link for brand review
                            </p>
                            <div className="flex gap-2">
                                <input
                                    placeholder="https://drive.google.com/..."
                                    value={driveLinkMap[c._id] || ''}
                                    onChange={(e) => setDriveLinkMap((m) => ({ ...m, [c._id]: e.target.value }))}
                                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                />
                                <button
                                    onClick={() => action(c._id, 'submit-drive', { driveLink: driveLinkMap[c._id] })}
                                    disabled={acting || !driveLinkMap[c._id]}
                                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm disabled:opacity-40"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Drive submitted — awaiting brand approval */}
                    {c.content?.driveLink && !c.content?.brandApprovedDrive && (
                        <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
                            <p className="text-blue-400 text-sm">Drive submitted — waiting for brand to approve your content</p>
                        </div>
                    )}

                    {/* Submit live post link — shown after brand approves */}
                    {c.content?.brandApprovedDrive && !c.content?.postLink && (
                        <div className="space-y-2">
                            <p className="text-xs text-green-400">
                                Brand approved your content — post it and submit the link below
                            </p>
                            <div className="flex gap-2">
                                <input
                                    placeholder="https://www.instagram.com/p/..."
                                    value={postLinkMap[c._id] || ''}
                                    onChange={(e) => setPostLinkMap((m) => ({ ...m, [c._id]: e.target.value }))}
                                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                />
                                <button
                                    onClick={() => action(c._id, 'submit-post', { postLink: postLinkMap[c._id] })}
                                    disabled={acting || !postLinkMap[c._id]}
                                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm disabled:opacity-40"
                                >
                                    Submit post
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Post submitted — waiting admin */}
                    {c.content?.postLink && !c.content?.adminVerified && (
                        <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                            <p className="text-yellow-400 text-sm">Post submitted — pending admin verification</p>
                        </div>
                    )}

                    {/* Metrics */}
                    <CampaignMetricsCard collaborationId={c._id} />
                </motion.div>
            ))}

            {/* ── COMPLETED TAB ── */}
            {activeTab === 2 && collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-white font-medium">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Completed campaign'}
                            </p>
                            <p className="text-xs text-gray-400">{c.brandProfile?.businessName || c.brandName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-green-400">
                                ${Number(c.pricing?.agreedFee || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">
                                {c.payment?.status === 'released' ? 'Paid' : 'Payment pending'}
                            </p>
                        </div>
                    </div>
                    <CampaignMetricsCard collaborationId={c._id} />
                </motion.div>
            ))}

            {!loading && collabs.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-sm">
                    {activeTab === 0
                        ? 'No pending collaboration requests'
                        : activeTab === 1
                        ? 'No active campaigns'
                        : 'No completed campaigns yet'}
                </div>
            )}
        </div>
    );
}
