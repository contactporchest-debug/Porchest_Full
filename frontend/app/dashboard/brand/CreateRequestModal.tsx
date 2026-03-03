'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Influencer { _id: string; fullName: string; email: string; niche: string; followers: number; }
interface Props { influencer: Influencer | null; onClose: () => void; onSuccess: () => void; }

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}{required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
        </label>
        {children}
    </div>
);

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 180ms ease', boxSizing: 'border-box',
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
        paymentTerms: '',
    });

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
                style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)', overflowY: 'auto', padding: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    style={{ maxWidth: '700px', margin: '0 auto', background: 'rgba(10,9,20,0.97)', border: '1px solid rgba(123,63,242,0.25)', borderRadius: '36px', boxShadow: '0 0 100px rgba(123,63,242,0.2)', overflow: 'hidden' }}>

                    {/* Header */}
                    <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(123,63,242,0.05)' }}>
                        <div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '17px', color: '#fff', marginBottom: '2px' }}>
                                New Campaign Request
                            </h2>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                                To: <strong style={{ color: '#a78bfa' }}>{influencer.fullName}</strong> · {influencer.niche}
                            </p>
                        </div>
                        <button onClick={onClose} style={{ marginLeft: 'auto', width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={15} />
                        </button>
                    </div>

                    {/* Important note */}
                    <div style={{ margin: '20px 28px 0', padding: '12px 16px', borderRadius: '12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <AlertCircle size={14} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '1px' }} />
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
                            All terms are <strong style={{ color: '#fbbf24' }}>locked once submitted</strong>. The agreed price cannot be renegotiated. If the influencer rejects, you must create a new request.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Row 1 */}
                        <Field label="Campaign Title" required>
                            <input required value={form.campaignTitle} onChange={set('campaignTitle')}
                                placeholder="e.g. Smart Gadgets Review Series" style={inputStyle} />
                        </Field>

                        <Field label="Campaign Description" required>
                            <textarea required value={form.campaignDescription} onChange={set('campaignDescription')}
                                placeholder="Describe the campaign goal, product, and target message…"
                                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Field label="Deliverables" required>
                                <textarea required value={form.deliverables} onChange={set('deliverables')}
                                    placeholder="e.g. 1 × 60s Reel, 3 × Stories" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                            </Field>
                            <Field label="Required Elements" required>
                                <textarea required value={form.requiredElements} onChange={set('requiredElements')}
                                    placeholder="e.g. Show product unboxing, mention price, do CTA" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                            </Field>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Field label="Video Length" required>
                                <select required value={form.videoLength} onChange={set('videoLength')} style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="">Select duration</option>
                                    {['15 seconds', '30 seconds', '60 seconds', '90 seconds', '2 minutes', '3–5 minutes'].map(v =>
                                        <option key={v} value={v}>{v}</option>)}
                                </select>
                            </Field>
                            <Field label="Posting Deadline" required>
                                <input required type="date" value={form.postingDeadline} onChange={set('postingDeadline')}
                                    min={new Date().toISOString().split('T')[0]} style={{ ...inputStyle, colorScheme: 'dark' }} />
                            </Field>
                        </div>

                        <Field label="Content Guidelines" required>
                            <textarea required value={form.contentGuidelines} onChange={set('contentGuidelines')}
                                placeholder="Brand tone, what to avoid, specific talking points, CTA wording…"
                                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Field label="Hashtags">
                                <input value={form.hashtags} onChange={set('hashtags')}
                                    placeholder="#YourBrand #Sponsored" style={inputStyle} />
                            </Field>
                            <Field label="Disclosure Requirements">
                                <input value={form.disclosureRequirements} onChange={set('disclosureRequirements')}
                                    placeholder="#Ad #Sponsored" style={inputStyle} />
                            </Field>
                        </div>

                        {/* Price — highlighted */}
                        <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.25)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <Field label="Agreed Price (USD)" required>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', fontWeight: '700', fontSize: '14px', pointerEvents: 'none' }}>$</span>
                                        <input required type="number" min="1" value={form.agreedPrice} onChange={set('agreedPrice')}
                                            placeholder="0.00" style={{ ...inputStyle, paddingLeft: '28px', fontFamily: 'Space Grotesk', fontWeight: '700', color: '#a78bfa', fontSize: '16px' }} />
                                    </div>
                                </Field>
                                <Field label="Payment Terms" required>
                                    <select required value={form.paymentTerms} onChange={set('paymentTerms')} style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="">Select terms</option>
                                        {['50% upfront, 50% on delivery', '100% on delivery', '100% upfront', 'On verification'].map(v =>
                                            <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            style={{ padding: '14px', borderRadius: '16px', background: loading ? 'rgba(123,63,242,0.4)' : 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 30px rgba(123,63,242,0.4)', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', marginTop: '4px' }}>
                            <Send size={16} /> {loading ? 'Sending Request…' : 'Send Campaign Request'}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
