'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, FileText, Calendar, DollarSign, Clock, CheckCircle,
    XCircle, Link2, ChevronDown, ChevronUp, Search, Eye, AlertCircle, PlayCircle,
} from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCollaborationUpdates } from '@/lib/useSocket';

type Filter = 'all' | 'pending' | 'negotiation' | 'accepted' | 'rejected';

const FILTER_TABS: { key: Filter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#a78bfa' },
    { key: 'pending', label: 'Pending / Viewed', color: '#fbbf24' },
    { key: 'negotiation', label: 'Negotiation', color: '#facc15' },
    { key: 'accepted', label: 'Active', color: '#4ade80' },
    { key: 'rejected', label: 'Rejected / Canceled', color: '#f87171' },
];

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    sent: { label: 'Pending', color: '#fbbf24', icon: <Clock size={11} /> },
    viewed: { label: 'Viewed', color: '#a78bfa', icon: <Eye size={11} /> },
    negotiation: { label: 'Negotiation', color: '#facc15', icon: <AlertCircle size={11} /> },
    accepted: { label: 'In-Process', color: '#60d5f8', icon: <PlayCircle size={11} /> },
    deal_closed: { label: 'Closed ✓', color: '#4ade80', icon: <CheckCircle size={11} /> },
    rejected: { label: 'Rejected', color: '#f87171', icon: <XCircle size={11} /> },
};

const SURFACE = '#ffffff';
const SURFACE_ALT = '#f8fafc';
const BORDER = 'rgba(148, 163, 184, 0.22)';
const BORDER_STRONG = 'rgba(148, 163, 184, 0.32)';
const TEXT = '#0f172a';
const MUTED = '#64748b';

