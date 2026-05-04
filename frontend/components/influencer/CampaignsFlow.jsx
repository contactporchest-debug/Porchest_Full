'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApi, apiPatch } from '../../hooks/useApi';
import CampaignMetricsCard from './CampaignMetricsCard';
import toast from 'react-hot-toast';

const STATUS_TABS = [
    { key: 'pending,countered,negotiation', label: 'Requests' },
    { key: 'brand_payment_pending,brand_paid_work_can_start,campaign_active,content_submitted,content_approved,posted', label: 'Active' },
    { key: 'completed', label: 'Completed' },
];

const SURFACE = 'rgba(255,255,255,0.38)';
const SURFACE_ALT = 'rgba(255,255,255,0.48)';
const BORDER = '#EDD9BC';
const TEXT = '#1A0A00';
const MUTED = '#7A5030';

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
    const isMetricsLocked = (collab) => !collab?.content?.postLink && !collab?.postLink;

    const { data, loading, refetch } = useApi(`/collaborations?status=${STATUS_TABS[activeTab].key}`);
    const collabs = data?.collaborations || [];

    useEffect(() => {
        const handleUpdated = () => {
            void refetch();
        };

        window.addEventListener('porchest-collaboration-updated', handleUpdated);
        return () => window.removeEventListener('porchest-collaboration-updated', handleUpdated);
    }, [refetch]);

    async function action(id, endpoint, body = {}) {
        setActing(true);
        try {
            const result = await apiPatch(`/collaborations/${id}/${endpoint}`, body);
            if (result?.success === false || result?.error || result?.message === 'Invalid status') {
                throw new Error(result?.error || result?.message || 'Unable to update collaboration');
            }
            const nextStatus = result?.status || result?.request?.status || result?.data?.status;
            if (endpoint === 'accept' || endpoint === 'accept-counter') {
                if (!['brand_payment_pending', 'brand_paid_work_can_start', 'campaign_active'].includes(String(nextStatus || ''))) {
                    throw new Error('The collaboration did not move to the next stage.');
                }
            }
            if (endpoint === 'accept' || endpoint === 'accept-counter') {
                setActiveTab(1);
                toast.success('Request accepted. It moved to Collaborations.');
            } else if (endpoint === 'counter') {
                toast.success('Counter offer sent.');
            } else if (endpoint === 'decline') {
                toast.success('Request declined.');
            } else {
                toast.success('Updated.');
            }
            await refetch();
            window.dispatchEvent(new CustomEvent('porchest-collaboration-updated'));
        } catch (error) {
            const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Unable to update collaboration';
            toast.error(message);
        } finally {
            setActing(false);
        }
    }

    const inputClass = 'flex-1 px-4 py-2.5 rounded-[12px] bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#1A0A00] text-sm focus:outline-none focus:border-[#C2340A] placeholder:text-[#A88C6D] transition-all backdrop-blur-[12px]';
    const cardClass = 'p-6 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[rgba(255,255,255,0.65)] space-y-5 hover:bg-[rgba(255,255,255,0.48)] transition-all backdrop-blur-[12px]';

    function getBriefProgress(collab) {
        const fields = [
            collab.brief?.brandIntro,
            collab.brief?.campaignObjective,
            collab.brief?.productDetails,
            collab.brief?.targetAudienceDesc,
            collab.brief?.keyMessage,
            collab.brief?.contentType?.length,
            collab.brief?.creativeDirection,
            collab.brief?.mandatoryPoints,
            collab.brief?.dosAndDonts,
            collab.brief?.captionGuidelines,
            collab.brief?.hashtags?.length,
            collab.brief?.callToAction,
            collab.brief?.trackingLink,
            collab.brief?.promoCode,
            collab.brief?.visualRequirements,
            collab.brief?.postingDeadline,
            collab.brief?.approvalProcess,
            collab.brief?.deliverables,
            collab.brief?.usageRightsText || collab.brief?.usageRights,
            collab.brief?.disclosureRequirements,
            collab.brief?.porchestContact,
        ];
        const filled = fields.filter(Boolean).length;
        return { filled, total: fields.length, pct: Math.round((filled / fields.length) * 100) };
    }

    return (
        <div className="space-y-6">
            {/* Tab switcher */}
            <div className="flex gap-2 p-1.5 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[rgba(255,255,255,0.65)] backdrop-blur-[12px] w-fit">
                {STATUS_TABS.map((tab, i) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(i)}
                        className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all ${
                            activeTab === i ? 'bg-[#C2340A] text-white shadow-md shadow-[#C2340A]/20' : 'text-[#7A5030] hover:text-[#1A0A00] hover:bg-[rgba(255,255,255,0.5)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <p className="text-[#7A5030] text-sm font-medium">Loading...</p>}

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
                            <p className="text-[#1A0A00] font-bold text-lg">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Collaboration request'}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs font-bold text-[#7A5030] uppercase tracking-wide">From</span>
                                <span className="px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.48)] text-[#7A5030] text-xs font-bold border border-[#EDD9BC]">
                                    {c.brandProfile?.businessName || c.brandName || 'Brand'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-[#C2340A]">
                                ${Number(c.pricing?.brandOffer || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide">Brand offer</p>
                        </div>
                    </div>

                    {/* Brief preview chips */}
                    <div className="flex flex-wrap gap-2">
                        {c.brief?.contentTypes?.length > 0 && (
                            <span className="px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.48)] border border-[#EDD9BC] text-xs font-bold text-[#7A5030]">
                                {c.brief.contentTypes.join(', ')}
                            </span>
                        )}
                        {c.brief?.postingSchedule && (
                            <span className="px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.48)] border border-[#EDD9BC] text-xs font-bold text-[#7A5030]">
                                Deadline: {new Date(c.brief.postingSchedule).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#7A5030]">
                            <span>Brief completeness</span>
                            <span>{getBriefProgress(c).filled}/{getBriefProgress(c).total} fields</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#EDD9BC]/45 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#C2340A] to-[#E8400A]"
                                style={{ width: `${getBriefProgress(c).pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Toggle full brief */}
                    <button
                        onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                        className="text-xs font-bold text-[#7A5030] hover:text-[#1A0A00] flex items-center gap-1 bg-[rgba(255,255,255,0.48)] px-3 py-1.5 rounded-full border border-[#EDD9BC] transition-colors"
                    >
                        {expanded === c._id ? 'Hide brief ▲' : 'View full brief ▼'}
                    </button>

                    {expanded === c._id && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm border-t border-[#EDD9BC] pt-4">
                            {[
                                ['Brand intro',          c.brief?.brandIntro],
                                ['Product details',      c.brief?.productDetails],
                                ['Key message',          c.brief?.keyMessage],
                                ['Creative direction',   c.brief?.creativeDirection],
                                ['Mandatory points',     c.brief?.mandatoryTalkingPoints?.join(', ')],
                                ["Do's & don'ts",        c.brief?.dosAndDonts],
                                ['Caption guidelines',   c.brief?.captionGuidelines],
                                ['Deliverables',         c.brief?.deliverables?.join(', ')],
                                ['Usage rights',         c.brief?.usageRightsText || c.brief?.usageRights],
                                ['Disclosure',           c.brief?.disclosureRequired],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <div key={label} className="p-4 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] backdrop-blur-[12px]">
                                    <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-1">{label}</p>
                                    <p className="text-[#1A0A00] text-sm">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions — pending */}
                    {c.status === 'pending' && (
                        <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-[#EDD9BC]">
                            <button
                                onClick={() => action(c._id, 'accept')}
                                disabled={acting}
                                className="flex-1 py-3 rounded-full bg-[#C2340A] text-white font-bold text-sm hover:bg-[#E8400A] transition-all disabled:opacity-40"
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
                                    className="px-6 py-3 rounded-full bg-[rgba(255,255,255,0.48)] text-[#7A5030] font-bold text-sm hover:bg-[rgba(255,255,255,0.65)] transition-colors border border-[#EDD9BC] disabled:opacity-40"
                                >
                                    Counter
                                </button>
                            </div>

                            <button
                                onClick={() => action(c._id, 'decline')}
                                disabled={acting}
                                className="px-6 py-3 rounded-full bg-[#C2340A]/10 text-[#C2340A] font-bold text-sm hover:bg-[#C2340A]/15 transition-colors border border-[#EDD9BC] disabled:opacity-40"
                            >
                                Decline
                            </button>
                        </div>
                    )}

                    {/* Countered — waiting for brand */}
                    {c.status === 'countered' && (
                        <div className="p-4 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] flex items-start gap-3 backdrop-blur-[12px]">
                            <div className="w-8 h-8 rounded-full bg-[#d97706]/10 flex items-center justify-center text-[#d97706] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-[#d97706] font-bold text-sm">Waiting for brand response</p>
                                <p className="text-[#7A5030] text-xs mt-0.5">You countered at ${Number(c.pricing?.influencerCounter || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {c.status === 'brand_payment_pending' && (
                        <div className="p-4 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] flex items-start gap-3 backdrop-blur-[12px]">
                            <div className="w-8 h-8 rounded-full bg-[#d97706]/10 flex items-center justify-center text-[#d97706] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-[#d97706] font-bold text-sm">Accepted, waiting for brand payment</p>
                                <p className="text-[#7A5030] text-xs mt-0.5">We’ll unlock content submission once the brand confirms payment.</p>
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
                    <div className="flex items-start justify-between gap-4 border-b border-[#EDD9BC] pb-4">
                        <div>
                            <p className="text-[#1A0A00] font-bold text-lg">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Active campaign'}
                            </p>
                            <p className="text-sm font-medium text-[#7A5030] mt-1">{c.brandProfile?.businessName || c.brandName}</p>
                            {isMetricsLocked(c) && (
                                    <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-[#C2340A]/10 border border-[#EDD9BC] text-[#C2340A] text-[10px] font-bold uppercase tracking-wide">
                                        Metrics locked until final post
                                    </span>
                                )}
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-[#C2340A]">
                                ${Number(c.pricing?.agreedFee || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide">Agreed fee</p>
                        </div>
                    </div>

                    {/* Campaign tools — tracking link + promo code */}
                    {(c.brief?.trackingLink || c.brief?.promoCode) && (
                        <div className="p-5 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] space-y-4 backdrop-blur-[12px]">
                            <p className="text-sm font-bold text-[#1A0A00]">Your Campaign Tools</p>
                            {c.brief?.trackingLink && (
                                <div>
                                    <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-1.5">Tracking link (for bio/caption)</p>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={c.brief.trackingLink}
                                            className="flex-1 px-4 py-2.5 rounded-[12px] bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#1A0A00] text-sm font-mono backdrop-blur-[12px]"
                                        />
                                        <button
                                            onClick={() => navigator.clipboard.writeText(c.brief.trackingLink)}
                                            className="px-4 py-2.5 rounded-full bg-[rgba(255,255,255,0.48)] border border-[#EDD9BC] text-[#7A5030] text-sm font-bold hover:bg-[rgba(255,255,255,0.65)]"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                            {c.brief?.promoCode && (
                                <div>
                                    <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-1.5">Promo code</p>
                                    <div className="flex gap-3 items-center">
                                        <span className="px-5 py-2.5 rounded-full bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#1A0A00] font-mono font-bold tracking-wider text-base backdrop-blur-[12px]">
                                            {c.brief.promoCode}
                                        </span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(c.brief.promoCode)}
                                            className="px-4 py-2.5 rounded-full bg-[rgba(255,255,255,0.48)] border border-[#EDD9BC] text-[#7A5030] text-sm font-bold hover:bg-[rgba(255,255,255,0.65)]"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                            {c.brief?.requiredHashtags?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-1">Required hashtags</p>
                                    <p className="text-[#1A0A00] font-medium text-sm">{c.brief.requiredHashtags.join(' ')}</p>
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
                                        done ? 'bg-[#059669] text-white shadow-sm shadow-[#059669]/20' : 'bg-[rgba(255,255,255,0.48)] border border-[#EDD9BC] text-[#7A5030]'
                                    }`}>
                                        {done ? '✓' : ''}
                                    </div>
                                    <p className={`text-sm font-medium ${done ? 'text-[#B48C73] line-through' : 'text-[#1A0A00]'}`}>
                                        {step.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Payment pending notice */}
                    {c.status === 'brand_payment_pending' && (
                        <div className="p-4 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] flex items-start gap-3 mt-4 backdrop-blur-[12px]">
                            <div className="w-8 h-8 rounded-full bg-[#d97706]/10 flex items-center justify-center text-[#d97706] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-[#d97706] font-bold text-sm">Accepted, waiting for brand payment</p>
                                <p className="text-[#7A5030] text-xs mt-0.5">The collaboration will unlock once the brand confirms payment.</p>
                            </div>
                        </div>
                    )}

                    {/* Payment confirmed notice */}
                    {c.status === 'brand_paid_work_can_start' && (
                        <div className="p-4 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] flex items-start gap-3 mt-4 backdrop-blur-[12px]">
                            <div className="w-8 h-8 rounded-full bg-[#059669]/10 flex items-center justify-center text-[#059669] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-[#059669] font-bold text-sm">Payment confirmed</p>
                                <p className="text-[#7A5030] text-xs mt-0.5">You can now create content and submit the drive link.</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Drive link */}
                    {c.status === 'brand_paid_work_can_start' && !c.content?.driveLink && (
                        <div className="space-y-3 pt-4 border-t border-[#EDD9BC]">
                            <p className="text-sm font-bold text-[#1A0A00]">
                                Submit Content for Review
                            </p>
                            <p className="text-xs text-[#7A5030]">Provide a Google Drive folder link containing your raw/edited content.</p>
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
                                    className="px-6 py-2.5 rounded-full bg-[#C2340A] text-white font-bold text-sm hover:bg-[#E8400A] transition-all disabled:opacity-40"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Drive submitted — awaiting brand approval */}
                    {c.content?.driveLink && !c.content?.brandApprovedDrive && (
                        <div className="p-4 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] flex items-start gap-3 mt-4 backdrop-blur-[12px]">
                            <div className="w-8 h-8 rounded-full bg-[#0284c7]/10 flex items-center justify-center text-[#0284c7] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-[#0284c7] font-bold text-sm">Under Brand Review</p>
                                <p className="text-[#7A5030] text-xs mt-0.5">Your content has been submitted. Waiting for the brand to approve.</p>
                            </div>
                        </div>
                    )}

                    {/* Submit live post link — shown after brand approves */}
                    {c.content?.brandApprovedDrive && !c.content?.postLink && c.status !== 'brand_payment_pending' && (
                        <div className="space-y-3 pt-4 border-t border-[#EDD9BC] mt-4">
                        <div className="p-4 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] flex items-start gap-3 mb-4 backdrop-blur-[12px]">
                                <div className="w-8 h-8 rounded-full bg-[#059669]/10 flex items-center justify-center text-[#059669] shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div className="pt-1.5">
                                    <p className="text-[#059669] font-bold text-sm">Content Approved!</p>
                                    <p className="text-[#7A5030] text-xs mt-0.5">You are cleared to post. Submit the live Instagram link below.</p>
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
                                    className="px-6 py-2.5 rounded-full bg-[#C2340A] text-white font-bold text-sm hover:bg-[#E8400A] transition-all disabled:opacity-40"
                                >
                                    Submit Post
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Post submitted — waiting admin */}
                    {c.content?.postLink && !c.content?.adminVerified && (
                        <div className="p-4 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] flex items-start gap-3 mt-4 backdrop-blur-[12px]">
                            <div className="w-8 h-8 rounded-full bg-[#d97706]/10 flex items-center justify-center text-[#d97706] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="pt-1.5">
                                <p className="text-[#d97706] font-bold text-sm">Verifying Post</p>
                                <p className="text-[#7A5030] text-xs mt-0.5">Our admins are verifying the live post. Your payment will be released shortly after.</p>
                            </div>
                        </div>
                    )}

                    {/* Metrics */}
                    {['brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted', 'completed'].includes(c.status) && (
                        <div className="pt-2">
                            <CampaignMetricsCard collaborationId={c._id} />
                        </div>
                    )}
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
                    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
                        <div>
                            <p className="text-white font-bold text-lg">
                                {c.brief?.campaignObjective || c.campaignTitle || 'Completed campaign'}
                            </p>
                            <p className="text-sm font-medium text-white/40 mt-1">{c.brandProfile?.businessName || c.brandName}</p>
                            {isMetricsLocked(c) && (
                                <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                                    Metrics locked until final post
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-green-400">
                                ${Number(c.pricing?.agreedFee || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide">
                                {c.payment?.status === 'released' ? 'Paid' : 'Payment pending'}
                            </p>
                        </div>
                    </div>
                    <CampaignMetricsCard collaborationId={c._id} />
                </motion.div>
            ))}

            {!loading && collabs.length === 0 && (
                <div className="text-center py-16 bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] rounded-[14px] backdrop-blur-[12px]">
                    <svg className="w-12 h-12 text-[#C4A882] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p className="text-[#1A0A00] font-bold text-lg mb-1">
                        {activeTab === 0
                            ? 'No Pending Requests'
                            : activeTab === 1
                            ? 'No Active Campaigns'
                            : 'No Completed Campaigns'}
                    </p>
                    <p className="text-[#7A5030] text-sm">
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
