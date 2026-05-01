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

    const inputClass = 'flex-1 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.95)] border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-stone-500/10 focus:ring-2 focus:ring-stone-500/10 placeholder-slate-400 transition-all';
    const cardClass = 'p-6 rounded-[28px] bg-[rgba(255,255,255,0.95)] border border-[rgba(148,163,184,0.18)] shadow-[0_12px_30px_rgba(15,23,42,0.04)] space-y-5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all';

    return (
        <div className="space-y-6">
            {/* Tab switcher */}
            <div className="flex gap-2 p-1.5 rounded-2xl bg-[rgba(255,255,255,0.92)] border border-[rgba(148,163,184,0.18)] shadow-[0_8px_20px_rgba(15,23,42,0.04)] w-fit">
                {STATUS_TABS.map((tab, i) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(i)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === i ? 'bg-[#9b6f50] text-white shadow-md shadow-stone-500/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <p className="text-slate-500 text-sm font-medium">Loading...</p>}

            {/* ── REQUESTS TAB ── */}
            {activeTab === 0 && collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cardClass}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[#172033] font-bold text-lg">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Collaboration request'}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">From</span>
                                <span className="px-2.5 py-1 rounded-md bg-stone-50 text-stone-800 text-xs font-bold border border-stone-100">
                                    {c.brandProfile?.businessName || c.brandName || 'Brand'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-[#9b6f50]">
                                ${Number(c.pricing?.brandOffer || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Brand offer</p>
                        </div>
                    </div>

                    {/* Brief preview chips */}
                    <div className="flex flex-wrap gap-2">
                        {c.brief?.contentTypes?.length > 0 && (
                            <span className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                                {c.brief.contentTypes.join(', ')}
                            </span>
                        )}
                        {c.brief?.postingSchedule && (
                            <span className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                                Deadline: {new Date(c.brief.postingSchedule).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* Toggle full brief */}
                    <button
                        onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                        className="text-xs font-bold text-stone-700 hover:text-stone-800 flex items-center gap-1 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100 transition-colors"
                    >
                        {expanded === c._id ? 'Hide brief ▲' : 'View full brief ▼'}
                    </button>

                    {expanded === c._id && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm border-t border-slate-100 pt-4">
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
                                <div key={label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                                    <p className="text-slate-800 text-sm">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions — pending */}
                    {c.status === 'pending' && (
                        <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => action(c._id, 'accept')}
                                disabled={acting}
                                className="flex-1 py-3 rounded-xl bg-[#9b6f50] text-white font-bold text-sm hover:bg-[#6a35d4] transition-colors shadow-lg shadow-stone-500/10 disabled:opacity-40"
                            >
                                Accept ${Number(c.pricing?.brandOffer || 0).toLocaleString()}
                            </button>

                            <div className="flex gap-2 flex-1">
                                <input
                                    type="number"
                                    placeholder="Counter amount"
                                    value={counterMap[c._id] || ''}
                                    onChange={(e) => setCounterMap((m) => ({ ...m, [c._id]: e.target.value }))}
                                    className={inputClass}
                                />
                                <button
                                    onClick={() => action(c._id, 'counter', { counterAmount: Number(counterMap[c._id]) })}
                                    disabled={acting || !counterMap[c._id]}
                                    className="px-6 py-3 rounded-xl bg-stone-50 text-stone-800 font-bold text-sm hover:bg-stone-100 transition-colors border border-stone-200 disabled:opacity-40"
                                >
                                    Counter
                                </button>
                            </div>

                            <button
                                onClick={() => action(c._id, 'decline')}
                                disabled={acting}
                                className="px-6 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-40"
                            >
                                Decline
                            </button>
                        </div>
                    )}

                    {/* Countered — waiting for brand */}
                    {c.status === 'countered' && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-amber-800 font-bold text-sm">Waiting for brand response</p>
                                <p className="text-amber-600 text-xs mt-0.5">You countered at ${Number(c.pricing?.influencerCounter || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            ))}

            {/* ── ACTIVE TAB ── */}
            {activeTab === 1 && collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cardClass}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <p className="text-[#172033] font-bold text-lg">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Active campaign'}
                            </p>
                            <p className="text-sm font-medium text-slate-500 mt-1">{c.brandProfile?.businessName || c.brandName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-[#9b6f50]">
                                ${Number(c.pricing?.agreedFee || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Agreed fee</p>
                        </div>
                    </div>

                    {/* Campaign tools — tracking link + promo code */}
                    {(c.brief?.trackingLink || c.brief?.promoCode) && (
                        <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-stone-100 space-y-4">
                            <p className="text-sm font-bold text-stone-900">Your Campaign Tools</p>
                            {c.brief?.trackingLink && (
                                <div>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5">Tracking link (for bio/caption)</p>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={c.brief.trackingLink}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-slate-700 text-sm font-mono"
                                        />
                                        <button
                                            onClick={() => navigator.clipboard.writeText(c.brief.trackingLink)}
                                            className="px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm font-bold hover:bg-stone-50"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                            {c.brief?.promoCode && (
                                <div>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5">Promo code</p>
                                    <div className="flex gap-3 items-center">
                                        <span className="px-5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 font-mono font-bold tracking-wider text-base">
                                            {c.brief.promoCode}
                                        </span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(c.brief.promoCode)}
                                            className="px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm font-bold hover:bg-stone-50"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                            {c.brief?.requiredHashtags?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">Required hashtags</p>
                                    <p className="text-stone-900 font-medium text-sm">{c.brief.requiredHashtags.join(' ')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress steps */}
                    <div className="space-y-3 pt-2">
                        {PROGRESS_STEPS.map((step, idx) => {
                            const done = step.done(c);
                            return (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                                        done ? 'bg-[#4ade80] text-white shadow-sm shadow-green-500/20' : 'bg-slate-100 border border-slate-200 text-slate-300'
                                    }`}>
                                        {done ? '✓' : ''}
                                    </div>
                                    <p className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                        {step.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Submit Drive link */}
                    {!c.content?.driveLink && (
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <p className="text-sm font-bold text-slate-800">
                                Submit Content for Review
                            </p>
                            <p className="text-xs text-slate-500">Provide a Google Drive folder link containing your raw/edited content.</p>
                            <div className="flex gap-2">
                                <input
                                    placeholder="https://drive.google.com/..."
                                    value={driveLinkMap[c._id] || ''}
                                    onChange={(e) => setDriveLinkMap((m) => ({ ...m, [c._id]: e.target.value }))}
                                    className={inputClass}
                                />
                                <button
                                    onClick={() => action(c._id, 'submit-drive', { driveLink: driveLinkMap[c._id] })}
                                    disabled={acting || !driveLinkMap[c._id]}
                                    className="px-6 py-2.5 rounded-xl bg-[#9b6f50] text-white font-bold text-sm hover:bg-[#6a35d4] transition-colors shadow-md shadow-stone-500/10 disabled:opacity-40"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Drive submitted — awaiting brand approval */}
                    {c.content?.driveLink && !c.content?.brandApprovedDrive && (
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 mt-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-blue-800 font-bold text-sm">Under Brand Review</p>
                                <p className="text-blue-600 text-xs mt-0.5">Your content has been submitted. Waiting for the brand to approve.</p>
                            </div>
                        </div>
                    )}

                    {/* Submit live post link — shown after brand approves */}
                    {c.content?.brandApprovedDrive && !c.content?.postLink && (
                        <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
                            <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div className="pt-1.5">
                                    <p className="text-green-800 font-bold text-sm">Content Approved!</p>
                                    <p className="text-green-600 text-xs mt-0.5">You are cleared to post. Submit the live Instagram link below.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    placeholder="https://www.instagram.com/p/..."
                                    value={postLinkMap[c._id] || ''}
                                    onChange={(e) => setPostLinkMap((m) => ({ ...m, [c._id]: e.target.value }))}
                                    className={inputClass}
                                />
                                <button
                                    onClick={() => action(c._id, 'submit-post', { postLink: postLinkMap[c._id] })}
                                    disabled={acting || !postLinkMap[c._id]}
                                    className="px-6 py-2.5 rounded-xl bg-[#9b6f50] text-white font-bold text-sm hover:bg-[#6a35d4] transition-colors shadow-md shadow-stone-500/10 disabled:opacity-40"
                                >
                                    Submit Post
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Post submitted — waiting admin */}
                    {c.content?.postLink && !c.content?.adminVerified && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 mt-4">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-amber-800 font-bold text-sm">Verifying Post</p>
                                <p className="text-amber-600 text-xs mt-0.5">Our admins are verifying the live post. Your payment will be released shortly after.</p>
                            </div>
                        </div>
                    )}

                    {/* Metrics */}
                    <div className="pt-2">
                        <CampaignMetricsCard collaborationId={c._id} />
                    </div>
                </motion.div>
            ))}

            {/* ── COMPLETED TAB ── */}
            {activeTab === 2 && collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cardClass}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <p className="text-[#172033] font-bold text-lg">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Completed campaign'}
                            </p>
                            <p className="text-sm font-medium text-slate-500 mt-1">{c.brandProfile?.businessName || c.brandName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-[#4ade80]">
                                ${Number(c.pricing?.agreedFee || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                {c.payment?.status === 'released' ? 'Paid' : 'Payment pending'}
                            </p>
                        </div>
                    </div>
                    <CampaignMetricsCard collaborationId={c._id} />
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
                            ? "You're all caught up on your collaboration requests."
                            : activeTab === 1
                            ? "You don't have any ongoing campaigns right now."
                            : "Completed campaigns will appear here once finalized."}
                    </p>
                </div>
            )}
        </div>
    );
}
