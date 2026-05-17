'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { influencerAPI } from '@/lib/api';
import {
    Loader2, Inbox, Calendar, Clock, CheckCircle, XCircle,
    MessageSquare, Send, ChevronDown, ChevronUp, Eye, Handshake, X, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    sent: { label: 'New', color: '#C2340A', bg: 'rgba(194,52,10,0.08)', icon: <Send size={11} /> },
    viewed: { label: 'Viewed', color: '#7A5030', bg: 'rgba(122,80,48,0.08)', icon: <Eye size={11} /> },
    accepted: { label: 'Accepted', color: '#059669', bg: 'rgba(5,150,105,0.08)', icon: <CheckCircle size={11} /> },
    brand_payment_pending: { label: 'Payment pending', color: '#d97706', bg: 'rgba(217,119,6,0.08)', icon: <Clock size={11} /> },
    brand_paid_work_can_start: { label: 'Payment confirmed', color: '#059669', bg: 'rgba(5,150,105,0.08)', icon: <CheckCircle size={11} /> },
    rejected: { label: 'Declined', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: <XCircle size={11} /> },
    negotiation: { label: 'Negotiation', color: '#d97706', bg: 'rgba(217,119,6,0.08)', icon: <MessageSquare size={11} /> },
    deal_closed: { label: 'Deal Closed', color: '#059669', bg: 'rgba(5,150,105,0.08)', icon: <Handshake size={11} /> },
    expired: { label: 'Expired', color: '#7A5030', bg: 'rgba(255,255,255,0.22)', icon: <Clock size={11} /> },
    cancelled: { label: 'Cancelled', color: '#7A5030', bg: 'rgba(255,255,255,0.22)', icon: <XCircle size={11} /> },
};

const SURFACE = 'rgba(255,255,255,0.38)';
const SURFACE_ALT = 'rgba(255,255,255,0.48)';
const BORDER = 'rgba(255,255,255,0.65)';
const TEXT = '#1A0A00';
const MUTED = '#7A5030';

const escapeHtml = (value: unknown) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : '—';

