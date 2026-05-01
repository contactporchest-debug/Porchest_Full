'use client';

import { useState } from 'react';
import { apiPost } from '../../hooks/useApi';

const CONTENT_TYPES = ['Reel', 'Story', 'Feed Post', 'Carousel', 'Live', 'Giveaway'];
const OBJECTIVES = ['Awareness', 'Sales', 'App installs', 'Lead generation', 'Engagement'];

export default function RequestCollaborationButton({ influencerId, influencerName, rates }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [form, setForm] = useState({
        brandOffer: '',
        campaignObjective: '',
        brandIntro: '',
        productDetails: '',
        targetAudience: '',
        keyMessage: '',
        contentType: [],
        creativeDirection: '',
        mandatoryPoints: '',
        dosAndDonts: '',
        captionGuidelines: '',
        hashtags: '',
        callToAction: '',
        visualRequirements: '',
        postingDeadline: '',
        deliverables: '',
        usageRights: '',
        disclosureRequirements: 'Ad',
    });

    function toggle(field, value) {
        setForm((f) => ({ ...f, [field]: f[field].includes(value) ? f[field].filter((x) => x !== value) : [...f[field], value] }));
    }

    async function handleSend() {
        setSending(true);
        await apiPost('/collaborations', {
            influencerId,
            brief: { ...form, hashtags: form.hashtags.split(' ').filter(Boolean) },
            pricing: { brandOffer: Number(form.brandOffer) },
        });
        setSending(false);
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setOpen(false);
            setStep(1);
        }, 1800);
    }

    const inputClass = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50';

    return (
        <>
            <button onClick={() => setOpen(true)} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all">
                Request collaboration with @{influencerName || 'creator'}
            </button>

            {sent && <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/30 text-green-400 text-center text-sm">Collaboration request sent.</div>}

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900 border border-white/10 shadow-2xl">
                        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-5 flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Request collaboration</p>
                                <p className="text-xs text-gray-400">@{influencerName} - Step {step} of 3</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-xl">x</button>
                        </div>

                        <div className="p-5 space-y-4">
                            {step === 1 && (
                                <>
                                    {rates && <p className="text-xs text-gray-500">Rates: Reel ${rates.reelPrice || '-'} | Story ${rates.storyPrice || '-'} | Post ${rates.postPrice || '-'}</p>}
                                    <input type="number" className={inputClass} placeholder="Your offer in USD" value={form.brandOffer} onChange={(e) => setForm((f) => ({ ...f, brandOffer: e.target.value }))} />
                                    <div className="flex flex-wrap gap-2">
                                        {OBJECTIVES.map((objective) => (
                                            <button key={objective} type="button" onClick={() => setForm((f) => ({ ...f, campaignObjective: objective }))} className={`px-3 py-1.5 rounded-full text-xs border ${form.campaignObjective === objective ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                {objective}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {CONTENT_TYPES.map((type) => (
                                            <button key={type} type="button" onClick={() => toggle('contentType', type)} className={`px-3 py-1.5 rounded-full text-xs border ${form.contentType.includes(type) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {step === 2 && [
                                ['Brand introduction', 'brandIntro'],
                                ['Product / service details', 'productDetails'],
                                ['Target audience', 'targetAudience'],
                                ['Key message', 'keyMessage'],
                                ['Creative direction', 'creativeDirection'],
                                ['Mandatory talking points', 'mandatoryPoints'],
                                ["Do's and don'ts", 'dosAndDonts'],
                            ].map(([label, key]) => (
                                <textarea key={key} rows={2} className={`${inputClass} resize-none`} placeholder={label} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                            ))}

                            {step === 3 && (
                                <>
                                    {[
                                        ['Caption guidelines', 'captionGuidelines'],
                                        ['Hashtags, space separated', 'hashtags'],
                                        ['Call to action', 'callToAction'],
                                        ['Visual requirements', 'visualRequirements'],
                                        ['Deliverables', 'deliverables'],
                                        ['Usage rights', 'usageRights'],
                                    ].map(([label, key]) => (
                                        <textarea key={key} rows={2} className={`${inputClass} resize-none`} placeholder={label} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                                    ))}
                                    <input type="date" className={inputClass} value={form.postingDeadline} onChange={(e) => setForm((f) => ({ ...f, postingDeadline: e.target.value }))} />
                                    <select className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white text-sm" value={form.disclosureRequirements} onChange={(e) => setForm((f) => ({ ...f, disclosureRequirements: e.target.value }))}>
                                        <option>Ad</option>
                                        <option>Paid partnership</option>
                                        <option>Sponsored</option>
                                        <option>Collaboration</option>
                                    </select>
                                </>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-4 flex justify-between">
                            <button onClick={() => (step > 1 ? setStep((s) => s - 1) : setOpen(false))} className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white">
                                {step === 1 ? 'Cancel' : 'Back'}
                            </button>
                            {step < 3 ? (
                                <button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && (!form.brandOffer || !form.campaignObjective)} className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-40">
                                    Next
                                </button>
                            ) : (
                                <button onClick={handleSend} disabled={sending} className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-40">
                                    {sending ? 'Sending...' : 'Send request'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
