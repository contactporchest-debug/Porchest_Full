'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, FileText, Calendar, DollarSign, Clock, CheckCircle,
    XCircle, Link2, ChevronDown, ChevronUp, Search, Plus,
} from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Filter = 'all' | 'pending' | 'accepted' | 'rejected';

const FILTER_TABS: { key: Filter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#a78bfa' },
    { key: 'accepted', label: 'Running / In-Process', color: '#4ade80' },
    { key: 'pending', label: 'Pending', color: '#fbbf24' },
    { key: 'rejected', label: 'Canceled', color: '#f87171' },
];

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', color: '#fbbf24', icon: <Clock size={11} /> },
    accepted: { label: 'In-Process', color: '#60d5f8', icon: <CheckCircle size={11} /> },
    rejected: { label: 'Canceled', color: '#f87171', icon: <XCircle size={11} /> },
};

function CampaignDetail({ request, verifications }: { request: any; verifications: any[] }) {
    const verification = verifications.find(v =>
        (v.campaignRequestId?._id || v.campaignRequestId) === request._id
    );

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

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }} style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Request document */}
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Campaign Request Document</p>
                <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', marginBottom: '12px' }}>{request.campaignDescription}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
                        {fields.map(f => (
                            <div key={f.label} style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{f.label}</p>
                                <p style={{ fontSize: '12px', color: '#fff' }}>{f.val}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.14)' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Content Guidelines</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>{request.contentGuidelines}</p>
                    </div>
                </div>

                {/* Verification block */}
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Verification Status</p>
                {!verification ? (
                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                            {request.status === 'accepted' ? 'Waiting for influencer to submit post URL.' : 'No verification — request not accepted.'}
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
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '6px' }}>Admin note: {verification.adminNote}</p>
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
                                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{m.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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

    useEffect(() => {
        Promise.all([brandAPI.getRequests(), brandAPI.getBrandVerifications()])
            .then(([r, v]) => { setRequests(r.data.requests || []); setVerifications(v.data.verifications || []); })
            .catch(() => toast.error('Failed to load campaigns'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = requests.filter(r => {
        const matchFilter = filter === 'all' || r.status === filter;
        const q = search.toLowerCase();
        const matchSearch = !q || r.campaignTitle?.toLowerCase().includes(q) || r.influencerId?.fullName?.toLowerCase().includes(q);
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
                        <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>Campaigns</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{filtered.length} campaign{filtered.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            )}

            {/* Filter tabs + search */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {FILTER_TABS.map(t => (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            style={{ padding: '7px 14px', borderRadius: '9px', border: 'none', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 180ms ease', whiteSpace: 'nowrap', background: filter === t.key ? `${t.color}18` : 'transparent', color: filter === t.key ? t.color : 'rgba(255,255,255,0.35)' }}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
                        className="input-dark" style={{ paddingLeft: '36px', height: '38px', fontSize: '13px', borderRadius: '11px', width: '100%', boxSizing: 'border-box' }} />
                </div>
            </div>

            {/* Empty */}
            {filtered.length === 0 && (
                <div className="glass-card" style={{ padding: '60px', borderRadius: '28px', textAlign: 'center' }}>
                    <FileText size={44} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff', marginBottom: '6px' }}>
                        {requests.length === 0 ? 'No campaigns yet' : 'No results'}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                        {requests.length === 0 ? 'Go to the Brand Overview, find an influencer, and send your first campaign request.' : 'Try adjusting filters or search.'}
                    </p>
                </div>
            )}

            {/* Campaign cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <AnimatePresence>
                    {filtered.map((r: any, i: number) => {
                        const sc = STATUS_CFG[r.status] || STATUS_CFG.pending;
                        const isRunning = r.status === 'accepted' && verifiedReqIds.has(r._id);
                        const displayStatus = isRunning ? { label: 'Running', color: '#4ade80' } : sc;
                        const inf = r.influencerId;
                        const initials = (inf?.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                        const isOpen = expanded === r._id;
                        const ver = verifications.find(v => (v.campaignRequestId?._id || v.campaignRequestId) === r._id);

                        return (
                            <motion.div key={r._id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                className="glass-card" style={{ borderRadius: '22px', overflow: 'hidden', border: isRunning ? '1px solid rgba(74,222,128,0.15)' : undefined }}>

                                {/* Card row */}
                                <div onClick={() => setExpanded(isOpen ? null : r._id)}
                                    style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', cursor: 'pointer' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', color: '#fff', flexShrink: 0 }}>{initials}</div>
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#fff', fontSize: '14px', marginBottom: '2px' }}>{r.campaignTitle}</p>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{inf?.fullName || '—'} · {inf?.niche || '—'}</p>
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={11} style={{ color: '#60d5f8' }} />
                                        {new Date(r.postingDeadline).toLocaleDateString()}
                                    </span>
                                    {ver && (
                                        <span style={{ fontSize: '11px', color: ver.status === 'verified' ? '#4ade80' : ver.status === 'rejected' ? '#f87171' : '#fbbf24', background: ver.status === 'verified' ? 'rgba(74,222,128,0.08)' : ver.status === 'rejected' ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)', border: `1px solid ${ver.status === 'verified' ? 'rgba(74,222,128,0.2)' : ver.status === 'rejected' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`, padding: '3px 11px', borderRadius: '99px', fontWeight: '700' }}>
                                            Post {ver.status === 'verified' ? 'Verified ✓' : ver.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                                        </span>
                                    )}
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#a78bfa' }}>${r.agreedPrice?.toLocaleString()}</p>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '99px', background: `${displayStatus.color}12`, border: `1px solid ${displayStatus.color}28`, color: displayStatus.color, fontSize: '11px', fontWeight: '700' }}>
                                        {displayStatus.label}
                                    </span>
                                    {isOpen ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />}
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
