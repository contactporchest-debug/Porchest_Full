'use client';

import { useEffect, useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Download, ShieldCheck } from 'lucide-react';
import { useApi, apiPatch, apiPost } from '../../hooks/useApi';
import { brandAPI, influencerAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_TABS = [
    { key: 'requested,sent,viewed,pending', label: 'Requested' },
    { key: 'accepted,brand_payment_pending,brand_paid_work_can_start,content_submitted,content_approved,posted', label: 'In Production' },
    { key: 'campaign_active,active', label: 'Ongoing' },
];

const SURFACE = 'rgba(255,255,255,0.38)';
const BORDER = '#EDD9BC';
const TEXT = '#1A0A00';
const MUTED = '#7A5030';

const PROGRESS_STEPS = [
    { label: 'Campaign accepted',               done: (c) => true },
    { label: 'Drive content submitted',         done: (c) => !!c.content?.driveLink },
    { label: 'Brand approved content',          done: (c) => !!c.content?.brandApprovedDrive },
    { label: 'Live post submitted',             done: (c) => !!c.content?.postLink },
    { label: 'Admin verified post',             done: (c) => !!c.content?.adminVerified },
    { label: 'Payment released',                done: (c) => String(c?.payment_status || c?.paymentStatus || c?.brandPaymentStatus || '').toLowerCase() === 'verified' || c?.payment?.status === 'released' },
];

function getProgressPercent(collab) {
    if (typeof collab?.progressPercent === 'number') return Math.max(0, Math.min(100, collab.progressPercent));
    const days = typeof collab?.daysRan === 'number' ? collab.daysRan : daysSince(collab?.acceptedAt || collab?.createdAt || collab?.campaignActiveAt || collab?.campaignStartAt);
    return Math.max(0, Math.min(100, Math.round((Number(days || 0) / 30) * 100)));
}

function getStatusLabel(collab) {
    if (collab?.status === 'brand_paid_work_can_start') return 'Ready to Create';
    if (collab?.status === 'content_submitted') return 'Draft Under Review';
    if (collab?.status === 'content_approved') return 'Approved to Post';
    if (collab?.status === 'posted') return 'Posted, waiting admin';
    if (collab?.status === 'campaign_active') return 'Campaign active';
    return 'In production';
}

function canOpenAnalysis(collab) {
    return Boolean(collab?.content?.postLink && collab?.content?.adminVerified);
}

function daysSince(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
    return Math.min(diff, 30);
}

async function downloadCollaborationPdf(id, campaignName) {
    const res = await brandAPI.downloadCollaborationPdf(id);
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${String(campaignName || 'collaboration').replace(/[^a-z0-9-_]+/gi, '_').replace(/_+/g, '_').toLowerCase() || 'collaboration'}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export default function CampaignsFlow() {
    const [activeTab, setActiveTab] = useState(0);
    const [expandedId, setExpandedId] = useState(null);
    const [acting, setActing] = useState(false);
    const [pdfBusyId, setPdfBusyId] = useState(null);
    const [trackingBusyId, setTrackingBusyId] = useState(null);

    // Per-card input state — keyed by collab _id to prevent bleed-over
    const [driveLinkMap, setDriveLinkMap] = useState({});
    const [postLinkMap, setPostLinkMap]   = useState({});
    const getPaymentStatus = (collab) => String(collab?.payment_status || collab?.paymentStatus || collab?.brandPaymentStatus || 'pending').toLowerCase();
    const isPaymentVerified = (collab) => getPaymentStatus(collab) === 'verified';
    const isPaymentPending = (collab) => getPaymentStatus(collab) === 'pending';
    const isPaymentProofSubmitted = (collab) => getPaymentStatus(collab) === 'proof_submitted';

    const collaborationsEndpoint = activeTab === 1
        ? '/influencer/campaigns/in-production'
        : `/collaborations?status=${STATUS_TABS[activeTab].key}`;
    const { data, loading, refetch } = useApi(collaborationsEndpoint);
    const collabs = data?.collaborations || data?.campaigns || [];

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
            if (endpoint === 'accept') {
                if (!['brand_payment_pending', 'brand_paid_work_can_start', 'campaign_active'].includes(String(nextStatus || ''))) {
                    throw new Error('The collaboration did not move to the next stage.');
                }
            }
            if (endpoint === 'accept') {
                setActiveTab(1);
                toast.success('Request accepted. It moved to Collaborations.');
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

    async function submitDriveLink(collab) {
        setActing(true);
        try {
            await apiPost(`/collaborations/${collab._id}/submit-drive-link`, { url: driveLinkMap[collab._id] });
            toast.success('Drive link submitted.');
            setDriveLinkMap((map) => ({ ...map, [collab._id]: '' }));
            await refetch();
            window.dispatchEvent(new CustomEvent('porchest-collaboration-updated'));
        } catch (error) {
            const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Unable to submit drive link';
            toast.error(message);
        } finally {
            setActing(false);
        }
    }

    async function submitInstagramLink(collab) {
        setActing(true);
        try {
            await apiPost(`/collaborations/${collab._id}/submit-instagram-link`, { url: postLinkMap[collab._id] });
            toast.success('Instagram link submitted.');
            setPostLinkMap((map) => ({ ...map, [collab._id]: '' }));
            await refetch();
            window.dispatchEvent(new CustomEvent('porchest-collaboration-updated'));
        } catch (error) {
            const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Unable to submit Instagram link';
            toast.error(message);
        } finally {
            setActing(false);
        }
    }

    async function handleDownloadPdf(collab) {
        try {
            setPdfBusyId(collab._id);
            await downloadCollaborationPdf(collab._id, collab.campaignTitle || collab.brief?.campaignObjective || 'collaboration');
            toast.success('PDF download started.');
        } catch (error) {
            const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to download PDF.';
            toast.error(message);
        } finally {
            setPdfBusyId(null);
        }
    }

    async function handleAcceptTracking(collab) {
        try {
            setTrackingBusyId(collab._id);
            await influencerAPI.acceptCampaignTracking(collab._id);
            toast.success('Tracking accepted for this collaboration.');
            await refetch();
            window.dispatchEvent(new CustomEvent('porchest-collaboration-updated'));
        } catch (error) {
            const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to accept tracking.';
            toast.error(message);
        } finally {
            setTrackingBusyId(null);
        }
    }

    function renderAnalysisAction(collab) {
        if (!canOpenAnalysis(collab)) {
            return (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.48)] border border-[#EDD9BC] text-[#7A5030] text-xs font-bold">
                    Analytics unlock after admin verification
                </span>
            );
        }

        return (
            <Link
                href={`/dashboard/influencer/performance?campaign=${encodeURIComponent(collab._id)}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#C2340A] text-white text-xs font-bold hover:bg-[#E8400A] transition-colors"
            >
                View Analysis
            </Link>
        );
    }

    function renderCampaignTable(collabs, variant) {
        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 1020, borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                        <tr>
                            {['Campaign', 'Brand', 'Fee', 'Status', 'Progress', 'Actions'].map((heading) => (
                                <th
                                    key={heading}
                                    style={{
                                        textAlign: 'left',
                                        padding: '14px 12px',
                                        fontSize: 11,
                                        color: MUTED,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        borderBottom: `1px solid ${BORDER}`,
                                    }}
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {collabs.map((c) => {
                            const rowExpanded = expandedId === c._id;
                            const progressPercent = getProgressPercent(c);
                            const statusText = getStatusLabel(c);
                            const isProduction = variant === 'production';
                            return (
                                <Fragment key={c._id}>
                                    <tr style={{ background: rowExpanded ? 'rgba(194,52,10,0.04)' : 'transparent' }}>
                                        <td style={{ padding: '16px 12px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT }}>{c.brief?.campaignObjective || c.campaignTitle || 'Collaboration'}</p>
                                            <p style={{ margin: '5px 0 0', fontSize: 12, color: MUTED }}>{c.campaignTitle || c.brief?.keyMessage || 'Campaign details'}</p>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.48)', border: `1px solid ${BORDER}`, color: MUTED, fontSize: 11, fontWeight: 700 }}>
                                                    {isProduction ? 'In production' : 'Ongoing'}
                                                </span>
                                                {c.content?.postLink ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.18)', color: '#059669', fontSize: 11, fontWeight: 700 }}>
                                                        Final post submitted
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 12px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{c.brandProfile?.businessName || c.brandName || 'Brand'}</p>
                                            <p style={{ margin: '5px 0 0', fontSize: 12, color: MUTED }}>{c.brandProfile?.igUsername ? `@${c.brandProfile.igUsername}` : c.username ? `@${c.username}` : '—'}</p>
                                        </td>
                                        <td style={{ padding: '16px 12px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{money(c.pricing?.agreedFee || c.pricing?.brandOffer || c.price || 0)}</p>
                                            <p style={{ margin: '5px 0 0', fontSize: 12, color: MUTED }}>Agreed fee</p>
                                        </td>
                                        <td style={{ padding: '16px 12px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{statusText}</p>
                                            <p style={{ margin: '5px 0 0', fontSize: 12, color: MUTED }}>{titleCase(c.lifecycleStatus || c.status || '')}</p>
                                        </td>
                                        <td style={{ padding: '16px 12px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{c.daysRan ?? daysSince(c.acceptedAt || c.createdAt || c.campaignActiveAt || c.campaignStartAt) ?? 0}/30</p>
                                            <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: 'rgba(237,217,188,0.7)', overflow: 'hidden' }}>
                                                <div style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #C2340A, #E8400A)' }} />
                                            </div>
                                            <p style={{ margin: '6px 0 0', fontSize: 11, color: MUTED }}>{progressPercent}% complete</p>
                                        </td>
                                        <td style={{ padding: '16px 12px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(rowExpanded ? null : c._id)}
                                                    className="px-4 py-2 rounded-full bg-[rgba(255,255,255,0.48)] text-[#7A5030] font-bold text-xs hover:bg-[rgba(255,255,255,0.65)] transition-colors border border-[#EDD9BC]"
                                                >
                                                    {rowExpanded ? 'Hide details' : 'View details'}
                                                </button>
                                                {canOpenAnalysis(c) ? renderAnalysisAction(c) : null}
                                            </div>
                                        </td>
                                    </tr>
                                    {rowExpanded ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '18px 12px 24px', borderBottom: `1px solid ${BORDER}` }}>
                                                <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.78)', padding: 18 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Collaboration details</p>
                                                            <h3 style={{ margin: '6px 0 0', fontSize: 20, color: TEXT, fontWeight: 800 }}>{c.campaignTitle || c.brief?.campaignObjective || 'Collaboration'}</h3>
                                                            <p style={{ margin: '6px 0 0', fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                                                                {isProduction
                                                                    ? 'Submit the drive link, wait for brand approval, then post and submit the final Instagram link.'
                                                                    : 'Track the live campaign and use the final post analysis once admin verifies the submission.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                                        <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)', padding: 18 }}>
                                                            {renderTrackingTools(c)}
                                                        </div>

                                                        <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)', padding: 18 }}>
                                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Workflow</p>
                                                            <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                                                                {PROGRESS_STEPS.map((step, idx) => {
                                                                    const done = step.done(c);
                                                                    return (
                                                                        <div key={`${c._id}-step-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                            <div style={{
                                                                                width: 24,
                                                                                height: 24,
                                                                                borderRadius: 999,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                flexShrink: 0,
                                                                                fontSize: 12,
                                                                                fontWeight: 700,
                                                                                color: done ? '#fff' : MUTED,
                                                                                background: done ? '#059669' : 'rgba(255,255,255,0.48)',
                                                                                border: done ? 'none' : `1px solid ${BORDER}`,
                                                                            }}>
                                                                                {done ? '✓' : ''}
                                                                            </div>
                                                                            <p style={{ margin: 0, fontSize: 13, color: done ? '#B48C73' : TEXT, textDecoration: done ? 'line-through' : 'none' }}>
                                                                                {step.label}
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {c.status === 'brand_paid_work_can_start' && isPaymentVerified(c) && !c.content?.driveLink && (
                                                            <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)', padding: 18 }}>
                                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT }}>Submit Content for Review</p>
                                                                <p style={{ marginTop: 6, fontSize: 12, color: MUTED }}>Provide a Google Drive folder link containing your raw or edited content.</p>
                                                                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                                                                    <input
                                                                        placeholder="https://drive.google.com/..."
                                                                        value={driveLinkMap[c._id] || ''}
                                                                        onChange={(e) => setDriveLinkMap((m) => ({ ...m, [c._id]: e.target.value }))}
                                                                        className={inputClass}
                                                                    />
                                                                    <button
                                                                        onClick={() => submitDriveLink(c)}
                                                                        disabled={acting || !driveLinkMap[c._id]}
                                                                        className="px-6 py-2.5 rounded-full bg-[#C2340A] text-white font-bold text-sm hover:bg-[#E8400A] transition-all disabled:opacity-40"
                                                                    >
                                                                        Submit
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {c.content?.driveLink && !c.content?.brandApprovedDrive && (
                                                            <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)', padding: 18 }}>
                                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0284c7' }}>Under Brand Review</p>
                                                                <p style={{ marginTop: 6, fontSize: 12, color: MUTED }}>Your content has been submitted. Waiting for the brand to approve.</p>
                                                            </div>
                                                        )}

                                                        {c.content?.brandApprovedDrive && !c.content?.postLink && c.status !== 'brand_payment_pending' && isPaymentVerified(c) && (
                                                            <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)', padding: 18 }}>
                                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#059669' }}>Content Approved</p>
                                                                <p style={{ marginTop: 6, fontSize: 12, color: MUTED }}>You are cleared to post. Submit the live Instagram link below.</p>
                                                                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                                                                    <input
                                                                        placeholder="https://www.instagram.com/p/..."
                                                                        value={postLinkMap[c._id] || ''}
                                                                        onChange={(e) => setPostLinkMap((m) => ({ ...m, [c._id]: e.target.value }))}
                                                                        className={inputClass}
                                                                    />
                                                                    <button
                                                                        onClick={() => submitInstagramLink(c)}
                                                                        disabled={acting || !postLinkMap[c._id]}
                                                                        className="px-6 py-2.5 rounded-full bg-[#C2340A] text-white font-bold text-sm hover:bg-[#E8400A] transition-all disabled:opacity-40"
                                                                    >
                                                                        Submit Post
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {c.content?.postLink && !c.content?.adminVerified && (
                                                            <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)', padding: 18 }}>
                                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#d97706' }}>Verifying Post</p>
                                                                <p style={{ marginTop: 6, fontSize: 12, color: MUTED }}>Our admins are verifying the live post. Payment releases after approval.</p>
                                                            </div>
                                                        )}

                                                        {canOpenAnalysis(c) ? (
                                                            <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)', padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                                <div>
                                                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT }}>Analysis ready</p>
                                                                    <p style={{ marginTop: 6, fontSize: 12, color: MUTED }}>Admin has verified the final post. Open the performance page to review analytics.</p>
                                                                </div>
                                                                {renderAnalysisAction(c)}
                                                            </div>
                                                        ) : null}

                                                        {latestFeedback(c).length > 0 && (
                                                            <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.72)', padding: 18 }}>
                                                                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand feedback</p>
                                                                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                                                                    {latestFeedback(c).map((feedback, idx) => (
                                                                        <p key={`${c._id}-feedback-${idx}`} style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.7 }}>
                                                                            {feedback}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    function renderTrackingTools(collab) {
        const enabled = Boolean(collab.trackingEnabledForCampaign);
        const accepted = Boolean(collab.trackingAcceptedByInfluencer);
        const linkVisible = Boolean(enabled && accepted && (collab.brief?.trackingLink || collab.brief?.promoCode));

        if (!enabled) {
            return (
                <div className="p-5 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] space-y-2 backdrop-blur-[12px]">
                    <p className="text-sm font-bold text-[#1A0A00]">Your Campaign Tools</p>
                    <p className="text-sm text-[#7A5030] leading-7">Tracking is not enabled for this collaboration yet.</p>
                </div>
            );
        }

        if (!accepted) {
            return (
                <div className="p-5 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] space-y-3 backdrop-blur-[12px]">
                    <p className="text-sm font-bold text-[#1A0A00]">Your Campaign Tools</p>
                    <p className="text-sm text-[#7A5030] leading-7">
                        The brand enabled tracking for this collaboration. Accept it to reveal your tracking link and promo code.
                    </p>
                    <button
                        onClick={() => handleAcceptTracking(collab)}
                        disabled={trackingBusyId === collab._id}
                        className="px-4 py-2.5 rounded-full bg-[#C2340A] text-white text-sm font-bold hover:bg-[#E8400A] transition-colors disabled:opacity-40"
                    >
                        {trackingBusyId === collab._id ? 'Accepting...' : 'Accept Tracking'}
                    </button>
                </div>
            );
        }

        return (
            <div className="p-5 rounded-[14px] bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] space-y-4 backdrop-blur-[12px]">
                <p className="text-sm font-bold text-[#1A0A00]">Your Campaign Tools</p>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#059669]" />
                    <p className="text-sm text-[#059669] font-semibold">Tracking accepted</p>
                </div>
                {linkVisible ? (
                    <>
                        {collab.brief?.trackingLink && (
                            <div>
                                <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-1.5">Tracking link (for bio/caption)</p>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={collab.brief.trackingLink}
                                        className="flex-1 px-4 py-2.5 rounded-[12px] bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#1A0A00] text-sm font-mono backdrop-blur-[12px]"
                                    />
                                    <button
                                        onClick={() => navigator.clipboard.writeText(collab.brief.trackingLink)}
                                        className="px-4 py-2.5 rounded-full bg-[rgba(255,255,255,0.48)] border border-[#EDD9BC] text-[#7A5030] text-sm font-bold hover:bg-[rgba(255,255,255,0.65)]"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                        {collab.brief?.promoCode && (
                            <div>
                                <p className="text-[10px] font-bold text-[#7A5030] uppercase tracking-wide mb-1.5">Promo code</p>
                                <div className="flex gap-3 items-center">
                                    <span className="px-5 py-2.5 rounded-full bg-[rgba(255,255,255,0.55)] border border-[#EDD9BC] text-[#1A0A00] font-mono font-bold tracking-wider text-base backdrop-blur-[12px]">
                                        {collab.brief.promoCode}
                                    </span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(collab.brief.promoCode)}
                                        className="px-4 py-2.5 rounded-full bg-[rgba(255,255,255,0.48)] border border-[#EDD9BC] text-[#7A5030] text-sm font-bold hover:bg-[rgba(255,255,255,0.65)]"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-[#7A5030] leading-7">The tracking assets are being prepared. Please check back shortly.</p>
                )}
            </div>
        );
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

    function latestFeedback(collab) {
        const feedback = collab?.brandFeedback;
        if (Array.isArray(feedback)) return feedback.filter(Boolean).slice(-2);
        if (typeof feedback === 'string' && feedback.trim()) return [feedback.trim()];
        return [];
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

            {/* ── REQUESTED TAB ── */}
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
                                {c.brief?.campaignObjective || c.campaignTitle || 'Requested collaboration'}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs font-bold text-[#7A5030] uppercase tracking-wide">From</span>
                                <span className="px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.48)] text-[#7A5030] text-xs font-bold border border-[#EDD9BC]">
                                    {c.brandProfile?.businessName || c.brandName || 'Brand'}
                                </span>
                                {typeof daysSince(c.createdAt || c.sentAt) === 'number' && (
                                    <span className="px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.48)] text-[#7A5030] text-xs font-bold border border-[#EDD9BC]">
                                        {daysSince(c.createdAt || c.sentAt)}d since request
                                    </span>
                                )}
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
                        onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}
                        className="text-xs font-bold text-[#7A5030] hover:text-[#1A0A00] flex items-center gap-1 bg-[rgba(255,255,255,0.48)] px-3 py-1.5 rounded-full border border-[#EDD9BC] transition-colors"
                    >
                        {expandedId === c._id ? 'Hide brief ▲' : 'View full brief ▼'}
                    </button>

                    {expandedId === c._id && (
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

                    {/* Actions — requested */}
                    {['sent', 'viewed', 'pending'].includes(c.status) && (
                        <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-[#EDD9BC]">
                            <button
                                onClick={() => handleDownloadPdf(c)}
                                disabled={pdfBusyId === c._id}
                                className="px-6 py-3 rounded-full bg-[rgba(255,255,255,0.48)] text-[#7A5030] font-bold text-sm hover:bg-[rgba(255,255,255,0.65)] transition-colors border border-[#EDD9BC] disabled:opacity-40 inline-flex items-center justify-center gap-2"
                            >
                                <Download size={14} />
                                Download PDF
                            </button>

                            {['requested', 'sent', 'viewed', 'pending'].includes(c.status) && (
                                <button
                                    onClick={() => action(c._id, 'accept')}
                                    disabled={acting}
                                    className="flex-1 py-3 rounded-full bg-[#C2340A] text-white font-bold text-sm hover:bg-[#E8400A] transition-all disabled:opacity-40"
                                >
                                    Accept ${Number(c.pricing?.brandOffer || 0).toLocaleString()}
                                </button>
                            )}

                            {['requested', 'sent', 'viewed', 'pending'].includes(c.status) && (
                                <button
                                    onClick={() => action(c._id, 'decline')}
                                    disabled={acting}
                                    className="px-6 py-3 rounded-full bg-[#C2340A]/10 text-[#C2340A] font-bold text-sm hover:bg-[#C2340A]/15 transition-colors border border-[#EDD9BC] disabled:opacity-40"
                                >
                                    Reject
                                </button>
                            )}
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

            {/* ── IN PRODUCTION TAB ── */}
            {activeTab === 1 && renderCampaignTable(collabs, 'production')}

            {/* ── ONGOING TAB ── */}
            {activeTab === 2 && renderCampaignTable(collabs, 'ongoing')}

            {!loading && collabs.length === 0 && (
                <div className="text-center py-16 bg-[rgba(255,255,255,0.38)] border border-[#EDD9BC] rounded-[14px] backdrop-blur-[12px]">
                    <svg className="w-12 h-12 text-[#C4A882] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p className="text-[#1A0A00] font-bold text-lg mb-1">
                        {activeTab === 0
                            ? 'No Requested Campaigns'
                            : activeTab === 1
                            ? 'No In Production Campaigns'
                            : 'No Ongoing Campaigns'}
                    </p>
                    <p className="text-[#7A5030] text-sm">
                        {activeTab === 0
                            ? "You're all caught up on your collaboration requests."
                            : activeTab === 1
                            ? "You don't have any campaigns in production right now."
                            : "Live campaigns will appear here once they’re running."}
                    </p>
                </div>
            )}
        </div>
    );
}
