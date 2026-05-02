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
        <label className="text-[11px] font-bold text-white/50 uppercase tracking-wide">
            {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder-white/30";

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
                    className="w-full max-w-[700px] bg-[#0c0c0c] border border-white/10 rounded-[36px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden my-auto">

                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div>
                            <h2 className="font-bold text-xl text-white mb-1">
                                New Campaign Request
                            </h2>
                            <p className="text-xs font-medium text-white/50">
                                To: <strong className="text-white">{influencer.fullName}</strong> · {influencer.niche}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center shadow-sm">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Important note */}
                    <div className="mx-8 mt-6 p-4 rounded-xl bg-amber-900/20 border border-amber-500/20 flex gap-3 items-start">
                        <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200 leading-relaxed font-medium">
                            All terms are <strong className="text-amber-400">locked once submitted</strong>. The agreed price cannot be renegotiated. If the influencer rejects, you must create a new request.
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
                        <div className="p-6 rounded-[24px] bg-purple-900/10 border border-purple-500/20">
                            <Field label="Agreed Price (USD)" required>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-bold text-lg pointer-events-none">$</span>
                                    <input required type="number" min="1" value={form.agreedPrice} onChange={set('agreedPrice')}
                                        placeholder="0.00" className={`${inputClass} pl-9 font-bold text-lg text-white border-white/10 shadow-sm`} />
                                </div>
                            </Field>
                            <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                                <p className="text-xs font-bold text-white mb-2">Standard Payment Terms</p>
                                <ul className="list-disc pl-5 text-xs text-white/60 font-medium space-y-1">
                                    <li>50% advance before campaign starts</li>
                                    <li>50% after deliverables are verified</li>
                                </ul>
                                <p className="text-[11px] font-bold text-white/40 mt-3 uppercase tracking-wide">
                                    By sending this request, you agree to Porchest standard payment terms.
                                </p>
                            </div>
                        </div>

                        {/* Terms checkbox */}
                        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${agreedToTerms ? 'bg-green-900/20 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                            <input type="checkbox" required checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-green-600 cursor-pointer" />
                            <span className={`text-sm font-medium ${agreedToTerms ? 'text-green-400' : 'text-white/60'}`}>
                                I agree to the <a href="#" onClick={e => e.preventDefault()} className="text-white hover:text-white/80 underline font-bold">Porchest Terms & Conditions</a> and Payment Policy
                            </span>
                        </label>

                        {/* Submit */}
                        <button type="submit" disabled={loading || !agreedToTerms}
                            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${loading || !agreedToTerms ? 'bg-white/10 text-white/30 cursor-not-allowed shadow-none' : 'bg-[#a855f7] text-white hover:bg-[#c084fc] shadow-purple-500/20'}`}>
                            <Send size={18} /> {loading ? 'Sending Request…' : 'Send Campaign Request'}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
