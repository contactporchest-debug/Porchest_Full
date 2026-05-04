'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Calendar, DollarSign, Loader2, FileText } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    pending: { color: '#d97706', label: 'Pending', icon: <Clock size={12} /> },
    accepted: { color: '#059669', label: 'Accepted', icon: <CheckCircle size={12} /> },
    brand_payment_pending: { color: '#d97706', label: 'Payment pending', icon: <Clock size={12} /> },
    brand_paid_work_can_start: { color: '#059669', label: 'Payment confirmed', icon: <CheckCircle size={12} /> },
    campaign_active: { color: '#059669', label: 'Campaign active', icon: <CheckCircle size={12} /> },
    rejected: { color: '#be185d', label: 'Rejected', icon: <XCircle size={12} /> },
};
const SURFACE = 'rgba(255,255,255,0.4)';
const SURFACE_ALT = 'rgba(255,255,255,0.6)';
const BORDER = '#EDD9BC';
const TEXT = '#1A0A00';
const MUTED = '#7A5030';
const PRIMARY = '#C2340A';

export default function CampaignsSection() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        brandAPI.getRequests()
            .then(res => setRequests(res.data.requests || []))
            .catch(() => toast.error('Failed to load campaign requests'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: MUTED }}>
            <Loader2 size={32} style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite', color: PRIMARY }} />
        </div>
    );

    if (requests.length === 0) return (
        <div style={{ padding: '64px', borderRadius: '24px', textAlign: 'center', background: SURFACE, border: `1px solid ${BORDER}` }}>
            <FileText size={48} style={{ color: '#C4A882', margin: '0 auto 20px' }} />
            <p style={{ fontWeight: 800, fontSize: '18px', color: TEXT, marginBottom: '8px' }}>No Campaign Requests Yet</p>
            <p style={{ color: MUTED, fontSize: '14px' }}>Go to "Discover" to find influencers and send your first request.</p>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontWeight: 800, fontSize: '20px', color: TEXT, marginBottom: '4px' }}>Campaign Requests</h2>
                    <p style={{ fontSize: '14px', color: MUTED, fontWeight: 500 }}>{requests.length} sent · {requests.filter(r => ['accepted', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(r.status)).length} active</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {requests.map((r, i) => {
                    const sc = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                    const inf = r.influencerId;
                    const initials = (inf?.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                    const isOpen = expanded === r._id;

                    return (
                        <motion.div key={r._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.35 }}
                            style={{ borderRadius: '20px', overflow: 'hidden', background: SURFACE, backdropFilter: 'blur(12px)', border: ['accepted', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(r.status) ? '1px solid rgba(5,150,105,0.3)' : `1px solid ${BORDER}`, boxShadow: '0 4px 20px rgba(26,10,0,0.02)', transition: 'border-color 0.2s' }}>

                            {/* Summary row */}
                            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', cursor: 'pointer', background: isOpen ? SURFACE_ALT : 'transparent' }}
                                onClick={() => setExpanded(isOpen ? null : r._id)}
                                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.5)' }}
                                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: '#fff', flexShrink: 0, border: `1px solid ${BORDER}` }}>{initials}</div>
                                <div style={{ flex: 1, minWidth: '160px' }}>
                                    <p style={{ fontWeight: 800, fontSize: '16px', color: TEXT, marginBottom: '4px' }}>{r.campaignTitle}</p>
                                    <p style={{ fontSize: '13px', color: MUTED, fontWeight: 500 }}>{inf?.fullName || 'Unknown'} · {inf?.niche || '—'}</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: `1px solid ${BORDER}` }}>
                                    <p style={{ fontSize: '10px', color: MUTED, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Agreed Price</p>
                                    <p style={{ fontWeight: 800, fontSize: '18px', color: PRIMARY }}>${r.agreedPrice?.toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: MUTED, fontWeight: 500 }}>
                                    <Calendar size={14} style={{ color: '#C4A882' }} />
                                    {new Date(r.postingDeadline).toLocaleDateString()}
                                </div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '99px', background: `${sc.color}15`, border: `1px solid ${sc.color}30`, color: sc.color, fontSize: '12px', fontWeight: 700, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {sc.icon} {sc.label}
                                </span>
                                <span style={{ fontSize: '12px', color: MUTED, padding: '0 8px' }}>{isOpen ? '▲' : '▼'}</span>
                            </div>

                            {/* Expanded details */}
                            {isOpen && (
                                <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `1px solid ${BORDER}`, background: SURFACE_ALT }}>
                                    <div style={{ paddingTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
                                        {[
                                            { label: 'Deliverables', val: r.deliverables },
                                            { label: 'Required Elements', val: r.requiredElements },
                                            { label: 'Video Length', val: r.videoLength },
                                            { label: 'Payment Terms', val: r.paymentTerms },
                                            { label: 'Hashtags', val: r.hashtags || '—' },
                                            { label: 'Disclosure', val: r.disclosureRequirements },
                                        ].map(f => (
                                            <div key={f.label} style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: `1px solid ${BORDER}` }}>
                                                <p style={{ fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontWeight: 700 }}>{f.label}</p>
                                                <p style={{ fontSize: '14px', color: TEXT, fontWeight: 500 }}>{f.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: `1px solid ${BORDER}` }}>
                                        <p style={{ fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontWeight: 700 }}>Content Guidelines</p>
                                        <p style={{ fontSize: '14px', color: TEXT, lineHeight: 1.6 }}>{r.contentGuidelines}</p>
                                    </div>
                                    {r.rejectionReason && (
                                        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(190,24,93,0.1)', border: '1px solid rgba(190,24,93,0.2)' }}>
                                            <p style={{ fontSize: '13px', color: '#be185d', fontWeight: 500 }}><strong>Rejection reason:</strong> {r.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
