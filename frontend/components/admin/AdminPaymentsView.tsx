'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ExternalLink, Loader2, Search, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSocket } from '@/context/SocketContext';
import { adminAPI } from '@/lib/api';

type PaymentStatus = 'pending' | 'proof_submitted' | 'verified' | 'rejected';

interface PaymentItem {
    _id: string;
    campaignTitle?: string;
    campaignDescription?: string;
    brandName?: string;
    influencerName?: string;
    influencerUsername?: string;
    payment_status?: PaymentStatus;
    payment_proof?: string;
    payment_amount?: number;
    payment_method?: string;
    payment_timestamp?: string;
    brandPaymentStatus?: string;
    status?: string;
    createdAt?: string;
    brandProfile?: { businessName?: string; brandName?: string };
    influencerProfile?: { fullName?: string; igUsername?: string };
}

const STATUS_STYLES: Record<PaymentStatus, { label: string; bg: string; color: string; border: string }> = {
    pending: { label: 'Pending', bg: 'rgba(245,158,11,0.10)', color: '#d97706', border: 'rgba(245,158,11,0.20)' },
    proof_submitted: { label: 'Proof submitted', bg: 'rgba(56,189,248,0.10)', color: '#0284c7', border: 'rgba(56,189,248,0.20)' },
    verified: { label: 'Verified', bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.20)' },
    rejected: { label: 'Rejected', bg: 'rgba(239,68,68,0.10)', color: '#dc2626', border: 'rgba(239,68,68,0.20)' },
};

function fmtMoney(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
}

function isImagePreviewSource(value?: string | null) {
    if (!value) return false;
    return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value) || /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(value);
}

function StatusBadge({ status }: { status?: PaymentStatus }) {
    const current = STATUS_STYLES[status || 'pending'];
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: current.bg,
                color: current.color,
                border: `1px solid ${current.border}`,
            }}
        >
            {current.label}
        </span>
    );
}

