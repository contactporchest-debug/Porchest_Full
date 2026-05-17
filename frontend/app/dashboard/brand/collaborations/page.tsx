'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Calendar, Download, ExternalLink, FileText, Loader2, PauseCircle, PencilLine, ShieldCheck } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GlassCard, GlowButton } from '@/components/ui';
import { brandAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';

type Collaboration = {
    _id: string;
    status: string;
    campaignTitle?: string;
    campaignDescription?: string;
    agreedPrice?: number;
    brandOfferedFee?: number;
    influencerName?: string;
    influencerProfile?: { fullName?: string; igUsername?: string; profilePictureURL?: string };
    influencerUsername?: string;
    brief?: {
        trackingLink?: string;
        promoCode?: string;
        postingDeadline?: string;
    };
    pricing?: {
        agreedFee?: number;
        brandOffer?: number;
    };
    timeline?: {
        campaignEndDate?: string;
    };
    campaignEndAt?: string;
    campaignEndDate?: string;
    postingDeadline?: string;
    acceptedAt?: string;
    sentAt?: string;
    cancelledAt?: string;
    content?: {
        driveLink?: string;
        postLink?: string;
        brandApprovedDrive?: boolean;
    };
    postLink?: string;
    draftDriveLink?: string;
    createdAt?: string;
};

type BrandProfileResponse = {
    profileComplete?: boolean;
};

type TabKey = 'active' | 'accepted' | 'requested';

const TAB_CONFIG: Record<TabKey, { label: string; statuses: string[]; emptyTitle: string; emptyCopy: string }> = {
    active: {
        label: 'Active',
        statuses: ['campaign_active', 'active'],
        emptyTitle: 'No active campaigns yet',
        emptyCopy: 'Once a collaboration is verified and live, it will appear here with live analytics and campaign controls.',
    },
    accepted: {
        label: 'Accepted',
        statuses: ['accepted', 'brand_payment_pending', 'brand_paid_work_can_start', 'content_submitted', 'content_approved', 'posted'],
        emptyTitle: 'No accepted campaigns yet',
        emptyCopy: 'Accepted collaborations will appear here while the influencer is preparing, submitting, or awaiting approval.',
    },
    requested: {
        label: 'Requested',
        statuses: ['pending', 'viewed', 'countered', 'negotiation'],
        emptyTitle: 'No requested campaigns yet',
        emptyCopy: 'Campaign requests that are still waiting on a response will show up here.',
    },
};

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
    pending: { label: 'Requested', bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.22)' },
    viewed: { label: 'Viewed', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.22)' },
    countered: { label: 'Countered', bg: 'rgba(245,158,11,0.12)', color: '#d97706', border: 'rgba(245,158,11,0.25)' },
    negotiation: { label: 'Negotiation', bg: 'rgba(245,158,11,0.12)', color: '#d97706', border: 'rgba(245,158,11,0.25)' },
    accepted: { label: 'Accepted', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.22)' },
    brand_payment_pending: { label: 'Payment Pending', bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.22)' },
    brand_paid_work_can_start: { label: 'Ready to Create', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.22)' },
    content_submitted: { label: 'Content Submitted', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.22)' },
    content_approved: { label: 'Approved', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.22)' },
    posted: { label: 'Posted', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.22)' },
    campaign_active: { label: 'Active', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.22)' },
    completed: { label: 'Completed', bg: 'rgba(194,52,10,0.10)', color: '#C2340A', border: 'rgba(194,52,10,0.22)' },
    cancelled: { label: 'Inactive', bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.22)' },
    declined: { label: 'Declined', bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.22)' },
    active: { label: 'Active', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.22)' },
};

function fmtMoney(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
}

function resolveDeadline(collaboration: Collaboration) {
    return collaboration.campaignEndAt || collaboration.campaignEndDate || collaboration.timeline?.campaignEndDate || collaboration.postingDeadline || collaboration.brief?.postingDeadline || null;
}

function resolveCampaignName(collaboration: Collaboration) {
    return collaboration.campaignTitle || collaboration.campaignDescription || 'Campaign';
}

function resolveInfluencer(collaboration: Collaboration) {
    return collaboration.influencerName || collaboration.influencerProfile?.fullName || collaboration.influencerProfile?.igUsername || collaboration.influencerUsername || 'Unknown';
}

