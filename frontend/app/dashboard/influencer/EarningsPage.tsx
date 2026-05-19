'use client';

import { useEffect, useMemo, useState, type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Clock3, Image as ImageIcon, Loader2, ReceiptText, Save, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { influencerAPI } from '@/lib/api';

type CashoutStatus = 'pending' | 'approved' | 'rejected';

interface PaymentProfile {
    easypaisaNumber?: string | null;
    easypaisaScreenshotUrl?: string | null;
    fullName?: string | null;
    instagramUsername?: string | null;
}

interface Cashout {
    _id: string;
    amount: number;
    status: CashoutStatus;
    cashoutCode?: string;
    transactionId?: string | null;
    requestedAt?: string;
    createdAt: string;
    reviewedAt?: string;
    processedAt?: string;
    rejectionReason?: string;
}

interface CampaignPaymentRow {
    _id: string;
    campaignTitle?: string;
    brandName?: string;
    status: string;
    contractValue: number;
    paidAmount: number;
    pendingAmount: number;
    createdAt: string;
    firstPayoutReleasedAt?: string | null;
    secondPayoutReleasedAt?: string | null;
}

const colors = {
    ink: '#1A0A00',
    rust: '#C2340A',
    flame: '#E8400A',
    amber: '#FF6B1A',
    brown: '#7A5030',
    cream: '#FDF6EE',
    border: '#EDD9BC',
    card: 'rgba(255,255,255,0.35)',
    cardStrong: 'rgba(255,255,255,0.48)',
};

const statusLabels: Record<CashoutStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#d97706', bg: 'rgba(245,158,11,0.10)' },
    approved: { label: 'Cleared', color: '#059669', bg: 'rgba(16,185,129,0.10)' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: 'rgba(239,68,68,0.10)' },
};

