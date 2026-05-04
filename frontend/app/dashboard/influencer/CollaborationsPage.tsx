'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, DollarSign, Calendar, CheckCircle, X, FileText,
    Loader2, Clock, Shield, Link2, History, AlertCircle,
} from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import { useCollaborationUpdates } from '@/lib/useSocket';
import toast from 'react-hot-toast';
import RequestsBoard from './RequestsBoard';
import CampaignMetricsCard from '@/components/influencer/CampaignMetricsCard';

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'verified' | 'paid';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pending: { color: '#fbbf24', label: 'Pending' },
    accepted: { color: '#60d5f8', label: 'Accepted' },
    brand_payment_pending: { color: '#f59e0b', label: 'Payment pending' },
    brand_paid_work_can_start: { color: '#10b981', label: 'Payment confirmed' },
    campaign_active: { color: '#10b981', label: 'Campaign active' },
    rejected: { color: '#f87171', label: 'Declined' },
    verified: { color: '#4ade80', label: 'Verified' },
    paid: { color: '#a855f7', label: 'Paid' },
};

const SURFACE = '#0c0c0c';
const SURFACE_ALT = 'rgba(255,255,255,0.02)';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const BORDER_STRONG = 'rgba(255, 255, 255, 0.16)';
const TEXT = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.5)';

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { color: '#475569', label: status };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 13px', borderRadius: '99px', background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, color: cfg.color, fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
            {cfg.label}
        </span>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="glass-card" style={{ padding: '50px', borderRadius: '26px', textAlign: 'center' }}>
            <div style={{ color: 'rgba(168,85,247,0.3)', display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>{icon}</div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: TEXT, marginBottom: '5px' }}>{title}</p>
            <p style={{ color: MUTED, fontSize: '13px' }}>{subtitle}</p>
        </div>
    );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: TEXT, marginBottom: '3px' }}>{title}</h2>
            {count !== undefined && (
                <p style={{ fontSize: '12px', color: MUTED }}>{count} item{count !== 1 ? 's' : ''}</p>
            )}
        </div>
    );
}