function resolvePrice(collaboration: Collaboration) {
    return collaboration.pricing?.agreedFee ?? collaboration.agreedPrice ?? collaboration.pricing?.brandOffer ?? collaboration.brandOfferedFee ?? 0;
}

function daysSince(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}

function StatusPill({ status }: { status: string }) {
    const meta = STATUS_META[status] || { label: status, bg: 'rgba(255,255,255,0.55)', color: '#7A5030', border: '#EDD9BC' };
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: meta.bg,
                color: meta.color,
                border: `1px solid ${meta.border}`,
            }}
        >
            {meta.label}
        </span>
    );
}

function EditRequirementsModal({
    collaboration,
    onClose,
    onSaved,
}: {
    collaboration: Collaboration | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        campaignTitle: '',
        campaignDescription: '',
        deliverables: '',
        contentGuidelines: '',
        hashtags: '',
        disclosureRequirements: '',
        postingDeadline: '',
        agreedPrice: '',
        paymentTerms: '',
    });

    useEffect(() => {
        if (!collaboration) return;
        setForm({
            campaignTitle: collaboration.campaignTitle || '',
            campaignDescription: collaboration.campaignDescription || '',
            deliverables: Array.isArray((collaboration as any).deliverables)
                ? (collaboration as any).deliverables.join(', ')
                : (collaboration as any).deliverables || '',
            contentGuidelines: (collaboration as any).contentGuidelines || '',
            hashtags: Array.isArray((collaboration as any).hashtags)
                ? (collaboration as any).hashtags.join(', ')
                : ((collaboration as any).hashtags || (collaboration.brief as any)?.hashtags || ''),
            disclosureRequirements: (collaboration as any).disclosureRequirements || '',
            postingDeadline: resolveDeadline(collaboration) ? new Date(resolveDeadline(collaboration) as string).toISOString().slice(0, 10) : '',
            agreedPrice: String(resolvePrice(collaboration) || ''),
            paymentTerms: (collaboration as any).paymentTerms || '',
        });
    }, [collaboration]);

    const onSubmit = async () => {
        if (!collaboration) return;
        try {
            setSaving(true);
            await brandAPI.updateCollaborationRequirements(collaboration._id, {
                campaignTitle: form.campaignTitle.trim(),
                campaignDescription: form.campaignDescription.trim(),
                deliverables: form.deliverables,
                contentGuidelines: form.contentGuidelines.trim(),
                hashtags: form.hashtags,
                disclosureRequirements: form.disclosureRequirements.trim(),
                postingDeadline: form.postingDeadline || undefined,
                agreedPrice: form.agreedPrice ? Number(form.agreedPrice) : undefined,
                paymentTerms: form.paymentTerms.trim(),
            });
            toast.success('Requirements updated.');
            onSaved();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to update requirements.');
        } finally {
            setSaving(false);
        }
    };

    if (!collaboration) return null;

    const fieldStyle = {
        width: '100%',
        borderRadius: '12px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.75)',
        padding: '12px 14px',
        fontFamily: 'inherit',
        color: '#1A0A00',
        outline: 'none',
        fontSize: '14px',
    } as const;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 60,
                background: 'rgba(26,10,0,0.35)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 'min(920px, 100%)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    borderRadius: '24px',
                    border: '1px solid #EDD9BC',
                    background: '#FDF6EE',
                    boxShadow: '0 24px 80px rgba(26,10,0,0.18)',
                    padding: '28px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Edit Requirements</p>
                        <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1A0A00', marginTop: '6px' }}>{resolveCampaignName(collaboration)}</h3>
                        <p style={{ fontSize: '14px', color: '#7A5030', marginTop: '6px', lineHeight: 1.6 }}>
                            Update the brief, timing, and approval requirements for this campaign. Existing tracking assets stay intact.
                        </p>
                    </div>
                    <GlowButton variant="outline" onClick={onClose}>Close</GlowButton>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    {[
                        { label: 'Campaign Name', key: 'campaignTitle' },
                        { label: 'Campaign Description', key: 'campaignDescription' },
                        { label: 'Deliverables', key: 'deliverables' },
                        { label: 'Content Guidelines', key: 'contentGuidelines' },
                        { label: 'Hashtags', key: 'hashtags' },
                        { label: 'Disclosure Requirements', key: 'disclosureRequirements' },
                        { label: 'Posting Deadline', key: 'postingDeadline', type: 'date' },
                        { label: 'Price', key: 'agreedPrice', type: 'number' },
                        { label: 'Payment Terms', key: 'paymentTerms' },
                    ].map((field) => (
                        <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{field.label}</span>
                            {field.key === 'campaignDescription' || field.key === 'contentGuidelines' || field.key === 'deliverables' || field.key === 'hashtags' || field.key === 'disclosureRequirements' || field.key === 'paymentTerms' ? (
                                <textarea
                                    value={(form as any)[field.key]}
                                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value } as any))}
                                    rows={field.key === 'campaignDescription' || field.key === 'contentGuidelines' ? 4 : 3}
                                    style={{ ...fieldStyle, resize: 'vertical', minHeight: field.key === 'campaignDescription' ? '120px' : undefined }}
                                />
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    value={(form as any)[field.key]}
                                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value } as any))}
                                    style={fieldStyle}
                                />
                            )}
                        </label>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                    <GlowButton variant="outline" onClick={onClose}>Cancel</GlowButton>
                    <GlowButton onClick={onSubmit} loading={saving}>Save changes</GlowButton>
                </div>
            </div>
        </div>
    );
}

