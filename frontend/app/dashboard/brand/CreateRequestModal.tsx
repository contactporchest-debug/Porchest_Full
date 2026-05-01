'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Influencer { _id: string; fullName: string; email: string; niche: string; followers: number; }
interface Props { influencer: Influencer | null; onClose: () => void; onSuccess: () => void; }

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-stone-500/10 focus:ring-2 focus:ring-stone-500/10 transition-all placeholder-slate-400";

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
                className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm overflow-y-auto p-6 flex items-center justify-center">
                
                <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full max-w-[700px] bg-[rgba(255,255,255,0.98)] border border-[rgba(148,163,184,0.18)] rounded-[36px] shadow-[0_24px_60px_rgba(15,23,42,0.1)] overflow-hidden my-auto">

                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-stone-50/50">
                        <div>
                            <h2 className="font-bold text-xl text-[#172033] mb-1">
                                New Campaign Request
                            </h2>
                            <p className="text-xs font-medium text-slate-500">
                                To: <strong className="text-stone-700">{influencer.fullName}</strong> · {influencer.niche}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Important note */}
                    <div className="mx-8 mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 items-start">
                        <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            All terms are <strong className="text-amber-600">locked once submitted</strong>. The agreed price cannot be renegotiated. If the influencer rejects, you must create a new request.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
                        {/* Row 1 */}
                        <Field label="Campaign Title" required>
                            <input required value={form.campaignTitle} onChange={set('campaignTitle')}
                                placeholder="e.g. Smart Gadgets Review Series" className={inputClass} />
                        </Field>

                        <Field label="Campaign Description" required>
                            <textarea required value={form.campaignDescription} onChange={set('campaignDescription')}
                                placeholder="Describe the campaign goal, product, and target message…"
                                rows={3} className={`${inputClass} resize-y`} />
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Deliverables" required>
                                <textarea required value={form.deliverables} onChange={set('deliverables')}
                                    placeholder="e.g. 1 × 60s Reel, 3 × Stories" rows={2} className={`${inputClass} resize-y`} />
                            </Field>
                            <Field label="Required Elements" required>
                                <textarea required value={form.requiredElements} onChange={set('requiredElements')}
                                    placeholder="e.g. Show product unboxing, mention price, do CTA" rows={2} className={`${inputClass} resize-y`} />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Video Length" required>
                                <select required value={form.videoLength} onChange={set('videoLength')} className={`${inputClass} cursor-pointer`}>
                                    <option value="">Select duration</option>
                                    {['15 seconds', '30 seconds', '60 seconds', '90 seconds', '2 minutes', '3–5 minutes'].map(v =>
                                        <option key={v} value={v}>{v}</option>)}
                                </select>
                            </Field>
                            <Field label="Posting Deadline" required>
                                <input required type="date" value={form.postingDeadline} onChange={set('postingDeadline')}
                                    min={new Date().toISOString().split('T')[0]} className={inputClass} />
                            </Field>
                        </div>

                        <Field label="Content Guidelines" required>
                            <textarea required value={form.contentGuidelines} onChange={set('contentGuidelines')}
                                placeholder="Brand tone, what to avoid, specific talking points, CTA wording…"
                                rows={3} className={`${inputClass} resize-y`} />
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Hashtags">
                                <input value={form.hashtags} onChange={set('hashtags')}
                                    placeholder="#YourBrand #Sponsored" className={inputClass} />
                            </Field>
                            <Field label="Disclosure Requirements">
                                <input value={form.disclosureRequirements} onChange={set('disclosureRequirements')}
                                    placeholder="#Ad #Sponsored" className={inputClass} />
                            </Field>
                        </div>

                        {/* Price & Fixed Terms Block */}
                        <div className="p-6 rounded-[24px] bg-[#f5f3ff] border border-stone-200">
                            <Field label="Agreed Price (USD)" required>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-700 font-bold text-lg pointer-events-none">$</span>
                                    <input required type="number" min="1" value={form.agreedPrice} onChange={set('agreedPrice')}
                                        placeholder="0.00" className={`${inputClass} pl-9 font-bold text-lg text-stone-900 border-stone-200 shadow-sm`} />
                                </div>
                            </Field>
                            <div className="mt-5 p-4 rounded-xl bg-white border border-stone-100 shadow-sm">
                                <p className="text-xs font-bold text-stone-900 mb-2">Standard Payment Terms</p>
                                <ul className="list-disc pl-5 text-xs text-slate-600 font-medium space-y-1">
                                    <li>50% advance before campaign starts</li>
                                    <li>50% after deliverables are verified</li>
                                </ul>
                                <p className="text-[11px] font-bold text-stone-400 mt-3 uppercase tracking-wide">
                                    By sending this request, you agree to Porchest standard payment terms.
                                </p>
                            </div>
                        </div>

                        {/* Terms checkbox */}
                        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${agreedToTerms ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <input type="checkbox" required checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-green-600 cursor-pointer" />
                            <span className={`text-sm font-medium ${agreedToTerms ? 'text-green-800' : 'text-slate-600'}`}>
                                I agree to the <a href="#" onClick={e => e.preventDefault()} className="text-stone-700 hover:text-stone-800 underline font-bold">Porchest Terms & Conditions</a> and Payment Policy
                            </span>
                        </label>

                        {/* Submit */}
                        <button type="submit" disabled={loading || !agreedToTerms}
                            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${loading || !agreedToTerms ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#9b6f50] text-white hover:bg-[#6a35d4] shadow-stone-500/10'}`}>
                            <Send size={18} /> {loading ? 'Sending Request…' : 'Send Campaign Request'}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
