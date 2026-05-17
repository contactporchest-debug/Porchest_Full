'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, FileText, Calendar, DollarSign, Clock, CheckCircle,
    XCircle, Link2, ChevronDown, ChevronUp, Search, Eye, AlertCircle, PlayCircle,
} from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCollaborationUpdates } from '@/lib/useSocket';
import CollaborationMetrics from '@/components/brand/CollaborationMetrics';

type Filter = 'all' | 'pending' | 'accepted' | 'rejected';

const FILTER_TABS: { key: Filter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#1A0A00' },
    { key: 'pending', label: 'Pending / Viewed', color: '#C4A882' },
    { key: 'accepted', label: 'Active', color: '#059669' },
    { key: 'rejected', label: 'Rejected / Canceled', color: '#dc2626' },
];

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string; icon: React.ReactNode }> = {
    sent: { label: 'Pending', bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.2)', color: '#0284c7', icon: <Clock size={11} /> },
    viewed: { label: 'Viewed', bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.2)', color: '#0284c7', icon: <Eye size={11} /> },
    accepted: { label: 'In-Process', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', color: '#059669', icon: <PlayCircle size={11} /> },
    brand_payment_pending: { label: 'Payment pending', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', color: '#d97706', icon: <Clock size={11} /> },
    brand_paid_work_can_start: { label: 'Payment confirmed', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', color: '#059669', icon: <PlayCircle size={11} /> },
    campaign_active: { label: 'Campaign active', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', color: '#059669', icon: <PlayCircle size={11} /> },
    deal_closed: { label: 'Closed ✓', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', color: '#059669', icon: <CheckCircle size={11} /> },
    rejected: { label: 'Rejected', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', color: '#dc2626', icon: <XCircle size={11} /> },
};

function CampaignDetail({ request, verifications }: { request: any; verifications: any[] }) {
    const verification = verifications.find(v => {
        const vId = typeof v.campaignRequestId === 'object' ? v.campaignRequestId?._id : v.campaignRequestId;
        return vId === request._id;
    });

    const VER_CFG: Record<string, { label: string; color: string }> = {
        pending: { label: 'Pending Admin Review', color: '#d97706' },
        verified: { label: 'Verified ✓', color: '#059669' },
        rejected: { label: 'Rejected', color: '#dc2626' },
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

    const IS = {
        width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC',
        color: '#1A0A00', fontSize: '13px', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit'
    };

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }} style={{ overflow: 'hidden', borderTop: '1px solid #EDD9BC' }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Response specific panels */}
                {request.status === 'rejected' && request.rejectionReason && (
                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
                        <p style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Rejection Reason</p>
                        <p style={{ fontSize: '14px', color: '#7A5030', lineHeight: 1.6 }}>{request.rejectionReason}</p>
                    </div>
                )}
                {/* Request document */}
                <p style={{ fontSize: '11px', color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Campaign Request Document</p>
                <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.4)', border: '1px solid #EDD9BC' }}>
                    <p style={{ fontSize: '14px', color: '#1A0A00', lineHeight: 1.6, marginBottom: '20px' }}>{request.campaignDescription}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
                        {fields.map(f => (
                            <div key={f.label} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                                <p style={{ fontSize: '10px', color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontWeight: 700 }}>{f.label}</p>
                                <p style={{ fontSize: '14px', color: '#1A0A00', fontWeight: 500 }}>{f.val}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                        <p style={{ fontSize: '10px', color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontWeight: 700 }}>Content Guidelines</p>
                        <p style={{ fontSize: '14px', color: '#1A0A00', lineHeight: 1.6 }}>{request.contentGuidelines}</p>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        <CollaborationMetrics collaborationId={request._id} />
                    </div>
                </div>

                {/* Verification block */}
                {(['accepted', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(request.status)) && (
                    <>
                        <p style={{ fontSize: '11px', color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Verification Status</p>
                        {!verification ? (
                            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.4)', border: '1px dashed #EDD9BC', textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', color: '#7A5030', fontWeight: 500 }}>
                                    Waiting for influencer to submit post URL.
                                </p>
                            </div>
                        ) : (
                            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: verSt?.color || '#888' }} />
                                    <p style={{ fontSize: '14px', color: verSt?.color, fontWeight: 700 }}>{verSt?.label}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: verification.adminNote ? '12px' : 0 }}>
                                    <Link2 size={16} style={{ color: '#0284c7', flexShrink: 0 }} />
                                    <a href={verification.postUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '14px', color: '#0284c7', textDecoration: 'underline', wordBreak: 'break-all', fontWeight: 500 }}>
                                        {verification.postUrl}
                                    </a>
                                </div>
                                {verification.adminNote && (
                                    <p style={{ fontSize: '13px', color: '#7A5030', marginTop: '8px' }}>Admin note: {verification.adminNote}</p>
                                )}
                                {/* Performance (if verified) */}
                                {verification.status === 'verified' && verification.performance && (
                                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '12px' }}>
                                        {[
                                            { label: 'Views', val: verification.performance.views },
                                            { label: 'Likes', val: verification.performance.likes },
                                            { label: 'Comments', val: verification.performance.comments },
                                            { label: 'Shares', val: verification.performance.shares },
                                        ].filter(m => m.val > 0).map(m => (
                                            <div key={m.label} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                                                <p style={{ fontWeight: 800, fontSize: '18px', color: '#059669' }}>{m.val.toLocaleString()}</p>
                                                <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px', textTransform: 'uppercase', fontWeight: 700 }}>{m.label}</p>
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
    const { user, token, loading: authLoading } = useAuth();
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
        if (authLoading || user?.role !== 'brand' || !token) return;

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
    }, [authLoading, loading, token, user?.role]);

    // Listen for real-time collaboration updates
    useCollaborationUpdates(useCallback(async (_data: any) => {
        // Refetch data when collaboration is updated
        await fetchData();
    }, [fetchData]));

    useEffect(() => {
        if (authLoading || user?.role !== 'brand' || !token) return;

        setLoading(true);
        fetchData();
        // Fallback polling every 30s as backup (reduced from 10s for better performance)
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [authLoading, fetchData, token, user?.role]);

    const filtered = requests.filter(r => {
        let matchFilter = false;
        if (filter === 'all') matchFilter = true;
        else if (filter === 'pending') matchFilter = ['sent', 'viewed'].includes(r.status);
        else if (filter === 'accepted') matchFilter = ['accepted', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted', 'deal_closed'].includes(r.status);
        else if (filter === 'rejected') matchFilter = ['rejected', 'cancelled'].includes(r.status);

        const q = search.toLowerCase();
        const matchSearch = !q || r.campaignTitle?.toLowerCase().includes(q) || r.influencerName?.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const verifiedReqIds = new Set(verifications.filter(v => v.status === 'verified').map(v => v.campaignRequestId?._id || v.campaignRequestId));

    if (authLoading || loading) return (
        <div style={{ textAlign: 'center', padding: '80px' }}>
            <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#C2340A' }} />
        </div>
    );

    return (
        <div>
            {/* Header */}
            {!hideHeader && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontWeight: 800, fontSize: '24px', color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '4px' }}>Campaigns & Collaborations</h1>
                        <p style={{ fontSize: '14px', color: '#7A5030' }}>{filtered.length} requests{filtered.length !== 1 ? 's' : ''}</p>
                    </div>
                    {lastUpdated && <p style={{ fontSize: '12px', color: '#C4A882', fontWeight: 500 }}>Updated: {lastUpdated.toLocaleTimeString()}</p>}
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(232,64,10,0.06)', border: '1px solid rgba(232,64,10,0.15)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={20} style={{ color: '#E8400A', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: '14px', color: '#E8400A', fontWeight: 700 }}>Data Load Error</p>
                        <p style={{ fontSize: '13px', color: '#7A5030', marginTop: '4px' }}>{error}</p>
                    </div>
                </div>
            )}

            {/* Filter tabs + search */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.6)', borderRadius: '16px', padding: '6px', border: '1px solid #EDD9BC' }}>
                    {FILTER_TABS.map(t => (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', background: filter === t.key ? '#C2340A' : 'transparent', color: filter === t.key ? '#fff' : '#7A5030' }}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking…"
                        style={{ paddingLeft: '44px', height: '44px', fontSize: '14px', borderRadius: '12px', width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', color: '#1A0A00', outline: 'none', transition: 'border-color 0.15s' }}
                        onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}
                    />
                </div>
            </div>

            {/* Empty */}
            {filtered.length === 0 && (
                <div style={{ padding: '64px 20px', borderRadius: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', border: '1px dashed #EDD9BC' }}>
                    <FileText size={48} style={{ color: '#C4A882', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 700, fontSize: '18px', color: '#1A0A00', marginBottom: '8px' }}>
                        {error ? 'Unable to Load Campaigns' : requests.length === 0 ? 'No campaigns yet' : 'No results'}
                    </p>
                    <p style={{ color: '#7A5030', fontSize: '14px' }}>
                        {error ? 'Please check your connection and try again.' : requests.length === 0 ? 'Go to the Brand Overview, find an influencer, and send your first campaign request.' : 'Try adjusting filters or search.'}
                    </p>
                </div>
            )}

            {/* Campaign cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                style={{ borderRadius: '24px', overflow: 'hidden', border: `1px solid ${isOpen ? '#C2340A' : '#EDD9BC'}`, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', transition: 'border-color 0.2s', boxShadow: '0 4px 20px rgba(26,10,0,0.02)' }}
                                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.borderColor = 'rgba(194,52,10,0.4)' }}
                                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.borderColor = '#EDD9BC' }}
                            >

                                {/* Card row */}
                                <div onClick={() => setExpanded(isOpen ? null : r._id)}
                                    style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', cursor: 'pointer' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#C2340A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#fff', flexShrink: 0, overflow: 'hidden', border: '1px solid #EDD9BC' }}>
                                        {r.influencerProfilePic && !brokenImages.has(r._id) ? <img src={r.influencerProfilePic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setBrokenImages(prev => new Set([...prev, r._id]))} /> : initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: '160px' }}>
                                        <p style={{ fontWeight: 700, color: '#1A0A00', fontSize: '16px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.campaignTitle}</p>
                                        <p style={{ fontSize: '13px', color: '#7A5030', fontWeight: 500 }}>{r.influencerName || '—'} <span style={{ margin: '0 4px' }}>•</span> {r.influencerNiche || '—'}</p>
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#7A5030', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                        <Calendar size={14} style={{ color: '#C4A882' }} />
                                        {new Date(r.postingDeadline).toLocaleDateString()}
                                    </span>
                                    {ver && (
                                        <span style={{ fontSize: '11px', color: ver.status === 'verified' ? '#059669' : ver.status === 'rejected' ? '#dc2626' : '#d97706', background: ver.status === 'verified' ? 'rgba(16,185,129,0.1)' : ver.status === 'rejected' ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${ver.status === 'verified' ? 'rgba(16,185,129,0.2)' : ver.status === 'rejected' ? 'rgba(220,38,38,0.2)' : 'rgba(245,158,11,0.2)'}`, padding: '4px 12px', borderRadius: '99px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Post {ver.status === 'verified' ? 'Verified ✓' : ver.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                                        </span>
                                    )}
                                    <p style={{ fontWeight: 800, fontSize: '20px', color: '#1A0A00' }}>${r.agreedPrice?.toLocaleString() || 0}</p>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '99px', background: displayStatus.bg, border: `1px solid ${displayStatus.border}`, color: displayStatus.color, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {displayStatus.icon} {displayStatus.label}
                                    </span>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isOpen ? '#C2340A' : 'rgba(255,255,255,0.6)', border: isOpen ? '1px solid #C2340A' : '1px solid #EDD9BC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOpen ? '#fff' : '#7A5030', transition: 'all 0.15s' }}>
                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
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