function CollaborationTable({
    collaborations,
    tabKey,
    onRefresh,
    onEdit,
    onOpenAnalytics,
}: {
    collaborations: Collaboration[];
    tabKey: TabKey;
    onRefresh: () => Promise<void>;
    onEdit: (collaboration: Collaboration) => void;
    onOpenAnalytics: (id: string) => void;
}) {
    const [busyId, setBusyId] = useState<string | null>(null);

    const downloadPdf = async (id: string, campaignName: string) => {
        try {
            setBusyId(id);
            const res = await brandAPI.downloadCollaborationPdf(id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${campaignName.replace(/[^a-z0-9-_]+/gi, '_').replace(/_+/g, '_').toLowerCase() || 'collaboration'}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF download started.');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to download PDF.');
        } finally {
            setBusyId(null);
        }
    };

    const stopCampaign = async (collaboration: Collaboration) => {
        const ok = window.confirm(`Stop "${resolveCampaignName(collaboration)}"? This will mark the campaign as inactive.`);
        if (!ok) return;
        try {
            setBusyId(collaboration._id);
            await brandAPI.stopCollaboration(collaboration._id, 'Stopped from the brand collaboration page');
            toast.success('Campaign stopped.');
            await onRefresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to stop campaign.');
        } finally {
            setBusyId(null);
        }
    };

    const verifyContent = async (id: string) => {
        try {
            setBusyId(id);
            await brandAPI.verifyCollaborationContent(id);
            toast.success('Content verified.');
            await onRefresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to verify content.');
        } finally {
            setBusyId(null);
        }
    };

    if (!collaborations.length) {
        const cfg = TAB_CONFIG[tabKey];
        return (
            <GlassCard style={{ textAlign: 'center' }}>
                <FileText size={42} style={{ color: '#C4A882', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A0A00' }}>{cfg.emptyTitle}</h3>
                <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030', lineHeight: 1.7, maxWidth: '640px', marginInline: 'auto' }}>{cfg.emptyCopy}</p>
            </GlassCard>
        );
    }

    return (
        <GlassCard padding="0">
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '980px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.5)' }}>
                            {['Campaign Name', 'Collaborated Influencer', 'Price', 'Deadline', 'Status', 'Actions'].map((heading) => (
                                <th key={heading} style={{ textAlign: 'left', padding: '18px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A5030', fontWeight: 700, borderBottom: '1px solid #EDD9BC' }}>
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {collaborations.map((collaboration, index) => {
                            const price = resolvePrice(collaboration);
                            const deadline = resolveDeadline(collaboration);
                            const isActive = tabKey === 'active';
                            const isAccepted = tabKey === 'accepted';
                            const isRequested = tabKey === 'requested';
                            const canOpenDrive = Boolean((collaboration.content?.driveLink || collaboration.draftDriveLink) && isAccepted);
                            const canViewPost = Boolean((collaboration.content?.postLink || collaboration.postLink) && isActive);
                            const canVerify = isAccepted && collaboration.content?.driveLink && !collaboration.content?.brandApprovedDrive;
                            const requestAge = daysSince(collaboration.sentAt || collaboration.createdAt);
                            const acceptanceAge = daysSince(collaboration.acceptedAt || collaboration.createdAt);
                            const activeAge = daysSince(collaboration.campaignActiveAt || collaboration.campaignStartAt || collaboration.acceptedAt || collaboration.createdAt);

                            return (
                                <tr
                                    key={collaboration._id}
                                    style={{
                                        background: index % 2 === 0 ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.48)',
                                    }}
                                >
                                    <td style={{ padding: '18px 20px', borderBottom: '1px solid rgba(237,217,188,0.8)' }}>
                                        <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A0A00' }}>{resolveCampaignName(collaboration)}</p>
                                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>{collaboration.campaignDescription || 'Campaign collaboration'}</p>
                                    </td>
                                    <td style={{ padding: '18px 20px', borderBottom: '1px solid rgba(237,217,188,0.8)' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>{resolveInfluencer(collaboration)}</p>
                                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Influencer partner</p>
                                    </td>
                                    <td style={{ padding: '18px 20px', borderBottom: '1px solid rgba(237,217,188,0.8)' }}>
                                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#C2340A' }}>{fmtMoney(price)}</p>
                                    </td>
                                    <td style={{ padding: '18px 20px', borderBottom: '1px solid rgba(237,217,188,0.8)' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} color="#C4A882" />
                                            {fmtDate(deadline)}
                                        </p>
                                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#7A5030' }}>
                                            {isActive && activeAge !== null ? `${activeAge} day${activeAge === 1 ? '' : 's'} running` : null}
                                            {isRequested && requestAge !== null ? `${requestAge} day${requestAge === 1 ? '' : 's'} since request` : null}
                                            {isAccepted && acceptanceAge !== null ? `${acceptanceAge} day${acceptanceAge === 1 ? '' : 's'} since acceptance` : null}
                                        </p>
                                    </td>
                                    <td style={{ padding: '18px 20px', borderBottom: '1px solid rgba(237,217,188,0.8)' }}>
                                        <StatusPill status={collaboration.status} />
                                    </td>
                                    <td style={{ padding: '18px 20px', borderBottom: '1px solid rgba(237,217,188,0.8)' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            <GlowButton size="sm" variant="outline" onClick={() => downloadPdf(collaboration._id, resolveCampaignName(collaboration))} loading={busyId === collaboration._id}>
                                                <Download size={14} />
                                                Download PDF
                                            </GlowButton>

                                            {isActive && (
                                                <GlowButton size="sm" onClick={() => onOpenAnalytics(collaboration._id)}>
                                                    <ShieldCheck size={14} />
                                                    View Analytics
                                                </GlowButton>
                                            )}

                                            {isActive && (
                                                <GlowButton size="sm" variant="danger" onClick={() => stopCampaign(collaboration)} loading={busyId === collaboration._id}>
                                                    <PauseCircle size={14} />
                                                    Stop Campaign
                                                </GlowButton>
                                            )}

                                            {canViewPost && (
                                                <GlowButton
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(collaboration.content?.postLink || collaboration.postLink || '#', '_blank', 'noopener,noreferrer')}
                                                >
                                                    <ExternalLink size={14} />
                                                    View Posted Content
                                                </GlowButton>
                                            )}

                                            {(isAccepted || isRequested) && (
                                                <GlowButton size="sm" onClick={() => onEdit(collaboration)}>
                                                    <PencilLine size={14} />
                                                    Edit Requirements
                                                </GlowButton>
                                            )}

                                            {isRequested && (
                                                <GlowButton size="sm" variant="danger" onClick={() => stopCampaign(collaboration)} loading={busyId === collaboration._id}>
                                                    <PauseCircle size={14} />
                                                    Reject / Withdraw
                                                </GlowButton>
                                            )}

                                            {canOpenDrive && (
                                                <GlowButton
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(collaboration.content?.driveLink || collaboration.draftDriveLink || '#', '_blank', 'noopener,noreferrer')}
                                                >
                                                    <ExternalLink size={14} />
                                                    Open Drive Link
                                                </GlowButton>
                                            )}

                                            {canVerify && (
                                                <GlowButton size="sm" onClick={() => verifyContent(collaboration._id)} loading={busyId === collaboration._id}>
                                                    <ShieldCheck size={14} />
                                                    Verify Content
                                                </GlowButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
}

export default function BrandCollaborationsPage() {
    const router = useRouter();
    const { data: profile, loading: profileLoading } = useApi<BrandProfileResponse>('/profile/brand/me');
    const [activeTab, setActiveTab] = useState<TabKey>('active');
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Collaboration | null>(null);

    const profileComplete = !!profile?.profileComplete;
    const tab = TAB_CONFIG[activeTab];

    const fetchCollaborations = async (tabKey: TabKey = activeTab) => {
        try {
            setLoading(true);
            setError(null);
            const response = await brandAPI.getCollaborations({ status: TAB_CONFIG[tabKey].statuses.join(',') });
            setCollaborations(response.data.collaborations || []);
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to load collaborations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!profileLoading && profileComplete) {
            void fetchCollaborations(activeTab);
        }
    }, [activeTab, profileComplete, profileLoading]);

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {profileLoading ? (
                    <GlassCard>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#7A5030' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            Loading profile...
                        </div>
                    </GlassCard>
                ) : !profileComplete ? (
                    <GlassCard>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={18} color="#E8400A" />
                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#E8400A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Profile incomplete</p>
                            </div>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A0A00' }}>Complete your profile first</h1>
                                <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030', lineHeight: 1.7, maxWidth: '760px' }}>
                                    Finish your profile to unlock collaboration management, campaign controls, and analytics.
                                </p>
                            </div>
                            <GlowButton onClick={() => router.push('/dashboard/brand/profile')}>Go to Profile</GlowButton>
                        </div>
                    </GlassCard>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand Portal</p>
                            <h1 style={{ fontSize: '32px', lineHeight: 1.05, fontWeight: 900, color: '#1A0A00', letterSpacing: '-0.03em' }}>Collaborations</h1>
                            <p style={{ fontSize: '15px', color: '#7A5030', maxWidth: '760px', lineHeight: 1.7 }}>
                                Review requests, manage accepted campaigns, and control active collaborations from one table-driven workspace.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {(Object.keys(TAB_CONFIG) as TabKey[]).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    style={{
                                        border: '1px solid',
                                        borderColor: activeTab === key ? '#C2340A' : '#EDD9BC',
                                        background: activeTab === key ? '#C2340A' : 'rgba(255,255,255,0.55)',
                                        color: activeTab === key ? '#fff' : '#7A5030',
                                        borderRadius: '999px',
                                        padding: '10px 18px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        fontFamily: 'inherit',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        boxShadow: activeTab === key ? '0 8px 24px rgba(194,52,10,0.15)' : 'none',
                                    }}
                                >
                                    {TAB_CONFIG[key].label}
                                </button>
                            ))}
                        </div>

                        {error ? (
                            <GlassCard>
                                <div style={{ color: '#dc2626', fontSize: '14px', fontWeight: 600 }}>{error}</div>
                                <div style={{ marginTop: '16px' }}>
                                    <GlowButton onClick={() => fetchCollaborations(activeTab)}>Retry</GlowButton>
                                </div>
                            </GlassCard>
                        ) : null}

                        {loading ? (
                            <GlassCard>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#7A5030' }}>
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    Loading {tab.label.toLowerCase()} collaborations...
                                </div>
                            </GlassCard>
                        ) : (
                            <CollaborationTable
                                collaborations={collaborations}
                                tabKey={activeTab}
                                onRefresh={() => fetchCollaborations(activeTab)}
                                onEdit={setEditing}
                                onOpenAnalytics={(id) => router.push(`/dashboard/brand/collaborations/${id}/analytics`)}
                            />
                        )}
                    </div>
                )}

                <AnimatePresence>
                    {editing ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 60 }}
                        >
                            <EditRequirementsModal
                                collaboration={editing}
                                onClose={() => setEditing(null)}
                                onSaved={() => fetchCollaborations(activeTab)}
                            />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