function downloadRequestPdf(request: any) {
    const popup = window.open('', '_blank', 'width=900,height=1200');
    if (!popup) {
        toast.error('Please allow popups to download the PDF.');
        return;
    }

    const logoUrl = `${window.location.origin}/logo.png`;
    const brandDisplayName = request.brandName || request.brand?.companyName || request.brand?.businessName || 'Brand';
    const influencerDisplayName = request.influencerName || request.influencer?.fullName || 'Influencer';
    const title = `${brandDisplayName} campaign request to ${influencerDisplayName}`;
    const priceText = request.agreedPrice
        ? `$${request.agreedPrice.toLocaleString()}`
        : `$${request.budgetRangeMin?.toLocaleString() || '—'} – $${request.budgetRangeMax?.toLocaleString() || '—'}`;

    const detailRows = [
        ['Request Code', request.requestCode || '—'],
        ['Campaign Title', request.campaignTitle || '—'],
        ['Brand', request.brandName || '—'],
        ['Campaign Type', request.campaignType?.replace(/_/g, ' ') || '—'],
        ['Deliverables', request.deliverables || '—'],
        ['Required Elements', request.requiredElements || '—'],
        ['Video Length', request.videoLength || '—'],
        ['Agreed Price', priceText],
        ['Payment Terms', request.paymentTerms || '—'],
        ['Posting Deadline', formatDate(request.postingDeadline)],
        ['Campaign Start Date', formatDate(request.campaignStartDate)],
        ['Campaign End Date', formatDate(request.campaignEndDate)],
        ['Hashtags', request.hashtags || '—'],
        ['Disclosure Requirements', request.disclosureRequirements || '#Ad #Sponsored'],
        ['Status', STATUS_CFG[request.status]?.label || request.status || '—'],
    ];

    const optionalSections = [
        request.brandMessage ? `
            <section class="section">
                <h3>Message from Brand</h3>
                <p>${escapeHtml(request.brandMessage)}</p>
            </section>
        ` : '',
        request.campaignDescription ? `
            <section class="section">
                <h3>Campaign Description</h3>
                <p>${escapeHtml(request.campaignDescription)}</p>
            </section>
        ` : '',
        request.contentGuidelines ? `
            <section class="section">
                <h3>Content Guidelines</h3>
                <p>${escapeHtml(request.contentGuidelines)}</p>
            </section>
        ` : '',
        request.counterOfferPrice ? `
            <section class="section">
                <h3>Counter Offer</h3>
                <p><strong>Price:</strong> $${escapeHtml(request.counterOfferPrice.toLocaleString())}</p>
                ${request.counterOfferMessage ? `<p><strong>Message:</strong> ${escapeHtml(request.counterOfferMessage)}</p>` : ''}
            </section>
        ` : '',
    ].join('');

    popup.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(title)}</title>
            <meta charset="utf-8" />
            <style>
                body { font-family: Arial, sans-serif; margin: 0; color: #111827; background: #ffffff; }
                .page { max-width: 900px; margin: 0 auto; padding: 32px 40px 48px; }
                .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #6d28d9; padding-bottom: 18px; margin-bottom: 28px; }
                .header img { width: 44px; height: 44px; object-fit: contain; }
                .brand h1 { margin: 0; font-size: 24px; color: #111827; }
                .brand p { margin: 4px 0 0; color: #6b7280; font-size: 13px; }
                .title { margin-bottom: 22px; }
                .title h2 { margin: 0 0 6px; font-size: 22px; color: #111827; }
                .title p { margin: 0; color: #4b5563; font-size: 14px; }
                .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
                .item { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; break-inside: avoid; }
                .label { font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
                .value { font-size: 14px; color: #111827; font-weight: 600; line-height: 1.5; word-break: break-word; }
                .section { margin-top: 18px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px; break-inside: avoid; }
                .section h3 { margin: 0 0 10px; font-size: 15px; color: #6d28d9; }
                .section p { margin: 0; font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap; }
                .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 24px 28px 32px; } }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    <img src="${logoUrl}" alt="Porchest logo" />
                    <div class="brand">
                        <h1>Porchest</h1>
                        <p>Collaboration Request Summary</p>
                    </div>
                </div>
                <div class="title">
                    <h2>${escapeHtml(title)}</h2>
                    <p>Prepared for ${escapeHtml(influencerDisplayName)} from the details provided by ${escapeHtml(brandDisplayName)}.</p>
                </div>
                <div class="grid">
                    ${detailRows.map(([label, value]) => `
                        <div class="item">
                            <div class="label">${escapeHtml(label)}</div>
                            <div class="value">${escapeHtml(value)}</div>
                        </div>
                    `).join('')}
                </div>
                ${optionalSections}
                <div class="footer">
                    Powered by Porchest · Generated on ${escapeHtml(new Date().toLocaleString())}.
                </div>
            </div>
        </body>
        </html>
    `);
    popup.document.close();
    popup.onload = () => {
        popup.focus();
        popup.print();
    };
}

function RequestDetailPanel({ request, onRespond, responding }: { request: any; onRespond: (id: string, action: string, data?: any) => void; responding: boolean }) {
    const [counterPrice, setCounterPrice] = useState('');
    const [counterMsg, setCounterMsg] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showNegotiate, setShowNegotiate] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [postUrl, setPostUrl] = useState('');
    const [submittingVer, setSubmittingVer] = useState(false);

    const canRespond = ['requested', 'sent', 'viewed', 'pending', 'countered', 'negotiation'].includes(request.status);
    const canNegotiate = ['requested', 'sent', 'viewed', 'pending', 'countered', 'negotiation'].includes(request.status);
    const isAccepted = ['accepted', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'].includes(request.status);

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postUrl.includes('instagram.com')) return toast.error('Please enter a valid Instagram post URL');
        setSubmittingVer(true);
        try {
            await influencerAPI.submitVerification({ campaignRequestId: request._id, postUrl });
            toast.success('Post submitted for verification!');
            setPostUrl('');
            onRespond(request._id, 'refresh');
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
    ].filter((field) => field.val && field.val !== '—');

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }} style={{ overflow: 'hidden', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isAccepted && (
                    <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', marginBottom: '4px', backdropFilter: 'blur(12px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(194,52,10,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={16} style={{ color: '#C2340A' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '800', color: TEXT }}>Submit for Verification</p>
                                <p style={{ fontSize: '11px', color: MUTED }}>Post the content on Instagram and paste the URL below to get paid.</p>
                            </div>
                        </div>
                        <form onSubmit={handleVerifySubmit} style={{ display: 'flex', gap: '10px' }}>
                            <input required value={postUrl} onChange={(e) => setPostUrl(e.target.value)}
                                placeholder="https://www.instagram.com/p/..." className="input-dark"
                                style={{ flex: 1, height: '44px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontSize: '13px' }} />
                            <button type="submit" disabled={submittingVer}
                                style={{ padding: '0 20px', borderRadius: '12px', background: '#22c55e', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                {submittingVer ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Submit
                            </button>
                        </form>
                    </div>
                )}

                {request.brandMessage && (
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}>
                        <p style={{ fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Message from Brand</p>
                        <p style={{ fontSize: '13px', color: MUTED, lineHeight: '1.7' }}>{request.brandMessage}</p>
                    </div>
                )}

                {request.status === 'brand_payment_pending' && (
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}>
                        <p style={{ fontSize: '12px', color: '#C2340A', fontWeight: '700', marginBottom: '4px' }}>Accepted, waiting for brand payment</p>
                        <p style={{ fontSize: '12px', color: MUTED, lineHeight: '1.6' }}>The collaboration will activate once the brand confirms payment.</p>
                    </div>
                )}

                {request.status === 'brand_paid_work_can_start' && (
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}>
                        <p style={{ fontSize: '12px', color: '#1A0A00', fontWeight: '700', marginBottom: '4px' }}>Payment confirmed</p>
                        <p style={{ fontSize: '12px', color: MUTED, lineHeight: '1.6' }}>You can now start work and submit the post link after approval.</p>
                    </div>
                )}

                {request.campaignDescription && (
                    <div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Campaign Description</p>
                        <p style={{ fontSize: '13px', color: MUTED, lineHeight: '1.7' }}>{request.campaignDescription}</p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                    {fields.map((field) => (
                        <div key={field.label} style={{ padding: '10px 14px', borderRadius: '12px', background: SURFACE_ALT, border: `1px solid ${BORDER}` }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{field.label}</p>
                            <p style={{ fontSize: '13px', color: TEXT, fontWeight: '600', textTransform: 'capitalize' }}>{field.val}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => downloadRequestPdf(request)}
                        style={{
                            padding: '11px 16px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.45)',
                            border: '1px solid #EDD9BC',
                            color: '#C2340A',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            fontFamily: 'inherit',
                        }}
                    >
                        <Download size={13} /> Download PDF
                    </button>
                </div>

                {request.contentGuidelines && (
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}>
                        <p style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Content Guidelines</p>
                        <p style={{ fontSize: '12px', color: MUTED, lineHeight: '1.6' }}>{request.contentGuidelines}</p>
                    </div>
                )}

                    {request.status === 'negotiation' && request.counterOfferPrice && (
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <p style={{ fontSize: '11px', color: '#C2340A', fontWeight: '700', marginBottom: '6px' }}>Current Counter Offer</p>
                        <p style={{ fontWeight: '800', fontSize: '20px', color: '#C2340A' }}>${request.counterOfferPrice.toLocaleString()}</p>
                        {request.counterOfferMessage && <p style={{ fontSize: '12px', color: MUTED, marginTop: '4px' }}>{request.counterOfferMessage}</p>}
                    </div>
                )}

                {(canRespond || canNegotiate) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {canRespond && (
                                <button onClick={() => onRespond(request._id, 'accepted')} disabled={responding}
                                    style={{ flex: 1, padding: '12px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #C2340A, #E8400A)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: responding ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: '0 0 24px rgba(194,52,10,0.18)', fontFamily: 'inherit', opacity: responding ? 0.6 : 1 }}>
                                    <CheckCircle size={14} /> Accept Request
                                </button>
                            )}
                            {canNegotiate && (
                                <button onClick={() => { setShowNegotiate(!showNegotiate); setShowReject(false); }}
                                    style={{ flex: 1, padding: '12px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', color: '#C2340A', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontFamily: 'inherit', backdropFilter: 'blur(12px)' }}>
                                    <MessageSquare size={14} /> Counter Offer
                                </button>
                            )}
                            {canRespond && (
                                <button onClick={() => { setShowReject(!showReject); setShowNegotiate(false); }}
                                    style={{ padding: '12px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(220,38,38,0.22)', color: '#dc2626', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontFamily: 'inherit', backdropFilter: 'blur(12px)' }}>
                                    <XCircle size={14} /> Decline
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {showNegotiate && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '18px', borderRadius: '16px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)' }}>
                                        <p style={{ fontSize: '12px', color: '#C2340A', fontWeight: '700', marginBottom: '12px' }}>Send a Counter Offer</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '12px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Your Price (USD)</label>
                                                <input type="number" min={0} value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)}
                                                    placeholder="e.g. 500" className="input-dark" style={{ fontSize: '14px', height: '42px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Message (optional)</label>
                                                <input value={counterMsg} onChange={(e) => setCounterMsg(e.target.value)}
                                                    placeholder="Explain your offer…" className="input-dark" style={{ fontSize: '13px', height: '42px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }} />
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            if (!counterPrice) return toast.error('Enter your counter offer price');
                                            onRespond(request._id, 'negotiation', { counterOfferPrice: Number(counterPrice), counterOfferMessage: counterMsg });
                                        }} disabled={responding}
                                            style={{ padding: '10px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #C2340A, #E8400A)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                                            <Send size={13} /> Send Counter Offer
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showReject && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}>
                                        <p style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700', marginBottom: '12px' }}>Decline Request</p>
                                        <label style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Reason (optional)</label>
                                        <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="e.g. Not aligned with my content…" className="input-dark" style={{ fontSize: '13px', height: '42px', marginBottom: '12px', background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }} />
                                        <button onClick={() => onRespond(request._id, 'rejected', { rejectionReason })} disabled={responding}
                                            style={{ padding: '10px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(220,38,38,0.22)', color: '#dc2626', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
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

export default function RequestsBoard({ onChanged }: { onChanged?: () => void }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [responding, setResponding] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    const loadRequests = async () => {
        const res = await influencerAPI.getRequests();
        setRequests(res.data.requests || []);
    };

    useEffect(() => {
        loadRequests()
            .catch(() => toast.error('Failed to load requests'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const handleUpdated = () => {
            loadRequests().catch(() => {});
            onChanged?.();
        };

        window.addEventListener('porchest-collaboration-updated', handleUpdated as EventListener);
        window.addEventListener('porchest-collaboration-created', handleUpdated as EventListener);

        return () => {
            window.removeEventListener('porchest-collaboration-updated', handleUpdated as EventListener);
            window.removeEventListener('porchest-collaboration-created', handleUpdated as EventListener);
        };
    }, [onChanged]);

    const handleRespond = async (id: string, action: string, data?: any) => {
        if (action === 'refresh') {
            try {
                await loadRequests();
                onChanged?.();
            } catch {
                toast.error('Failed to refresh requests');
            }
            return;
        }

        setResponding(true);
        try {
            const payload = { status: action, ...data };
            const result = await influencerAPI.respondToRequest(id, payload);
            if (result?.data?.success === false || result?.data?.error || result?.data?.message) {
                throw new Error(result?.data?.error || result?.data?.message || 'Unable to update request');
            }
            toast.success(
                action === 'accepted'
                    ? 'Request accepted. It moved to Collaborations.'
                    : action === 'rejected'
                        ? 'Request declined.'
                        : 'Counter offer sent! 💬'
            );
            await loadRequests();
            onChanged?.();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to respond to request');
        } finally {
            setResponding(false);
        }
    };

    const FILTERS = [
        { key: 'all', label: 'All', color: '#C2340A' },
        { key: 'requested,sent,viewed,pending', label: 'New', color: '#C2340A' },
        { key: 'countered,negotiation', label: 'Countered', color: '#d97706' },
        { key: 'rejected,declined,cancelled', label: 'Declined', color: '#dc2626' },
        { key: 'deal_closed', label: 'Deals', color: '#059669' },
    ];

    const filtered = requests.filter((request) => {
        if (filter === 'all') return true;
        const statuses = filter.split(',');
        return statuses.includes(request.status);
    });

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite', color: '#C2340A' }} />
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '40px' }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
                <h1 style={{ fontWeight: '800', fontSize: '24px', color: TEXT, letterSpacing: '-0.03em', marginBottom: '4px' }}>
                    Collaboration Requests
                </h1>
                <p style={{ fontSize: '13px', color: MUTED }}>
                    {requests.length} incoming collaboration request{requests.length !== 1 ? 's' : ''}
                </p>
            </motion.div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: SURFACE_ALT, borderRadius: '12px', padding: '4px', border: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                {FILTERS.map((filterItem) => (
                    <button key={filterItem.key} onClick={() => setFilter(filterItem.key)}
                        style={{ padding: '7px 16px', borderRadius: '9px', border: 'none', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 180ms ease', whiteSpace: 'nowrap', background: filter === filterItem.key ? `${filterItem.color}18` : 'transparent', color: filter === filterItem.key ? filterItem.color : MUTED }}>
                        {filterItem.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="glass-card" style={{ padding: '60px', borderRadius: '28px', textAlign: 'center' }}>
                    <Inbox size={48} style={{ color: 'rgba(194,52,10,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: '700', fontSize: '16px', color: TEXT, marginBottom: '6px' }}>
                        {requests.length === 0 ? 'No collaborations yet' : 'No matching collaboration items'}
                    </p>
                    <p style={{ color: MUTED, fontSize: '13px' }}>
                        {requests.length === 0
                            ? 'Complete your profile to start receiving collaboration requests from brands.'
                            : 'Try adjusting the filter above.'}
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <AnimatePresence>
                    {filtered.map((request, index) => {
                        const statusConfig = STATUS_CFG[request.status] || STATUS_CFG.sent;
                        const isOpen = expanded === request._id;
                        const isNew = request.status === 'sent';

                        return (
                            <motion.div key={request._id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04, duration: 0.3 }}
                                className="glass-card" style={{
                                    borderRadius: '22px', overflow: 'hidden',
                                    border: isNew ? '1px solid rgba(194,52,10,0.2)' : `1px solid ${BORDER}`,
                                    boxShadow: isNew ? '0 0 30px rgba(194,52,10,0.08)' : '0 8px 30px rgba(155,111,80,0.05)',
                                    background: SURFACE,
                                    backdropFilter: 'blur(12px)',
                                }}>
                                <div onClick={() => setExpanded(isOpen ? null : request._id)}
                                    style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', cursor: 'pointer' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '14px',
                                        background: request.brandLogoUrl ? 'transparent' : 'linear-gradient(135deg, #C2340A, #E8400A)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '800', fontSize: '15px', color: '#fff', flexShrink: 0,
                                        overflow: 'hidden', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)',
                                    }}>
                                        {request.brandLogoUrl ? (
                                            <img src={request.brandLogoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            (request.brandName || '?')[0]?.toUpperCase()
                                        )}
                                    </div>

                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <p style={{ fontWeight: '700', color: TEXT, fontSize: '14px', marginBottom: '2px' }}>
                                            {request.campaignTitle}
                                        </p>
                                        <p style={{ fontSize: '12px', color: MUTED }}>
                                            {request.brandName || 'Brand'} • {request.campaignType?.replace(/_/g, ' ') || 'Campaign'}
                                        </p>
                                    </div>

                                    <p style={{ fontWeight: '800', fontSize: '15px', color: '#C2340A' }}>
                                        {request.agreedPrice ? `$${request.agreedPrice.toLocaleString()}` : request.budgetRangeMin ? `$${request.budgetRangeMin}–$${request.budgetRangeMax}` : '—'}
                                    </p>

                                    <span style={{ fontSize: '11px', color: MUTED, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={10} /> {new Date(request.createdAt).toLocaleDateString()}
                                    </span>

                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        padding: '4px 12px', borderRadius: '99px',
                                        background: statusConfig.bg, border: `1px solid ${statusConfig.color}28`,
                                        color: statusConfig.color, fontSize: '11px', fontWeight: '700',
                                    }}>
                                        {statusConfig.icon} {statusConfig.label}
                                    </span>

                                    {isOpen
                                        ? <ChevronUp size={14} style={{ color: MUTED, flexShrink: 0 }} />
                                        : <ChevronDown size={14} style={{ color: MUTED, flexShrink: 0 }} />}
                                </div>

                                <AnimatePresence>
                                    {isOpen && <RequestDetailPanel request={request} onRespond={handleRespond} responding={responding} />}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