export function AdminPaymentsView() {
    const { socket } = useSocket();
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    const loadPayments = useCallback(async () => {
        const res = await adminAPI.getPayments({ status: 'pending,proof_submitted' });
        setPayments(res.data.payments || []);
    }, []);

    useEffect(() => {
        setLoading(true);
        loadPayments()
            .catch(() => toast.error('Failed to load payments'))
            .finally(() => setLoading(false));
    }, [loadPayments]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            void loadPayments();
        };
        socket.on('collaboration:updated', handleUpdate);
        return () => {
            socket.off('collaboration:updated', handleUpdate);
        };
    }, [socket, loadPayments]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return payments;
        return payments.filter((payment) => {
            const haystack = [
                payment.campaignTitle,
                payment.campaignDescription,
                payment.brandName,
                payment.influencerName,
                payment.influencerUsername,
                payment.payment_method,
                payment.payment_status,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [payments, search]);

    const verify = async (id: string) => {
        setReviewingId(id);
        try {
            await adminAPI.verifyPayment(id);
            toast.success('Payment verified. Campaign can now start.');
            await loadPayments();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.response?.data?.error || 'Verification failed');
        } finally {
            setReviewingId(null);
        }
    };

    const reject = async (id: string) => {
        const message = window.prompt('Reject payment proof with a short reason', 'Payment proof is unclear or invalid') || undefined;
        setReviewingId(id);
        try {
            await adminAPI.rejectPayment(id, message);
            toast.success('Payment rejected.');
            await loadPayments();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.response?.data?.error || 'Rejection failed');
        } finally {
            setReviewingId(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 18,
                            border: '1px solid rgba(194,52,10,0.16)',
                            background: 'rgba(194,52,10,0.06)',
                            padding: 24,
                        }}
                    >
                        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C2340A' }}>Admin payments</p>
                        <h1 style={{ marginTop: 8, fontSize: 30, fontWeight: 800, color: '#1A0A00' }}>Payment verification queue</h1>
                        <p style={{ marginTop: 8, color: '#7A5030', lineHeight: 1.6 }}>
                            Review Easypaisa proof submissions, verify payments, and unlock campaign production for influencers.
                        </p>
                    </motion.div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ position: 'relative', maxWidth: 420, width: '100%' }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#C4A882' }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search campaign, brand, influencer, or status"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 40px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #EDD9BC',
                                    color: '#1A0A00',
                                    outline: 'none',
                                    fontSize: 14,
                                }}
                            />
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.55)', color: '#7A5030', fontWeight: 700, fontSize: 13 }}>
                            <ShieldAlert size={14} color="#C2340A" />
                            {filtered.filter((item) => item.payment_status === 'proof_submitted').length} proof submitted
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ minHeight: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 size={32} style={{ color: '#C2340A', animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {filtered.map((payment) => {
                                const status = payment.payment_status || 'pending';
                                const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
                                return (
                                    <div
                                        key={payment._id}
                                        style={{
                                            border: '1px solid #EDD9BC',
                                            background: 'rgba(255,255,255,0.4)',
                                            borderRadius: 18,
                                            padding: 20,
                                            backdropFilter: 'blur(12px)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto',
                                            gap: 16,
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 800, color: '#1A0A00', fontSize: 16 }}>{payment.campaignTitle || payment.campaignDescription || 'Campaign payment'}</p>
                                                <p style={{ margin: '6px 0 0', color: '#7A5030', fontSize: 13 }}>
                                                    {payment.brandName || payment.brandProfile?.businessName || payment.brandProfile?.brandName || 'Brand'}
                                                    {' '}•{' '}
                                                    {payment.influencerName || payment.influencerProfile?.fullName || payment.influencerProfile?.igUsername || payment.influencerUsername || 'Influencer'}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: 999, background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                    {style.label}
                                                </span>
                                                <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.56)', color: '#7A5030', border: '1px solid #EDD9BC', fontSize: 11, fontWeight: 700 }}>
                                                    {payment.payment_method || 'Easypaisa'}
                                                </span>
                                                <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.56)', color: '#7A5030', border: '1px solid #EDD9BC', fontSize: 11, fontWeight: 700 }}>
                                                    Submitted {fmtDate(payment.payment_timestamp || payment.createdAt)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                                                <InfoCard label="Payment amount" value={fmtMoney(payment.payment_amount)} />
                                                <InfoCard label="Proof" value={payment.payment_proof ? 'Submitted' : 'Missing'} />
                                                <InfoCard label="Collab status" value={payment.status || 'pending'} />
                                            </div>
                                            {payment.payment_proof && isImagePreviewSource(payment.payment_proof) && (
                                                <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
                                                    <p style={{ margin: 0, color: '#7A5030', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                                                        Proof preview
                                                    </p>
                                                    <a
                                                        href={payment.payment_proof}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'block',
                                                            width: 'fit-content',
                                                            borderRadius: 16,
                                                            overflow: 'hidden',
                                                            border: '1px solid #EDD9BC',
                                                            background: 'rgba(255,255,255,0.72)',
                                                            boxShadow: '0 8px 24px rgba(26,10,0,0.08)',
                                                        }}
                                                    >
                                                        <img
                                                            src={payment.payment_proof}
                                                            alt="Payment proof preview"
                                                            style={{ display: 'block', width: '100%', maxWidth: 320, maxHeight: 180, objectFit: 'cover' }}
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                            {payment.payment_proof && (
                                                <a
                                                    href={payment.payment_proof}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#C2340A', fontWeight: 700, fontSize: 13, textDecoration: 'underline', width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                                >
                                                    <ExternalLink size={14} />
                                                    Open proof screenshot
                                                </a>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                                            <StatusBadge status={status as PaymentStatus} />
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => verify(payment._id)}
                                                    disabled={reviewingId === payment._id || status !== 'proof_submitted'}
                                                    style={actionStyle('approve', status !== 'proof_submitted')}
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Verify
                                                </button>
                                                <button
                                                    onClick={() => reject(payment._id)}
                                                    disabled={reviewingId === payment._id}
                                                    style={actionStyle('reject', false)}
                                                >
                                                    <XCircle size={14} />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ borderRadius: 14, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.48)', padding: 14 }}>
            <p style={{ margin: 0, color: '#7A5030', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em' }}>{label}</p>
            <p style={{ margin: '6px 0 0', color: '#1A0A00', fontSize: 14, fontWeight: 700 }}>{value}</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div style={{ padding: '36px', borderRadius: '18px', border: '1px dashed #EDD9BC', background: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            <ShieldCheck size={32} style={{ margin: '0 auto 10px', color: 'rgba(194,52,10,0.35)' }} />
            <p style={{ margin: 0, fontWeight: 800, color: '#1A0A00' }}>No payment proofs waiting</p>
            <p style={{ margin: '6px 0 0', color: '#7A5030', fontSize: 13 }}>Submitted Easypaisa proofs will show up here for admin review.</p>
        </div>
    );
}

function actionStyle(kind: 'approve' | 'reject', disabled: boolean): React.CSSProperties {
    const isApprove = kind === 'approve';
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        border: `1px solid ${isApprove ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
        background: isApprove ? 'rgba(5,150,105,0.10)' : 'rgba(220,38,38,0.10)',
        color: isApprove ? '#059669' : '#dc2626',
        fontSize: 13,
        fontWeight: 800,
        padding: '10px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
    };
}

export default AdminPaymentsView;
