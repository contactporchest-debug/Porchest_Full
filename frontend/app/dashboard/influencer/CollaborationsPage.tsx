'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, DollarSign, Calendar, CheckCircle, X, FileText,
    Loader2, Clock, Shield, Link2, History, AlertCircle,
} from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import toast from 'react-hot-toast';

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'verified' | 'paid';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pending: { color: '#fbbf24', label: 'Pending' },
    accepted: { color: '#60d5f8', label: 'Accepted' },
    rejected: { color: '#f87171', label: 'Declined' },
    verified: { color: '#4ade80', label: 'Verified' },
    paid: { color: '#a78bfa', label: 'Paid' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { color: '#fff', label: status };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 13px', borderRadius: '99px', background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, color: cfg.color, fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
            {cfg.label}
        </span>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="glass-card" style={{ padding: '50px', borderRadius: '26px', textAlign: 'center' }}>
            <div style={{ color: 'rgba(123,63,242,0.3)', display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>{icon}</div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff', marginBottom: '5px' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>{subtitle}</p>
        </div>
    );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff', marginBottom: '3px' }}>{title}</h2>
            {count !== undefined && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{count} item{count !== 1 ? 's' : ''}</p>
            )}
        </div>
    );
}

/* ─── PENDING REQUESTS ─── */
function PendingRequests({ onChanged }: { onChanged: () => void }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [submitOpen, setSubmitOpen] = useState<string | null>(null);
    const [postUrl, setPostUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        setLoading(true);
        influencerAPI.getRequests({ status: 'pending' })
            .then(res => setRequests(res.data.requests || []))
            .catch(() => toast.error('Failed to load requests'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const respond = async (id: string, status: 'accepted' | 'rejected') => {
        setActing(id);
        try {
            await influencerAPI.respondToRequest(id, status);
            toast.success(status === 'accepted' ? '✅ Collaboration accepted!' : 'Request declined');
            load();
            onChanged();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to respond');
        } finally {
            setActing(null);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}><Loader2 size={28} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} /></div>;

    return (
        <div style={{ marginBottom: '40px' }}>
            <SectionHeader title="Pending Requests" count={requests.length} />
            {requests.length === 0 ? (
                <EmptyState icon={<Clock size={40} />} title="No Pending Requests" subtitle="Brands will send campaign requests here. Check back later." />
            ) : (
                <AnimatePresence>
                    {requests.map((r, i) => {
                        const brand = r.brandId;
                        const initials = (brand?.companyName || '?')[0].toUpperCase();
                        const isOpen = expanded === r._id;
                        return (
                            <motion.div key={r._id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }}
                                transition={{ delay: i * 0.06, duration: 0.32 }}
                                className="glass-card" style={{ borderRadius: '26px', marginBottom: '12px', overflow: 'hidden' }}>
                                {/* Header row */}
                                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', cursor: 'pointer' }}
                                    onClick={() => setExpanded(isOpen ? null : r._id)}>
                                    <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#fff', flexShrink: 0 }}>{initials}</div>
                                    <div style={{ flex: 1, minWidth: '130px' }}>
                                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '14px', color: '#fff', marginBottom: '2px' }}>{r.campaignTitle}</p>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{brand?.companyName || 'Brand'} · {brand?.industry || ''}</p>
                                    </div>
                                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#a78bfa', filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.45))' }}>
                                        ${r.agreedPrice?.toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                                        <Calendar size={11} style={{ color: '#60d5f8' }} />
                                        Due {new Date(r.postingDeadline).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', padding: '3px 9px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <FileText size={10} style={{ display: 'inline', marginRight: '4px' }} />{isOpen ? 'Hide ▲' : 'Brief ▼'}
                                    </div>
                                </div>
                                {/* Brief */}
                                {isOpen && (
                                    <div style={{ padding: '0 24px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ paddingTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '9px', marginBottom: '12px' }}>
                                            {[
                                                { label: 'Deliverables', val: r.deliverables },
                                                { label: 'Required Elements', val: r.requiredElements },
                                                { label: 'Video Length', val: r.videoLength },
                                                { label: 'Hashtags', val: r.hashtags || '—' },
                                                { label: 'Payment Terms', val: r.paymentTerms },
                                                { label: 'Disclosure', val: r.disclosureRequirements },
                                            ].map(f => (
                                                <div key={f.label} style={{ padding: '9px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{f.label}</p>
                                                    <p style={{ fontSize: '13px', color: '#fff' }}>{f.val}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {r.campaignDescription && (
                                            <div style={{ padding: '10px 13px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '10px' }}>
                                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Description</p>
                                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.65' }}>{r.campaignDescription}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Actions */}
                                <div style={{ padding: '0 24px 20px', display: 'flex', gap: '9px' }}>
                                    <button onClick={() => respond(r._id, 'accepted')} disabled={!!acting}
                                        style={{ flex: 1, padding: '11px', borderRadius: '13px', background: acting === r._id ? 'rgba(123,63,242,0.15)' : 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: '700', cursor: acting ? 'wait' : 'pointer', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 0 20px rgba(123,63,242,0.3)' }}>
                                        <CheckCircle size={13} /> Accept
                                    </button>
                                    <button onClick={() => respond(r._id, 'rejected')} disabled={!!acting}
                                        style={{ padding: '11px 18px', borderRadius: '13px', background: 'transparent', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontFamily: 'inherit', fontSize: '13px', fontWeight: '600', cursor: acting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 200ms ease' }}>
                                        <X size={13} /> Decline
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            )}
        </div>
    );
}

/* ─── ACTIVE COLLABORATIONS ─── */
function ActiveCollaborations({ refresh }: { refresh: number }) {
    const [collabs, setCollabs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitOpen, setSubmitOpen] = useState<string | null>(null);
    const [postUrl, setPostUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        influencerAPI.getRequests({ status: 'accepted' })
            .then(res => setCollabs(res.data.requests || []))
            .catch(() => toast.error('Failed to load collaborations'))
            .finally(() => setLoading(false));
    }, [refresh]);

    const submitVerification = async (campaignRequestId: string) => {
        if (!postUrl.startsWith('http')) {
            toast.error('Please enter a valid URL');
            return;
        }
        setSubmitting(true);
        try {
            await influencerAPI.submitVerification({ campaignRequestId, postUrl });
            toast.success('✅ Post URL submitted for verification!');
            setSubmitOpen(null);
            setPostUrl('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)' }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} /></div>;

    return (
        <div style={{ marginBottom: '40px' }}>
            <SectionHeader title="Active Collaborations" count={collabs.length} />
            {collabs.length === 0 ? (
                <EmptyState icon={<Users size={38} />} title="No Active Collaborations" subtitle="Accept pending requests to start collaborating." />
            ) : (
                collabs.map((c, i) => {
                    const brand = c.brandId;
                    const initials = (brand?.companyName || '?')[0].toUpperCase();
                    return (
                        <motion.div key={c._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.32 }}
                            className="glass-card" style={{ borderRadius: '24px', marginBottom: '12px', padding: '20px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: submitOpen === c._id ? '16px' : '0' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '17px', color: '#fff', flexShrink: 0 }}>{initials}</div>
                                <div style={{ flex: 1, minWidth: '120px' }}>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '14px', color: '#fff', marginBottom: '2px' }}>{c.campaignTitle}</p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{brand?.companyName || 'Brand'}</p>
                                </div>
                                <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '16px', color: '#a78bfa' }}>${c.agreedPrice?.toLocaleString()}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                                    <Calendar size={11} style={{ color: '#60d5f8' }} />
                                    {new Date(c.postingDeadline).toLocaleDateString()}
                                </div>
                                <StatusBadge status={c.status} />
                                <button onClick={() => { setSubmitOpen(submitOpen === c._id ? null : c._id); setPostUrl(''); }}
                                    style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(123,63,242,0.1)', border: '1px solid rgba(123,63,242,0.25)', color: '#a78bfa', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Link2 size={12} /> Submit Post
                                </button>
                            </div>
                            {submitOpen === c._id && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'center' }}>
                                    <input value={postUrl} onChange={e => setPostUrl(e.target.value)}
                                        placeholder="https://instagram.com/p/..."
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                                    <button onClick={() => submitVerification(c._id)} disabled={submitting}
                                        style={{ padding: '10px 18px', borderRadius: '11px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: submitting ? 'wait' : 'pointer', whiteSpace: 'nowrap', opacity: submitting ? 0.7 : 1 }}>
                                        {submitting ? 'Submitting…' : 'Submit'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })
            )}
        </div>
    );
}

/* ─── COMPLETED HISTORY ─── */
function CompletedHistory() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        influencerAPI.getVerifications()
            .then(res => setHistory(res.data.verifications || []))
            .catch(() => toast.error('Failed to load history'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)' }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} /></div>;

    return (
        <div>
            <SectionHeader title="Completed History" count={history.length} />
            {history.length === 0 ? (
                <EmptyState icon={<History size={38} />} title="No Completed Collaborations" subtitle="Verified and paid collaborations will appear here." />
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr>
                                {['Brand', 'Campaign', 'Amount', 'Verification', 'Payment', 'Completed'].map(h => (
                                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((v, i) => {
                                const req = v.campaignRequestId;
                                const brand = v.brandId;
                                return (
                                    <motion.tr key={v._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                        style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
                                        <td style={{ padding: '14px 14px', borderRadius: '14px 0 0 14px', border: '1px solid rgba(255,255,255,0.05)', borderRight: 'none' }}>
                                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: '#fff' }}>{brand?.companyName || '—'}</span>
                                        </td>
                                        <td style={{ padding: '14px 14px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', borderRight: 'none', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                            {req?.campaignTitle || '—'}
                                        </td>
                                        <td style={{ padding: '14px 14px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', borderRight: 'none' }}>
                                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#a78bfa', fontSize: '13px' }}>${req?.agreedPrice?.toLocaleString() || '—'}</span>
                                        </td>
                                        <td style={{ padding: '14px 14px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', borderRight: 'none' }}>
                                            <StatusBadge status={v.status === 'verified' ? 'verified' : v.status === 'pending_admin' ? 'pending' : v.status} />
                                        </td>
                                        <td style={{ padding: '14px 14px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', borderRight: 'none' }}>
                                            <StatusBadge status={v.paymentStatus || 'pending'} />
                                        </td>
                                        <td style={{ padding: '14px 14px', borderRadius: '0 14px 14px 0', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                                            {v.verifiedAt ? new Date(v.verifiedAt).toLocaleDateString() : new Date(v.createdAt).toLocaleDateString()}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ─── MAIN EXPORT ─── */
export default function CollaborationsPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PendingRequests onChanged={() => setRefreshTrigger(p => p + 1)} />
            <ActiveCollaborations refresh={refreshTrigger} />
            <CompletedHistory />
        </motion.div>
    );
}