function money(value: number) {
    return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({
    label,
    value,
    helper,
    icon,
    tint,
}: {
    label: string;
    value: string;
    helper?: string;
    icon: ReactNode;
    tint: string;
}) {
    return (
        <div
            style={{
                padding: '22px',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                background: colors.card,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(194,52,10,0.04)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${tint}14`,
                        border: `1px solid ${tint}22`,
                        color: tint,
                    }}
                >
                    {icon}
                </div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: colors.brown, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            </div>
            <p style={{ fontSize: '32px', lineHeight: 1, fontWeight: 800, color: colors.ink, letterSpacing: '-0.04em' }}>{value}</p>
            {helper && <p style={{ marginTop: '8px', fontSize: '13px', color: colors.brown }}>{helper}</p>}
        </div>
    );
}

function Panel({
    title,
    subtitle,
    icon,
    children,
}: {
    title: string;
    subtitle?: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section
            style={{
                borderRadius: '18px',
                border: `1px solid ${colors.border}`,
                background: colors.card,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 30px rgba(194,52,10,0.04)',
                padding: '28px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(194,52,10,0.10)',
                        border: '1px solid rgba(194,52,10,0.18)',
                        color: colors.rust,
                    }}
                >
                    {icon}
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.ink }}>{title}</h2>
                    {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.brown }}>{subtitle}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

export default function EarningsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cashouts, setCashouts] = useState<Cashout[]>([]);
    const [campaignPayments, setCampaignPayments] = useState<CampaignPaymentRow[]>([]);
    const [paymentProfile, setPaymentProfile] = useState<PaymentProfile>({});
    const [easypaisaNumber, setEasypaisaNumber] = useState('');
    const [easypaisaScreenshotUrl, setEasypaisaScreenshotUrl] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const [profileRes, earningsRes] = await Promise.all([
                influencerAPI.getProfile(),
                influencerAPI.getEarnings(),
            ]);

            const profile = profileRes.data?.influencerProfile || {};
            setPaymentProfile({
                easypaisaNumber: profile.easypaisaNumber || '',
                easypaisaScreenshotUrl: profile.easypaisaScreenshotUrl || '',
                fullName: profile.fullName || profileRes.data?.user?.name || profileRes.data?.user?.email || null,
                instagramUsername: profile.instagramUsername || null,
            });
            setEasypaisaNumber(profile.easypaisaNumber || '');
            setEasypaisaScreenshotUrl(profile.easypaisaScreenshotUrl || '');

            setCashouts(earningsRes.data?.cashouts || []);
            setCampaignPayments(earningsRes.data?.recentCollaborations || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load earnings data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const expectedPayments = useMemo(
        () => campaignPayments.filter((row) => Number(row.pendingAmount || 0) > 0),
        [campaignPayments]
    );

    const receivedPayments = useMemo(
        () => cashouts.filter((row) => row.status === 'approved'),
        [cashouts]
    );

    const totalEarned = useMemo(
        () => receivedPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        [receivedPayments]
    );

    const paymentPendingTotal = useMemo(
        () => expectedPayments.reduce((sum, row) => sum + Number(row.pendingAmount || 0), 0),
        [expectedPayments]
    );

    const primaryScreenshot = easypaisaScreenshotUrl || paymentProfile.easypaisaScreenshotUrl || '';

    const handleSavePaymentDetails = async () => {
        const normalizedNumber = easypaisaNumber.trim();
        const normalizedScreenshot = easypaisaScreenshotUrl.trim();

        if (!normalizedNumber) {
            toast.error('Please enter your Easypaisa number.');
            return;
        }

        setSaving(true);
        try {
            await influencerAPI.updatePaymentDetails({
                easypaisaNumber: normalizedNumber,
                easypaisaScreenshotUrl: normalizedScreenshot,
            });
            toast.success('Payment details saved');
            await load();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save payment details');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: colors.rust, animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '12px', color: colors.brown, fontSize: '14px' }}>Loading earnings…</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                color: colors.ink,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.rust }}>
                    Influencer earnings
                </p>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', color: colors.ink }}>
                    Track campaign payments and payout details
                </h1>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: colors.brown, maxWidth: 760 }}>
                    Add your Easypaisa details once, then review money that is still expected from ongoing campaigns and money that has already been cleared.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                <StatCard
                    label="Total earned"
                    value={money(totalEarned)}
                    helper="Payments cleared by admin and sent to your payout account"
                    icon={<TrendingUp size={18} />}
                    tint={colors.rust}
                />
                <StatCard
                    label="Pending amount"
                    value={money(paymentPendingTotal)}
                    helper="Campaign payments not cleared yet"
                    icon={<Clock3 size={18} />}
                    tint="#d97706"
                />
            </div>

            <Panel
                title="Easypaisa payout details"
                subtitle="This is the payout information admin will see while clearing your payments."
                icon={<Wallet size={18} />}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: colors.brown, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Easypaisa number
                        </label>
                        <input
                            type="text"
                            value={easypaisaNumber}
                            onChange={(e) => setEasypaisaNumber(e.target.value)}
                            placeholder="03xx-xxxxxxx"
                            style={{
                                width: '100%',
                                padding: '13px 14px',
                                borderRadius: '12px',
                                border: `1px solid ${colors.border}`,
                                background: 'rgba(255,255,255,0.60)',
                                outline: 'none',
                                color: colors.ink,
                                fontSize: '15px',
                                fontWeight: 700,
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: colors.brown, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Screenshot URL
                        </label>
                        <input
                            type="url"
                            value={easypaisaScreenshotUrl}
                            onChange={(e) => setEasypaisaScreenshotUrl(e.target.value)}
                            placeholder="https://..."
                            style={{
                                width: '100%',
                                padding: '13px 14px',
                                borderRadius: '12px',
                                border: `1px solid ${colors.border}`,
                                background: 'rgba(255,255,255,0.60)',
                                outline: 'none',
                                color: colors.ink,
                                fontSize: '15px',
                                fontWeight: 700,
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginTop: '14px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.brown, fontSize: '13px' }}>
                        <BadgeCheck size={16} color={colors.rust} />
                        {paymentProfile.easypaisaNumber ? `Currently saved for ${paymentProfile.fullName || paymentProfile.instagramUsername || 'your account'}` : 'Save once so admin can clear payouts to this number'}
                    </div>
                    <button
                        onClick={handleSavePaymentDetails}
                        disabled={saving}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            height: '48px',
                            padding: '0 20px',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${colors.rust}, ${colors.flame})`,
                            boxShadow: '0 14px 28px rgba(194,52,10,0.16)',
                            cursor: 'pointer',
                            opacity: saving ? 0.8 : 1,
                        }}
                    >
                        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save payout details'}
                    </button>
                </div>

                {primaryScreenshot && (
                    <div
                        style={{
                            marginTop: '16px',
                            borderRadius: '16px',
                            border: `1px solid ${colors.border}`,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.50))',
                            overflow: 'hidden',
                            boxShadow: '0 10px 24px rgba(194,52,10,0.06)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', borderBottom: `1px solid ${colors.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ImageIcon size={16} color={colors.rust} />
                                <div>
                                    <p style={{ margin: 0, fontWeight: 800, color: colors.ink }}>Easypaisa proof</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.brown }}>Visible to admin during payout review</p>
                                </div>
                            </div>
                            <span style={{ padding: '5px 10px', borderRadius: '999px', border: `1px solid rgba(5,150,105,0.20)`, background: 'rgba(5,150,105,0.10)', color: '#059669', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                Attached
                            </span>
                        </div>
                        <div style={{ padding: '16px' }}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '120px minmax(0, 1fr)',
                                    gap: '14px',
                                    alignItems: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '14px',
                                        border: `1px solid ${colors.border}`,
                                        background: 'rgba(255,255,255,0.60)',
                                        overflow: 'hidden',
                                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
                                    }}
                                >
                                    <img
                                        src={primaryScreenshot}
                                        alt="Easypaisa screenshot thumbnail"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p style={{ margin: 0, fontWeight: 800, color: colors.ink }}>Payment screenshot saved</p>
                                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: colors.brown }}>
                                        Admin can use this proof while clearing your earnings. Keep the screenshot current if your payout details change.
                                    </p>
                                    <a
                                        href={primaryScreenshot}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            width: 'fit-content',
                                            color: colors.rust,
                                            fontSize: '13px',
                                            fontWeight: 800,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Open full screenshot
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Panel>

            <Panel
                title="Expected payments"
                subtitle="Ongoing campaigns with amounts that are still waiting to be cleared."
                icon={<ReceiptText size={18} />}
            >
                {expectedPayments.length === 0 ? (
                    <EmptyState
                        title="No pending campaign payments"
                        description="Once a brand clears a campaign payment, the amount will appear here until it is fully received."
                    />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <Th>Campaign</Th>
                                    <Th>Brand</Th>
                                    <Th>Contract</Th>
                                    <Th>Pending</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {expectedPayments.map((row) => (
                                    <tr key={row._id}>
                                        <Td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 800, color: colors.ink }}>{row.campaignTitle || 'Campaign'}</span>
                                                <span style={{ fontSize: 12, color: colors.brown }}>{formatDate(row.createdAt)}</span>
                                            </div>
                                        </Td>
                                        <Td>{row.brandName || 'Brand'}</Td>
                                        <Td>{money(row.contractValue)}</Td>
                                        <Td style={{ fontWeight: 800, color: colors.rust }}>{money(row.pendingAmount)}</Td>
                                        <Td>
                                            <span style={rowBadgeStyle('#d97706', 'rgba(245,158,11,0.10)')}>Awaiting clearance</span>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            <Panel
                title="Payments received"
                subtitle="Cashouts approved by admin and sent to your Easypaisa details."
                icon={<Sparkles size={18} />}
            >
                {receivedPayments.length === 0 ? (
                    <EmptyState
                        title="No cleared payments yet"
                        description="Once admin approves a cashout, the cleared amount will show here."
                    />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <Th>Cashout</Th>
                                    <Th>Amount</Th>
                                    <Th>Transaction</Th>
                                    <Th>Cleared on</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {receivedPayments.map((row) => (
                                    <tr key={row._id}>
                                        <Td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 800, color: colors.ink }}>{row.cashoutCode || row._id}</span>
                                                <span style={{ fontSize: 12, color: colors.brown }}>Requested {formatDate(row.requestedAt || row.createdAt)}</span>
                                            </div>
                                        </Td>
                                        <Td style={{ fontWeight: 800, color: colors.rust }}>{money(row.amount)}</Td>
                                        <Td style={{ fontFamily: 'monospace', fontSize: 13, color: colors.brown }}>{row.transactionId || '—'}</Td>
                                        <Td>{formatDate(row.processedAt || row.reviewedAt)}</Td>
                                        <Td>
                                            <span style={rowBadgeStyle(statusLabels.approved.color, statusLabels.approved.bg)}>{statusLabels.approved.label}</span>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </motion.div>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div
            style={{
                padding: '22px',
                borderRadius: '14px',
                border: `1px dashed ${colors.border}`,
                background: 'rgba(255,255,255,0.28)',
                textAlign: 'center',
            }}
        >
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: colors.ink }}>{title}</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: colors.brown, lineHeight: 1.65 }}>{description}</p>
        </div>
    );
}

function Th({ children }: { children: ReactNode }) {
    return (
        <th style={{ padding: '0 14px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.brown }}>
            {children}
        </th>
    );
}

function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
    return (
        <td
            style={{
                padding: '14px',
                background: colors.cardStrong,
                borderTop: `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
                color: colors.ink,
                ...style,
            }}
        >
            {children}
        </td>
    );
}

function rowBadgeStyle(color: string, bg: string): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px 12px',
        borderRadius: '999px',
        border: `1px solid ${color}28`,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    };
}
