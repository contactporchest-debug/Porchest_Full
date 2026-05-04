'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Influencer { _id: string; fullName: string; email: string; niche: string; followers: number; }
interface Props { influencer: Influencer | null; onClose: () => void; onSuccess: () => void; }

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}{required && <span style={{ color: '#E8400A', marginLeft: '4px' }}>*</span>}
        </label>
        {children}
    </div>
);

const IS: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC',
    color: '#1A0A00', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit'
};

export default function CreateRequestModal({ influencer, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        campaignTitle: '',
        campaignDescription: '',
        deliverables: '',
        requiredElements: '',
        videoLength: '',
        postingDeadline: '',
        contentGuidelines: '',
        hashtags: '',
        disclosureRequirements: '#Ad #Sponsored',
        agreedPrice: '',
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!influencer) return;
        setLoading(true);
        try {
            await brandAPI.createRequest({
                influencerId: influencer._id,
                ...form,
                agreedPrice: Number(form.agreedPrice),
                paymentTerms: '50% advance before campaign starts, 50% after deliverables are verified',
                postingDeadline: new Date(form.postingDeadline).toISOString(),
            });
            toast.success('Campaign request sent!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    if (!influencer) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(26,10,0,0.5)', backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                
                <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    style={{ width: '100%', maxWidth: '700px', background: '#FDF6EE', border: '1px solid #EDD9BC', borderRadius: '24px', boxShadow: '0 16px 40px rgba(26,10,0,0.1)', overflow: 'hidden', margin: 'auto' }}>

                    {/* Header */}
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ fontWeight: 700, fontSize: '20px', color: '#1A0A00', marginBottom: '4px' }}>
                                New Campaign Request
                            </h2>
                            <p style={{ fontSize: '13px', fontWeight: 500, color: '#7A5030' }}>
                                To: <strong style={{ color: '#1A0A00' }}>{influencer.fullName}</strong> · {influencer.niche}
                            </p>
                        </div>
                        <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.8)', border: '1px solid #EDD9BC', color: '#1A0A00', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Important note */}
                    <div style={{ margin: '24px 32px 0', padding: '16px', borderRadius: '12px', background: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.3)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <AlertCircle size={16} style={{ color: '#E8400A', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '13px', color: '#7A5030', lineHeight: 1.65, fontWeight: 500 }}>
                            All terms are <strong style={{ color: '#C2340A' }}>locked once submitted</strong>. The agreed price cannot be renegotiated. If the influencer rejects, you must create a new request.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Row 1 */}
                        <Field label="Campaign Title" required>
                            <input required value={form.campaignTitle} onChange={set('campaignTitle')}
                                placeholder="e.g. Smart Gadgets Review Series" style={IS} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                        </Field>

                        <Field label="Campaign Description" required>
                            <textarea required value={form.campaignDescription} onChange={set('campaignDescription')}
                                placeholder="Describe the campaign goal, product, and target message…"
                                rows={3} style={{ ...IS, resize: 'vertical' }} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <Field label="Deliverables" required>
                            <textarea required value={form.deliverables} onChange={set('deliverables')}
                                    placeholder="e.g. 1 × 60s Reel, 1 × Carousel Post" rows={2} style={{ ...IS, resize: 'vertical' }} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                        </Field>
                            <Field label="Required Elements" required>
                                <textarea required value={form.requiredElements} onChange={set('requiredElements')}
                                    placeholder="e.g. Show product unboxing, mention price, do CTA" rows={2} style={{ ...IS, resize: 'vertical' }} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                            </Field>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <Field label="Video Length" required>
                                <select required value={form.videoLength} onChange={set('videoLength')} style={{ ...IS, cursor: 'pointer' }} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')}>
                                    <option value="">Select duration</option>
                                    {['15 seconds', '30 seconds', '60 seconds', '90 seconds', '2 minutes', '3–5 minutes'].map(v =>
                                        <option key={v} value={v}>{v}</option>)}
                                </select>
                            </Field>
                            <Field label="Posting Deadline" required>
                                <input required type="date" value={form.postingDeadline} onChange={set('postingDeadline')}
                                    min={new Date().toISOString().split('T')[0]} style={IS} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                            </Field>
                        </div>

                        <Field label="Content Guidelines" required>
                            <textarea required value={form.contentGuidelines} onChange={set('contentGuidelines')}
                                placeholder="Brand tone, what to avoid, specific talking points, CTA wording…"
                                rows={3} style={{ ...IS, resize: 'vertical' }} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <Field label="Hashtags">
                                <input value={form.hashtags} onChange={set('hashtags')}
                                    placeholder="#YourBrand #Sponsored" style={IS} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                            </Field>
                            <Field label="Disclosure Requirements">
                                <input value={form.disclosureRequirements} onChange={set('disclosureRequirements')}
                                    placeholder="#Ad #Sponsored" style={IS} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                            </Field>
                        </div>

                        {/* Price & Fixed Terms Block */}
                        <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(194,52,10,0.05)', border: '1px solid rgba(194,52,10,0.15)' }}>
                            <Field label="Agreed Price (USD)" required>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', fontWeight: 700, fontSize: '18px', pointerEvents: 'none' }}>$</span>
                                    <input required type="number" min="1" value={form.agreedPrice} onChange={set('agreedPrice')}
                                        placeholder="0.00" style={{ ...IS, paddingLeft: '36px', fontWeight: 700, fontSize: '18px', color: '#1A0A00' }} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                                </div>
                            </Field>
                            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A0A00', marginBottom: '8px' }}>Standard Payment Terms</p>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#7A5030', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <li>50% advance before campaign starts</li>
                                    <li>50% after deliverables are verified</li>
                                </ul>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#C4A882', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    By sending this request, you agree to Porchest standard payment terms.
                                </p>
                            </div>
                        </div>

                        {/* Terms checkbox */}
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', border: `1px solid ${agreedToTerms ? 'rgba(74,222,128,0.3)' : '#EDD9BC'}`, background: agreedToTerms ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <input type="checkbox" required checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} style={{ marginTop: '2px', accentColor: '#4ade80', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }} />
                            <span style={{ fontSize: '14px', fontWeight: 500, color: agreedToTerms ? '#166534' : '#7A5030', lineHeight: 1.5 }}>
                                I agree to the <a href="#" onClick={e => e.preventDefault()} style={{ color: agreedToTerms ? '#166534' : '#1A0A00', textDecoration: 'underline', fontWeight: 700 }}>Porchest Terms & Conditions</a> and Payment Policy
                            </span>
                        </label>

                        {/* Submit */}
                        <button type="submit" disabled={loading || !agreedToTerms}
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s', background: loading || !agreedToTerms ? 'rgba(194,52,10,0.3)' : '#C2340A', color: loading || !agreedToTerms ? 'rgba(255,255,255,0.6)' : '#fff', border: 'none', cursor: loading || !agreedToTerms ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                            onMouseEnter={e => { if (!loading && agreedToTerms) e.currentTarget.style.background = '#E8400A'; }}
                            onMouseLeave={e => { if (!loading && agreedToTerms) e.currentTarget.style.background = '#C2340A'; }}
                        >
                            <Send size={18} /> {loading ? 'Sending Request…' : 'Send Campaign Request'}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