/* ─── ACTIVE COLLABORATIONS ─── */
function ActiveCollaborations({ refresh }: { refresh: number }) {
    const [collabs, setCollabs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [submitOpen, setSubmitOpen] = useState<string | null>(null);
    const [postUrl, setPostUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = () => {
            influencerAPI.getRequests({ status: 'brand_paid_work_can_start,campaign_active,content_submitted,content_approved,posted' })
                .then(res => {
                    if (!res.data || typeof res.data !== 'object') {
                        throw new Error('Invalid API response format');
                    }
                    setCollabs(res.data.requests || []);
                    setError(null);
                    setLastUpdated(new Date());
                })
                .catch(err => {
                    const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load active collaborations';
                    setError(errorMsg);
                    if (loading) toast.error(errorMsg);
                })
                .finally(() => setLoading(false));
        };
        
        load();
        const intervalId = setInterval(load, 30000);
        return () => clearInterval(intervalId);
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

    if (loading) return <div style={{ textAlign: 'center', padding: '30px', color: MUTED }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#a855f7' }} /></div>;

    return (
        <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <SectionHeader title="Active Collaborations" count={collabs.length} />
                {lastUpdated && <p style={{ fontSize: '11px', color: MUTED }}>Updated: {lastUpdated.toLocaleTimeString()}</p>}
            </div>
            {error && (
                <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: '12px', color: '#f87171', fontWeight: '600' }}>Data Load Error</p>
                        <p style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{error}</p>
                    </div>
                </div>
            )}
            {collabs.length === 0 ? (
                error ? (
                    <EmptyState icon={<AlertCircle size={38} />} title="Unable to Load Collaborations" subtitle="Please check your connection and try again." />
                ) : (
                    <EmptyState icon={<Users size={38} />} title="No Active Collaborations" subtitle="Accept pending requests to start collaborating." />
                )
            ) : (
                collabs.map((c, i) => {
                    const brand = c.brandId;
                    const initials = (brand?.companyName || '?')[0].toUpperCase();
                    return (
                        <motion.div key={c._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.32 }}
                            className="glass-card" style={{ borderRadius: '24px', marginBottom: '12px', padding: '20px 24px', border: `1px solid ${BORDER}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: submitOpen === c._id ? '16px' : '0' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#9333ea,#c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '17px', color: '#fff', flexShrink: 0 }}>{initials}</div>
                                <div style={{ flex: 1, minWidth: '120px' }}>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '14px', color: TEXT, marginBottom: '2px' }}>{c.campaignTitle}</p>
                                    <p style={{ fontSize: '12px', color: MUTED }}>{brand?.companyName || 'Brand'}</p>
                                </div>
                                <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '16px', color: '#a855f7' }}>${c.agreedPrice?.toLocaleString()}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: MUTED }}>
                                    <Calendar size={11} style={{ color: '#60d5f8' }} />
                                    {new Date(c.postingDeadline).toLocaleDateString()}
                                </div>
                                <StatusBadge status={c.status} />
                                <button onClick={() => { setSubmitOpen(submitOpen === c._id ? null : c._id); setPostUrl(''); }}
                                    style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Link2 size={12} /> Submit Post
                                </button>
                            </div>
                            {submitOpen === c._id && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'center' }}>
                                    <input value={postUrl} onChange={e => setPostUrl(e.target.value)}
                                        placeholder="https://instagram.com/p/..."
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: '11px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                                    <button onClick={() => submitVerification(c._id)} disabled={submitting}
                                        style={{ padding: '10px 18px', borderRadius: '11px', background: 'linear-gradient(135deg,#9333ea,#c084fc)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: submitting ? 'wait' : 'pointer', whiteSpace: 'nowrap', opacity: submitting ? 0.7 : 1 }}>
                                        {submitting ? 'Submitting…' : 'Submit'}
                                    </button>
                                </div>
                            )}
                            <div style={{ marginTop: '16px' }}>
                                <CampaignMetricsCard collaborationId={c._id} />
                            </div>
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
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        const load = () => {
            influencerAPI.getVerifications()
                .then(res => {
                    if (!res.data || typeof res.data !== 'object') {
                        throw new Error('Invalid API response format');
                    }
                    setHistory(res.data.verifications || []);
                    setError(null);
                    setLastUpdated(new Date());
                })
                .catch(err => {
                    const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load verification history';
                    setError(errorMsg);
                    if (loading) toast.error(errorMsg);
                })
                .finally(() => setLoading(false));
        };
        
        load();
        const intervalId = setInterval(load, 30000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '30px', color: MUTED }}><Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#a855f7' }} /></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <SectionHeader title="Completed History" count={history.length} />
                {lastUpdated && <p style={{ fontSize: '11px', color: MUTED }}>Updated: {lastUpdated.toLocaleTimeString()}</p>}
            </div>
            {error && (
                <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: '12px', color: '#f87171', fontWeight: '600' }}>Data Load Error</p>
                        <p style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{error}</p>
                    </div>
                </div>
            )}
            {history.length === 0 ? (
                error ? (
                    <EmptyState icon={<AlertCircle size={38} />} title="Unable to Load History" subtitle="Please check your connection and try again." />
                ) : (
                    <EmptyState icon={<History size={38} />} title="No Completed Collaborations" subtitle="Verified and paid collaborations will appear here." />
                )
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr>
                                {['Brand', 'Campaign', 'Amount', 'Verification', 'Payment', 'Completed'].map(h => (
                                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: MUTED, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((v, i) => {
                                const req = v.campaignRequestId;
                                const brand = v.brandId;
                                return (
                                    <motion.tr key={v._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                        style={{ background: SURFACE_ALT, borderRadius: '14px' }}>
                                        <td style={{ padding: '14px 14px', borderRadius: '14px 0 0 14px', border: `1px solid ${BORDER}`, borderRight: 'none' }}>
                                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '13px', color: TEXT }}>{brand?.companyName || '—'}</span>
                                        </td>
                                        <td style={{ padding: '14px 14px', border: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none', fontSize: '13px', color: MUTED }}>
                                            {req?.campaignTitle || '—'}
                                        </td>
                                        <td style={{ padding: '14px 14px', border: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none' }}>
                                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#a855f7', fontSize: '13px' }}>${req?.agreedPrice?.toLocaleString() || '—'}</span>
                                        </td>
                                        <td style={{ padding: '14px 14px', border: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none' }}>
                                            <StatusBadge status={v.status === 'verified' ? 'verified' : v.status === 'pending_admin' ? 'pending' : v.status} />
                                        </td>
                                        <td style={{ padding: '14px 14px', border: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none' }}>
                                            <StatusBadge status={v.paymentStatus || 'pending'} />
                                        </td>
                                        <td style={{ padding: '14px 14px', borderRadius: '0 14px 14px 0', border: `1px solid ${BORDER}`, borderLeft: 'none', fontSize: '12px', color: MUTED }}>
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

    // Listen for real-time collaboration updates
    useCollaborationUpdates(useCallback((_data: any) => {
        // Trigger refresh of collaborations
        setRefreshTrigger(p => p + 1);
    }, []));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RequestsBoard onChanged={() => setRefreshTrigger(p => p + 1)} />
            <ActiveCollaborations refresh={refreshTrigger} />
            <CompletedHistory />
        </motion.div>
    );
}
