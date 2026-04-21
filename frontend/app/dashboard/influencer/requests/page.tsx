'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { influencerAPI } from '@/lib/api';
import {
    Loader2, Inbox, Calendar, DollarSign, Clock, CheckCircle, XCircle,
    MessageSquare, Send, ChevronDown, ChevronUp, Eye, AlertCircle,
    Handshake, X, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    sent: { label: 'New', color: '#60d5f8', bg: 'rgba(96,213,248,0.08)', icon: <Send size={11} /> },
    viewed: { label: 'Viewed', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', icon: <Eye size={11} /> },
    accepted: { label: 'Accepted', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', icon: <CheckCircle size={11} /> },
    rejected: { label: 'Declined', color: '#f87171', bg: 'rgba(248,113,113,0.08)', icon: <XCircle size={11} /> },
    negotiation: { label: 'Negotiation', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', icon: <MessageSquare size={11} /> },
    deal_closed: { label: 'Deal Closed', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: <Handshake size={11} /> },
    expired: { label: 'Expired', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', icon: <Clock size={11} /> },
    cancelled: { label: 'Cancelled', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', icon: <XCircle size={11} /> },
};

function RequestDetailPanel({ request, onRespond, responding }: { request: any; onRespond: (id: string, action: string, data?: any) => void; responding: boolean }) {
    const [counterPrice, setCounterPrice] = useState('');
    const [counterMsg, setCounterMsg] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showNegotiate, setShowNegotiate] = useState(false);
    const [showReject, setShowReject] = useState(false);
    
    // Verification form state
    const [postUrl, setPostUrl] = useState('');
    const [submittingVer, setSubmittingVer] = useState(false);

    const sc = STATUS_CFG[request.status] || STATUS_CFG.sent;
    const canRespond = ['sent', 'viewed'].includes(request.status);
    const canNegotiate = ['sent', 'viewed', 'negotiation'].includes(request.status);
    const isAccepted = request.status === 'accepted';

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postUrl.includes('instagram.com')) return toast.error('Please enter a valid Instagram post URL');
        setSubmittingVer(true);
        try {
            await influencerAPI.submitVerification({ campaignRequestId: request._id, postUrl });
            toast.success('Post submitted for verification!');
            setPostUrl('');
            onRespond(request._id, 'refresh'); // Trigger refresh
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to submit post');
        } finally {
            setSubmittingVer(false);
        }
    };

    const fields = [
        { label: 'Campaign Type', val: request.campaignType?.replace(/_/g, ' ') },
        { label: 'Deliverables', val: request.deliverables },
        { label: 'Agreed Price', val: request.agreedPrice ? `$${request.agreedPrice.toLocaleString()}` : `$${request.budgetRangeMin?.toLocaleString() || '—'} – $${request.budgetRangeMax?.toLocaleString() || '—'}` },
        { label: 'Posting Deadline', val: request.postingDeadline ? new Date(request.postingDeadline).toLocaleDateString() : '—' },
        { label: 'Start Date', val: request.campaignStartDate ? new Date(request.campaignStartDate).toLocaleDateString() : '—' },
        { label: 'End Date', val: request.campaignEndDate ? new Date(request.campaignEndDate).toLocaleDateString() : '—' },
        { label: 'Hashtags', val: request.hashtags || '—' },
        { label: 'Disclosure', val: request.disclosureRequirements || '#Ad #Sponsored' },
        { label: 'Payment Terms', val: request.paymentTerms || '—' },
    ].filter(f => f.val && f.val !== '—');

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }} style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Verification Submission (only if accepted) */}
                {isAccepted && (
                    <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={16} style={{ color: '#4ade80' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '800', color: '#fff', fontFamily: 'Space Grotesk' }}>Submit for Verification</p>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>Post the content on Instagram and paste the URL below to get paid.</p>
                            </div>
                        </div>
                        <form onSubmit={handleVerifySubmit} style={{ display: 'flex', gap: '10px' }}>
                            <input required value={postUrl} onChange={e => setPostUrl(e.target.value)}
                                placeholder="https://www.instagram.com/p/..." className="input-dark" 
                                style={{ flex: 1, height: '44px', background: 'rgba(0,0,0,0.2)', fontSize: '13px' }} />
                            <button type="submit" disabled={submittingVer}
                                style={{ padding: '0 20px', borderRadius: '12px', background: '#22c55e', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                {submittingVer ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Submit
                            </button>
                        </form>
                    </div>
                )}

                {/* Brand message */}
                {request.brandMessage && (
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.15)' }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Message from Brand</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7' }}>{request.brandMessage}</p>
                    </div>
                )}

                {/* Campaign description */}
                {request.campaignDescription && (
                    <div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Campaign Description</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7' }}>{request.campaignDescription}</p>
                    </div>
                )}

                {/* Campaign details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                    {fields.map(f => (
                        <div key={f.label} style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{f.label}</p>
                            <p style={{ fontSize: '13px', color: '#fff', fontWeight: '600', textTransform: 'capitalize' }}>{f.val}</p>
                        </div>
                    ))}
                </div>

                {/* Content Guidelines */}
                {request.contentGuidelines && (
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(96,213,248,0.05)', border: '1px solid rgba(96,213,248,0.12)' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Content Guidelines</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>{request.contentGuidelines}</p>
                    </div>
                )}

                {/* Counter offer (if in negotiation) */}
                {request.status === 'negotiation' && request.counterOfferPrice && (
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <p style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700', marginBottom: '6px' }}>Your Counter Offer</p>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: '#fbbf24' }}>${request.counterOfferPrice.toLocaleString()}</p>
                        {request.counterOfferMessage && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{request.counterOfferMessage}</p>}
                    </div>
                )}

                {/* Action buttons */}
                {(canRespond || canNegotiate) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {canRespond && (
                                <button onClick={() => onRespond(request._id, 'accepted')} disabled={responding}
                                    style={{ flex: 1, padding: '12px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #22c55e, #4ade80)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: responding ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: '0 0 24px rgba(74,222,128,0.25)', fontFamily: 'inherit', opacity: responding ? 0.6 : 1 }}>
                                    <CheckCircle size={14} /> Accept Request
                                </button>
                            )}
                            {canNegotiate && (
                                <button onClick={() => { setShowNegotiate(!showNegotiate); setShowReject(false); }}
                                    style={{ flex: 1, padding: '12px 20px', borderRadius: '14px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontFamily: 'inherit' }}>
                                    <MessageSquare size={14} /> Counter Offer
                                </button>
                            )}
                            {canRespond && (
                                <button onClick={() => { setShowReject(!showReject); setShowNegotiate(false); }}
                                    style={{ padding: '12px 20px', borderRadius: '14px', background: 'transparent', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontFamily: 'inherit' }}>
                                    <XCircle size={14} /> Decline
                                </button>
                            )}
                        </div>

                        {/* Negotiate form */}
                        <AnimatePresence>
                            {showNegotiate && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '18px', borderRadius: '16px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                                        <p style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700', marginBottom: '12px' }}>Send a Counter Offer</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '12px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Your Price (USD)</label>
                                                <input type="number" min={0} value={counterPrice} onChange={e => setCounterPrice(e.target.value)}
                                                    placeholder="e.g. 500" className="input-dark" style={{ fontSize: '14px', height: '42px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Message (optional)</label>
                                                <input value={counterMsg} onChange={e => setCounterMsg(e.target.value)}
                                                    placeholder="Explain your offer…" className="input-dark" style={{ fontSize: '13px', height: '42px' }} />
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            if (!counterPrice) return toast.error('Enter your counter offer price');
                                            onRespond(request._id, 'negotiation', { counterOfferPrice: Number(counterPrice), counterOfferMessage: counterMsg });
                                        }} disabled={responding}
                                            style={{ padding: '10px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                                            <Send size={13} /> Send Counter Offer
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reject form */}
                        <AnimatePresence>
                            {showReject && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '18px', borderRadius: '16px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}>
                                        <p style={{ fontSize: '12px', color: '#f87171', fontWeight: '700', marginBottom: '12px' }}>Decline Request</p>
                                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Reason (optional)</label>
                                        <input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                            placeholder="e.g. Not aligned with my content…" className="input-dark" style={{ fontSize: '13px', height: '42px', marginBottom: '12px' }} />
                                        <button onClick={() => onRespond(request._id, 'rejected', { rejectionReason })} disabled={responding}
                                            style={{ padding: '10px 24px', borderRadius: '12px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                                            <XCircle size={13} /> Confirm Decline
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function InfluencerRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [responding, setResponding] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        influencerAPI.getRequests()
            .then(res => setRequests(res.data.requests || []))
            .catch(() => toast.error('Failed to load requests'))
            .finally(() => setLoading(false));
    }, []);

    const handleRespond = async (id: string, action: string, data?: any) => {
        setResponding(true);
        try {
            const payload = { status: action, ...data };
            await influencerAPI.respondToRequest(id, payload);
            toast.success(action === 'accepted' ? 'Request accepted! 🎉' : action === 'rejected' ? 'Request declined.' : 'Counter offer sent! 💬');
            // Refresh
            const res = await influencerAPI.getRequests();
            setRequests(res.data.requests || []);
        } catch {
            toast.error('Failed to respond to request');
        } finally {
            setResponding(false);
        }
    };

    const FILTERS = [
        { key: 'all', label: 'All', color: '#a78bfa' },
        { key: 'sent,viewed', label: 'New', color: '#60d5f8' },
        { key: 'accepted', label: 'Accepted', color: '#4ade80' },
        { key: 'negotiation', label: 'Negotiation', color: '#fbbf24' },
        { key: 'rejected', label: 'Declined', color: '#f87171' },
        { key: 'deal_closed', label: 'Deals', color: '#4ade80' },
    ];

    const filtered = requests.filter(r => {
        if (filter === 'all') return true;
        const statuses = filter.split(',');
        return statuses.includes(r.status);
    });

    if (loading) return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ textAlign: 'center', padding: '80px' }}>
                    <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '24px', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>
                        Collaboration Requests
                    </h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                        {requests.length} incoming request{requests.length !== 1 ? 's' : ''} from brands
                    </p>
                </motion.div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                    {FILTERS.map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            style={{ padding: '7px 16px', borderRadius: '9px', border: 'none', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 180ms ease', whiteSpace: 'nowrap', background: filter === f.key ? `${f.color}18` : 'transparent', color: filter === f.key ? f.color : 'rgba(255,255,255,0.35)' }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className="glass-card" style={{ padding: '60px', borderRadius: '28px', textAlign: 'center' }}>
                        <Inbox size={48} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 16px' }} />
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '6px' }}>
                            {requests.length === 0 ? 'No requests yet' : 'No matching requests'}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                            {requests.length === 0
                                ? 'Complete your profile to start receiving collaboration requests from brands.'
                                : 'Try adjusting the filter above.'}
                        </p>
                    </div>
                )}

                {/* Request cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AnimatePresence>
                        {filtered.map((r, i) => {
                            const sc = STATUS_CFG[r.status] || STATUS_CFG.sent;
                            const isOpen = expanded === r._id;
                            const isNew = r.status === 'sent';

                            return (
                                <motion.div key={r._id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                    className="glass-card" style={{
                                        borderRadius: '22px', overflow: 'hidden',
                                        border: isNew ? '1px solid rgba(96,213,248,0.2)' : undefined,
                                        boxShadow: isNew ? '0 0 30px rgba(96,213,248,0.08)' : undefined,
                                    }}>

                                    <div onClick={() => setExpanded(isOpen ? null : r._id)}
                                        style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', cursor: 'pointer' }}>
                                        {/* Brand avatar */}
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '14px',
                                            background: r.brandLogoUrl ? 'transparent' : 'linear-gradient(135deg, #7B3FF2, #A855F7)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '800', fontSize: '15px', color: '#fff', flexShrink: 0,
                                            overflow: 'hidden', border: '1px solid rgba(123,63,242,0.2)',
                                        }}>
                                            {r.brandLogoUrl ? (
                                                <img src={r.brandLogoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                (r.brandName || '?')[0]?.toUpperCase()
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: '120px' }}>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#fff', fontSize: '14px', marginBottom: '2px' }}>
                                                {r.campaignTitle}
                                            </p>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                                {r.brandName || 'Brand'} • {r.campaignType?.replace(/_/g, ' ') || 'Campaign'}
                                            </p>
                                        </div>

                                        {/* Price */}
                                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#4ade80' }}>
                                            {r.agreedPrice ? `$${r.agreedPrice.toLocaleString()}` : r.budgetRangeMin ? `$${r.budgetRangeMin}–$${r.budgetRangeMax}` : '—'}
                                        </p>

                                        {/* Date */}
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={10} /> {new Date(r.createdAt).toLocaleDateString()}
                                        </span>

                                        {/* Status badge */}
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '4px 12px', borderRadius: '99px',
                                            background: sc.bg, border: `1px solid ${sc.color}28`,
                                            color: sc.color, fontSize: '11px', fontWeight: '700',
                                        }}>
                                            {sc.icon} {sc.label}
                                        </span>

                                        {isOpen
                                            ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                                            : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />}
                                    </div>

                                    <AnimatePresence>
                                        {isOpen && <RequestDetailPanel request={r} onRespond={handleRespond} responding={responding} />}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