function CampaignDetail({ request, verifications }: { request: any; verifications: any[] }) {
    const [counterPrice, setCounterPrice] = useState(request.counterOfferPrice ? String(request.counterOfferPrice) : '');
    const [counterMessage, setCounterMessage] = useState('');
    const [submittingCounter, setSubmittingCounter] = useState(false);
    const verification = verifications.find(v => {
        // Standardize: handle both ObjectId and string formats from backend
        const vId = typeof v.campaignRequestId === 'object' ? v.campaignRequestId?._id : v.campaignRequestId;
        return vId === request._id;
    });

    const VER_CFG: Record<string, { label: string; color: string }> = {
        pending: { label: 'Pending Admin Review', color: '#fbbf24' },
        verified: { label: 'Verified ✓', color: '#4ade80' },
        rejected: { label: 'Rejected', color: '#f87171' },
    };
    const verSt = VER_CFG[verification?.status || ''];

    const fields = [
        { label: 'Deliverables', val: request.deliverables },
        { label: 'Required Elements', val: request.requiredElements },
        { label: 'Video Length', val: request.videoLength },
        { label: 'Hashtags', val: request.hashtags || '—' },
        { label: 'Disclosure Requirements', val: request.disclosureRequirements },
        { label: 'Payment Terms', val: request.paymentTerms },
    ];

    const submitBrandCounter = async () => {
        if (!counterPrice.trim() || Number.isNaN(Number(counterPrice))) {
            toast.error('Enter a valid counter offer amount.');
            return;
        }

        try {
            setSubmittingCounter(true);
            await brandAPI.updateRequest(request._id, {
                status: 'negotiation',
                counterOfferPrice: Number(counterPrice),
                counterOfferMessage: counterMessage.trim() || undefined,
            });
            toast.success('Counter offer sent to influencer.');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send counter offer');
        } finally {
            setSubmittingCounter(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }} style={{ overflow: 'hidden', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Response specific panels */}
                {request.status === 'rejected' && request.rejectionReason && (
                    <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
                        <p style={{ fontSize: '11px', color: '#f87171', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Rejection Reason</p>
                        <p style={{ fontSize: '13px', color: MUTED, lineHeight: '1.6' }}>{request.rejectionReason}</p>
                    </div>
                )}
                {request.status === 'negotiation' && (
                    <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)' }}>
                        <p style={{ fontSize: '11px', color: '#facc15', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Counter Offer Received</p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#fef3c7', border: '1px solid rgba(250,204,21,0.22)' }}>
                                <p style={{ fontSize: '10px', color: MUTED, marginBottom: '2px' }}>Original Ask</p>
                                <p style={{ fontSize: '13px', color: TEXT, fontWeight: '700', textDecoration: 'line-through' }}>${request.agreedPrice?.toLocaleString()}</p>
                            </div>
                            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                <p style={{ fontSize: '10px', color: MUTED, marginBottom: '2px' }}>Counter Ask</p>
                                <p style={{ fontSize: '16px', color: '#4ade80', fontWeight: '800' }}>${request.counterOfferPrice?.toLocaleString()}</p>
                            </div>
                        </div>
                        {request.counterOfferMessage && (
                            <p style={{ fontSize: '13px', color: MUTED, lineHeight: '1.6' }}>"{request.counterOfferMessage}"</p>
                        )}
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            <button
                                onClick={async () => {
                                    try {
                                        await brandAPI.updateRequest(request._id, { status: 'deal_closed', agreedPrice: request.counterOfferPrice });
                                        toast.success('Counter accepted! Deal closed.');
                                        // Refetch requests without page reload
                                        const res = await brandAPI.getRequests();
                                        // This should trigger re-render - you may need to add a refetch callback to parent
                                    } catch (err) {
                                        toast.error('Failed to accept counter');
                                    }
                                }}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#4ade80', color: '#141222', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                                Accept Counter
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await brandAPI.updateRequest(request._id, { status: 'rejected', rejectionReason: 'Cannot meet counter offer terms' });
                                        toast.success('Counter rejected.');
                                        // Refetch requests without page reload
                                        const res = await brandAPI.getRequests();
                                    } catch (err) {
                                        toast.error('Failed to reject counter');
                                    }
                                }}
                                style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                                Reject
                            </button>
                        </div>
                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(250,204,21,0.16)' }}>
                            <p style={{ fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Send New Counter Offer</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 160px) minmax(0, 1fr)', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    className="input-dark"
                                    value={counterPrice}
                                    onChange={(e) => setCounterPrice(e.target.value)}
                                    placeholder="Counter amount"
                                    style={{ height: '42px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontSize: '13px' }}
                                />
                                <input
                                    className="input-dark"
                                    value={counterMessage}
                                    onChange={(e) => setCounterMessage(e.target.value)}
                                    placeholder="Add a message for the influencer"
                                    style={{ height: '42px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontSize: '13px' }}
                                />
                            </div>
                            <button
                                onClick={submitBrandCounter}
                                disabled={submittingCounter}
                                style={{ padding: '10px 16px', borderRadius: '10px', background: '#facc15', color: '#3b2f05', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                                {submittingCounter ? <Loader2 size={14} className="spin" /> : <AlertCircle size={14} />}
                                Send Counter
                            </button>
                        </div>
                    </div>
                )}


                {/* Request document */}
                <p style={{ fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Campaign Request Document</p>
                <div style={{ padding: '14px', borderRadius: '14px', background: SURFACE_ALT, border: `1px solid ${BORDER}`, marginBottom: '4px' }}>
                    <p style={{ fontSize: '13px', color: MUTED, lineHeight: '1.7', marginBottom: '12px' }}>{request.campaignDescription}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
                        {fields.map(f => (
                            <div key={f.label} style={{ padding: '10px 12px', borderRadius: '10px', background: SURFACE, border: `1px solid ${BORDER}` }}>
                                <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{f.label}</p>
                                <p style={{ fontSize: '12px', color: TEXT }}>{f.val}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid rgba(123,63,242,0.14)' }}>
                        <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Content Guidelines</p>
                        <p style={{ fontSize: '12px', color: MUTED, lineHeight: '1.6' }}>{request.contentGuidelines}</p>
                    </div>
                </div>

                {/* Verification block */}
                {(request.status === 'accepted' || request.status === 'deal_closed') && (
                    <>
                        <p style={{ fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Verification Status</p>
                        {!verification ? (
                            <div style={{ padding: '16px', borderRadius: '14px', background: SURFACE_ALT, border: `1px dashed ${BORDER_STRONG}`, textAlign: 'center' }}>
                                <p style={{ fontSize: '13px', color: MUTED }}>
                                    Waiting for influencer to submit post URL.
                                </p>
                            </div>
                        ) : (
                            <div style={{ padding: '16px 18px', borderRadius: '14px', background: `${verSt?.color || '#888'}08`, border: `1px solid ${verSt?.color || '#888'}22` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: verSt?.color || '#888', boxShadow: `0 0 8px ${verSt?.color}` }} />
                                    <p style={{ fontSize: '12px', color: verSt?.color, fontWeight: '700' }}>{verSt?.label}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: verification.adminNote ? '8px' : 0 }}>
                                    <Link2 size={11} style={{ color: '#60d5f8', flexShrink: 0 }} />
                                    <a href={verification.postUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '12px', color: '#60d5f8', textDecoration: 'none', wordBreak: 'break-all' }}>
                                        {verification.postUrl}
                                    </a>
                                </div>
                                {verification.adminNote && (
                                    <p style={{ fontSize: '11px', color: MUTED, marginTop: '6px' }}>Admin note: {verification.adminNote}</p>
                                )}
                                {/* Performance (if verified) */}
                                {verification.status === 'verified' && verification.performance && (
                                    <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: '8px' }}>
                                        {[
                                            { label: 'Views', val: verification.performance.views },
                                            { label: 'Likes', val: verification.performance.likes },
                                            { label: 'Comments', val: verification.performance.comments },
                                            { label: 'Shares', val: verification.performance.shares },
                                        ].filter(m => m.val > 0).map(m => (
                                            <div key={m.label} style={{ padding: '8px', borderRadius: '9px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)', textAlign: 'center' }}>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#4ade80' }}>{m.val.toLocaleString()}</p>
                                                <p style={{ fontSize: '10px', color: MUTED, marginTop: '2px' }}>{m.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default function CampaignsPage({ hideHeader }: { hideHeader?: boolean }) {
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        try {
            const [requestsRes, verificationsRes] = await Promise.all([
                brandAPI.getRequests(),
                brandAPI.getBrandVerifications()
            ]);
            
            if (!requestsRes.data || typeof requestsRes.data !== 'object') {
                throw new Error('Invalid requests API response');
            }
            if (!verificationsRes.data || typeof verificationsRes.data !== 'object') {
                throw new Error('Invalid verifications API response');
            }
            
            setRequests(requestsRes.data.requests || []);
            setVerifications(verificationsRes.data.verifications || []);
            setError(null);
            setLastUpdated(new Date());
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load campaigns';
            setError(errorMsg);
            if (loading) toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // Listen for real-time collaboration updates
    useCollaborationUpdates(useCallback(async (_data: any) => {
        // Refetch data when collaboration is updated
        await fetchData();
    }, [fetchData]));

    useEffect(() => {
        fetchData();
        // Fallback polling every 30s as backup (reduced from 10s for better performance)
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const filtered = requests.filter(r => {
        let matchFilter = false;
        if (filter === 'all') matchFilter = true;
        else if (filter === 'pending') matchFilter = ['sent', 'viewed'].includes(r.status);
        else if (filter === 'negotiation') matchFilter = r.status === 'negotiation';
        else if (filter === 'accepted') matchFilter = ['accepted', 'deal_closed'].includes(r.status);
        else if (filter === 'rejected') matchFilter = r.status === 'rejected';

        const q = search.toLowerCase();
        const matchSearch = !q || r.campaignTitle?.toLowerCase().includes(q) || r.influencerName?.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const verifiedReqIds = new Set(verifications.filter(v => v.status === 'verified').map(v => v.campaignRequestId?._id || v.campaignRequestId));

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px' }}>
            <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
        </div>
    );

    return (
        <div>
            {/* Header */}
            {!hideHeader && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: TEXT, letterSpacing: '-0.03em', marginBottom: '4px' }}>Campaigns & Collaborations</h1>
                        <p style={{ fontSize: '13px', color: MUTED }}>{filtered.length} requests{filtered.length !== 1 ? 's' : ''}</p>
                    </div>
                    {lastUpdated && <p style={{ fontSize: '11px', color: MUTED }}>Updated: {lastUpdated.toLocaleTimeString()}</p>}
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: '12px', color: '#f87171', fontWeight: '600' }}>Data Load Error</p>
                        <p style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{error}</p>
                    </div>
                </div>
            )}

            {/* Filter tabs + search */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', background: SURFACE_ALT, borderRadius: '12px', padding: '4px', border: `1px solid ${BORDER}` }}>
                    {FILTER_TABS.map(t => (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            style={{ padding: '7px 14px', borderRadius: '9px', border: 'none', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 180ms ease', whiteSpace: 'nowrap', background: filter === t.key ? `${t.color}18` : 'transparent', color: filter === t.key ? t.color : MUTED }}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking…"
                        className="input-dark" style={{ paddingLeft: '36px', height: '38px', fontSize: '13px', borderRadius: '11px', width: '100%', boxSizing: 'border-box', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }} />
                </div>
            </div>

            {/* Empty */}
            {filtered.length === 0 && (
                <div className="glass-card" style={{ padding: '60px', borderRadius: '28px', textAlign: 'center' }}>
                    <FileText size={44} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: TEXT, marginBottom: '6px' }}>
                        {error ? 'Unable to Load Campaigns' : requests.length === 0 ? 'No campaigns yet' : 'No results'}
                    </p>
                    <p style={{ color: MUTED, fontSize: '13px' }}>
                        {error ? 'Please check your connection and try again.' : requests.length === 0 ? 'Go to the Brand Overview, find an influencer, and send your first campaign request.' : 'Try adjusting filters or search.'}
                    </p>
                </div>
            )}

            {/* Campaign cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <AnimatePresence>
                    {filtered.map((r: any, i: number) => {
                        const sc = STATUS_CFG[r.status] || STATUS_CFG.sent;
                        const isClosed = r.status === 'deal_closed' || verifiedReqIds.has(r._id);
                        const displayStatus = isClosed ? STATUS_CFG.deal_closed : sc;
                        const initials = (r.influencerName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                        const isOpen = expanded === r._id;
                        const ver = verifications.find(v => (v.campaignRequestId?._id || v.campaignRequestId) === r._id);

                        return (
                            <motion.div key={r._id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                className="glass-card" style={{ borderRadius: '22px', overflow: 'hidden', border: isClosed ? '1px solid rgba(74,222,128,0.15)' : r.status === 'negotiation' ? '1px solid rgba(250,204,21,0.2)' : `1px solid ${BORDER}` }}>

                                {/* Card row */}
                                <div onClick={() => setExpanded(isOpen ? null : r._id)}
                                    style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', cursor: 'pointer' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                                        {r.influencerProfilePic && !brokenImages.has(r._id) ? <img src={r.influencerProfilePic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setBrokenImages(prev => new Set([...prev, r._id]))} /> : initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: TEXT, fontSize: '14px', marginBottom: '2px' }}>{r.campaignTitle}</p>
                                        <p style={{ fontSize: '12px', color: MUTED }}>{r.influencerName || '—'} · {r.influencerNiche || '—'}</p>
                                    </div>
                                    <span style={{ fontSize: '12px', color: MUTED, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={11} style={{ color: '#a78bfa' }} />
                                        {new Date(r.postingDeadline).toLocaleDateString()}
                                    </span>
                                    {ver && (
                                        <span style={{ fontSize: '11px', color: ver.status === 'verified' ? '#4ade80' : ver.status === 'rejected' ? '#f87171' : '#fbbf24', background: ver.status === 'verified' ? 'rgba(74,222,128,0.08)' : ver.status === 'rejected' ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)', border: `1px solid ${ver.status === 'verified' ? 'rgba(74,222,128,0.2)' : ver.status === 'rejected' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`, padding: '3px 11px', borderRadius: '99px', fontWeight: '700' }}>
                                            Post {ver.status === 'verified' ? 'Verified ✓' : ver.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                                        </span>
                                    )}
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#a78bfa' }}>${(r.counterOfferPrice && r.status === 'negotiation') ? r.counterOfferPrice.toLocaleString() : (r.agreedPrice?.toLocaleString() || 0)}</p>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '99px', background: `${displayStatus.color}12`, border: `1px solid ${displayStatus.color}28`, color: displayStatus.color, fontSize: '11px', fontWeight: '700' }}>
                                        {displayStatus.icon} {displayStatus.label}
                                    </span>
                                    {isOpen ? <ChevronUp size={14} style={{ color: MUTED, flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: MUTED, flexShrink: 0 }} />}
                                </div>

                                <AnimatePresence>
                                    {isOpen && <CampaignDetail request={r} verifications={verifications} />}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
