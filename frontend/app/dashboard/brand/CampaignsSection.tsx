'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Calendar, DollarSign, Loader2, FileText } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    pending: { color: '#fbbf24', label: 'Pending', icon: <Clock size={11} /> },
    accepted: { color: '#4ade80', label: 'Accepted', icon: <CheckCircle size={11} /> },
    rejected: { color: '#f87171', label: 'Rejected', icon: <XCircle size={11} /> },
};

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
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
            <Loader2 size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
        </div>
    );

    if (requests.length === 0) return (
        <div className="glass-card" style={{ padding: '60px', borderRadius: '28px', textAlign: 'center' }}>
            <FileText size={44} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '6px' }}>No Campaign Requests Yet</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Go to "Discover" to find influencers and send your first request.</p>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: '#fff', marginBottom: '4px' }}>Campaign Requests</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{requests.length} sent · {requests.filter(r => r.status === 'accepted').length} accepted</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {requests.map((r, i) => {
                    const sc = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                    const inf = r.influencerId;
                    const initials = (inf?.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                    const isOpen = expanded === r._id;

                    return (
                        <motion.div key={r._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.35 }}
                            className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden', border: r.status === 'accepted' ? '1px solid rgba(74,222,128,0.2)' : undefined }}>

                            {/* Summary row */}
                            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', cursor: 'pointer' }}
                                onClick={() => setExpanded(isOpen ? null : r._id)}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px', color: '#fff', boxShadow: '0 0 16px rgba(123,63,242,0.4)', flexShrink: 0 }}>{initials}</div>
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff', marginBottom: '2px' }}>{r.campaignTitle}</p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{inf?.fullName || 'Unknown'} · {inf?.niche || '—'}</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: '12px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.18)' }}>
                                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '1px' }}>Agreed Price</p>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '16px', color: '#a78bfa' }}>${r.agreedPrice?.toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                    <Calendar size={12} style={{ color: '#60d5f8' }} />
                                    {new Date(r.postingDeadline).toLocaleDateString()}
                                </div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 13px', borderRadius: '99px', background: `${sc.color}15`, border: `1px solid ${sc.color}30`, color: sc.color, fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
                                    {sc.icon} {sc.label}
                                </span>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{isOpen ? '▲' : '▼'}</span>
                            </div>

                            {/* Expanded details */}
                            {isOpen && (
                                <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '10px' }}>
                                        {[
                                            { label: 'Deliverables', val: r.deliverables },
                                            { label: 'Required Elements', val: r.requiredElements },
                                            { label: 'Video Length', val: r.videoLength },
                                            { label: 'Payment Terms', val: r.paymentTerms },
                                            { label: 'Hashtags', val: r.hashtags || '—' },
                                            { label: 'Disclosure', val: r.disclosureRequirements },
                                        ].map(f => (
                                            <div key={f.label} style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{f.label}</p>
                                                <p style={{ fontSize: '13px', color: '#fff' }}>{f.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Content Guidelines</p>
                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>{r.contentGuidelines}</p>
                                    </div>
                                    {r.rejectionReason && (
                                        <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)' }}>
                                            <p style={{ fontSize: '11px', color: '#f87171' }}>Rejection reason: {r.rejectionReason}</p>
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
