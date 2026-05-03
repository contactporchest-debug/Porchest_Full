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
    pending:          { bg: 'background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.2)',      color: 'color: #0284c7',      label: 'Pending' },
    countered:        { bg: 'background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2)',    color: 'color: #d97706',     label: 'Countered' },
    accepted:         { bg: 'background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2)',    color: 'color: #059669',     label: 'Accepted' },
    active:           { bg: 'background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2)',    color: 'color: #059669',     label: 'Active' },
    content_submitted:{ bg: 'background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.2)',  color: 'color: #0284c7',    label: 'Content submitted' },
    content_approved: { bg: 'background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.2)',  color: 'color: #0284c7',    label: 'Content approved' },
    posted:           { bg: 'background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2)',    color: 'color: #d97706',     label: 'Posted' },
    completed:        { bg: 'background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2)',    color: 'color: #059669',     label: 'Completed' },
    declined:         { bg: 'background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2)',        color: 'color: #dc2626',       label: 'Declined' },
};

function StatusBadge({ status }) {
    let s = STATUS_BADGE[status];
    if (!s) {
        return (
            <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', color: '#7A5030' }}>
                {status}
            </span>
        );
    }
    const inlineStyle = Object.fromEntries(s.bg.split(';').map(x => x.trim()).filter(Boolean).map(x => { const [k,v]=x.split(':'); return [k.trim().replace(/-./g, x=>x[1].toUpperCase()), v.trim()]}));
    const colorStyle = Object.fromEntries(s.color.split(';').map(x => x.trim()).filter(Boolean).map(x => { const [k,v]=x.split(':'); return [k.trim(), v.trim()]}));

    return (
        <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid transparent', ...inlineStyle, ...colorStyle }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '8px', padding: '6px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', width: 'fit-content' }}>
                {TABS.map((tab, i) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(i)}
                        style={{
                            padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, transition: 'all 0.15s', cursor: 'pointer', border: 'none',
                            background: activeTab === i ? '#C2340A' : 'transparent',
                            color: activeTab === i ? '#fff' : '#7A5030',
                            fontFamily: 'inherit'
                        }}
                        onMouseEnter={e => { if (activeTab !== i) e.currentTarget.style.color = '#1A0A00'; }}
                        onMouseLeave={e => { if (activeTab !== i) e.currentTarget.style.color = '#7A5030'; }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <p style={{ color: '#7A5030', fontSize: '14px', fontWeight: 500 }}>Loading...</p>}

            {collabs.map((c, i) => (
                <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(26,10,0,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = '#EDD9BC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)'; }}
                >
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {c.influencerProfile?.profilePictureURL ? (
                                <img src={c.influencerProfile.profilePictureURL} alt="" style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#C2340A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '20px', flexShrink: 0 }}>
                                    {(c.influencerUsername || c.influencerProfile?.igUsername || 'C')[0].toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p style={{ color: '#1A0A00', fontWeight: 700, fontSize: '18px' }}>
                                    {c.brief?.campaignObjective || c.campaignTitle || 'Collaboration'}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#C2340A' }}>
                                        @{c.influencerProfile?.igUsername || c.influencerUsername || 'creator'}
                                    </p>
                                    <span style={{ color: '#EDD9BC' }}>•</span>
                                    <p style={{ fontSize: '12px', color: '#7A5030' }}>
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: '#C4A882', lineHeight: 1 }}>
                                ${Number(c.pricing?.agreedFee || c.pricing?.brandOffer || 0).toLocaleString()}
                            </p>
                            <StatusBadge status={c.status} />
                        </div>
                    </div>

                    {/* ── REQUESTS TAB ── Countered by influencer */}
                    {c.status === 'countered' && c.pricing?.influencerCounter && (
                        <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Your offer</p>
                                    <p style={{ color: '#d97706', fontWeight: 700, fontSize: '20px', textDecoration: 'line-through' }}>
                                        ${Number(c.pricing.brandOffer || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ color: '#d97706' }}>
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Influencer counter</p>
                                    <p style={{ color: '#b45309', fontWeight: 700, fontSize: '24px' }}>
                                        ${Number(c.pricing.influencerCounter).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => action(c._id, 'accept-counter')}
                                    disabled={acting}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#0284c7', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { if (!acting) e.currentTarget.style.background = '#0369a1'; }}
                                    onMouseLeave={e => { if (!acting) e.currentTarget.style.background = '#0284c7'; }}
                                >
                                    Accept Counter (${Number(c.pricing.influencerCounter).toLocaleString()})
                                </button>
                                <button
                                    onClick={() => action(c._id, 'decline')}
                                    disabled={acting}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.06)', color: '#dc2626', fontSize: '14px', fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { if (!acting) e.currentTarget.style.background = 'rgba(220,38,38,0.12)'; }}
                                    onMouseLeave={e => { if (!acting) e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── ACTIVE TAB ── Content submitted for review */}
                    {c.status === 'content_submitted' && c.content?.driveLink && (
                        <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(2,132,199,0.06)', border: '1px solid rgba(2,132,199,0.12)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(2,132,199,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </div>
                                <div style={{ paddingTop: '6px', flex: 1, minWidth: 0 }}>
                                    <p style={{ color: '#0369a1', fontWeight: 700, fontSize: '14px' }}>Review Submitted Content</p>
                                    <a
                                        href={c.content.driveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#0284c7', fontSize: '14px', textDecoration: 'underline', wordBreak: 'break-all', display: 'block', marginTop: '4px' }}
                                    >
                                        {c.content.driveLink}
                                    </a>
                                </div>
                            </div>
                            <button
                                onClick={() => action(c._id, 'approve-drive')}
                                disabled={acting}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#059669', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
                                onMouseEnter={e => { if (!acting) e.currentTarget.style.background = '#047857'; }}
                                onMouseLeave={e => { if (!acting) e.currentTarget.style.background = '#059669'; }}
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Approve Content — Clear for Posting
                            </button>
                        </div>
                    )}

                    {/* Content approved — waiting for live post */}
                    {c.status === 'content_approved' && (
                        <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.12)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(5,150,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div style={{ paddingTop: '6px' }}>
                                <p style={{ color: '#047857', fontWeight: 700, fontSize: '14px' }}>Content Approved</p>
                                <p style={{ color: 'rgba(4,120,87,0.7)', fontSize: '12px', marginTop: '2px' }}>Waiting for the influencer to post the content live.</p>
                            </div>
                        </div>
                    )}

                    {/* Post submitted — admin verifying */}
                    {c.status === 'posted' && c.content?.postLink && (
                        <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div style={{ paddingTop: '4px', flex: 1, minWidth: 0 }}>
                                <p style={{ color: '#b45309', fontWeight: 700, fontSize: '14px' }}>Live Post Submitted</p>
                                <p style={{ color: 'rgba(180,83,9,0.7)', fontSize: '12px', marginTop: '2px', marginBottom: '8px' }}>Our admins are currently reviewing the live post for compliance.</p>
                                <a
                                    href={c.content.postLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#d97706', fontSize: '14px', textDecoration: 'underline', wordBreak: 'break-all', fontWeight: 500 }}
                                >
                                    {c.content.postLink}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Tracking assets */}
                    {c.brief?.trackingLink && (
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign tracking assets</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#C4A882', width: '48px', flexShrink: 0 }}>Link</span>
                                    <p style={{ fontSize: '14px', color: '#1A0A00', fontFamily: 'monospace', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, background: 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #EDD9BC' }}>{c.brief.trackingLink}</p>
                                </div>
                                {c.brief?.promoCode && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#C4A882', width: '48px', flexShrink: 0 }}>Code</span>
                                        <p style={{ fontSize: '14px', color: '#1A0A00', fontFamily: 'monospace', fontWeight: 700, background: 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #EDD9BC', display: 'inline-block' }}>{c.brief.promoCode}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metrics — shown for active and beyond */}
                    {['accepted', 'active', 'content_submitted', 'content_approved', 'posted', 'completed'].includes(c.status) && (
                        <div style={{ paddingTop: '8px' }}>
                            <CollaborationMetrics collaborationId={c._id} />
                        </div>
                    )}
                </motion.div>
            ))}

            {!loading && collabs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px 20px', background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.65)', borderRadius: '24px' }}>
                    <svg width="48" height="48" style={{ color: '#C4A882', margin: '0 auto 16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p style={{ color: '#1A0A00', fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>
                        {activeTab === 0
                            ? 'No Pending Requests'
                            : activeTab === 1
                            ? 'No Active Campaigns'
                            : 'No Completed Campaigns'}
                    </p>
                    <p style={{ color: '#7A5030', fontSize: '14px' }}>
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
