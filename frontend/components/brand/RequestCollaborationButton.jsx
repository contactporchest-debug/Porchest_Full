'use client';

import { useEffect, useState } from 'react';
import { apiPost } from '../../hooks/useApi';

const CONTENT_TYPES = ['Reel', 'Feed Post', 'Carousel', 'Live', 'Giveaway'];
const OBJECTIVES = ['Awareness', 'Sales', 'App installs', 'Lead generation', 'Engagement'];

const formatMoney = (value) => {
    const amount = Number(value || 0);
    return `$${Number.isFinite(amount) ? amount.toLocaleString() : '0'}`;
};

export default function RequestCollaborationButton({ influencerId, influencerName, rates, autoOpen = false }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
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
        revisionRoundsAllowed: 1,
    });

    function toggle(field, value) {
        setForm((f) => ({ ...f, [field]: f[field].includes(value) ? f[field].filter((x) => x !== value) : [...f[field], value] }));
    }

    const reelRate = Number(rates?.reelPrice || 0);
    const postRate = Number(rates?.postPrice || 0);
    const selectedContentTypes = form.contentType || [];
    const calculatedTotal = selectedContentTypes.reduce((sum, item) => {
        const normalized = String(item).toLowerCase();
        if (normalized.includes('reel')) return sum + reelRate;
        if (normalized.includes('post') || normalized.includes('feed')) return sum + postRate;
        return sum;
    }, 0);

    useEffect(() => {
        if (autoOpen) setOpen(true);
    }, [autoOpen]);

    async function handleSend() {
        setSending(true);
        setError('');
        await apiPost('/collaborations', {
            influencerId,
            brief: {
                ...form,
                hashtags: form.hashtags.split(' ').filter(Boolean),
                revisionRoundsAllowed: Number(form.revisionRoundsAllowed || 1),
                contentType: form.contentType,
                contentTypes: form.contentType,
            },
            selectedContentTypes: form.contentType,
            pricing: { brandOffer: Number(calculatedTotal || 0), agreedFee: Number(calculatedTotal || 0) },
        }).then((response) => {
            if (!response || response.success === false || response.error || !response._id) {
                throw new Error(response?.error || response?.message || 'Failed to create collaboration request');
            }
            setSent(true);
            window.dispatchEvent(new Event('porchest-collaboration-updated'));
            window.dispatchEvent(new CustomEvent('porchest-collaboration-created', { detail: response }));
            setTimeout(() => {
                setSent(false);
                setOpen(false);
                setStep(1);
            }, 1800);
        }).catch((err) => {
            setError(err?.message || 'Failed to create collaboration request');
        }).finally(() => {
            setSending(false);
        });
    }

    const IS = {
        width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC',
        color: '#1A0A00', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit'
    };

    return (
        <>
            <button onClick={() => setOpen(true)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: '#C2340A', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => e.currentTarget.style.background = '#E8400A'} onMouseLeave={e => e.currentTarget.style.background = '#C2340A'}>
                Request collaboration with {influencerName || 'creator'}
            </button>

            {sent && <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.45)', border: '1px solid #EDD9BC', color: '#1A0A00', textAlign: 'center', fontSize: '14px', fontWeight: 700, backdropFilter: 'blur(12px)' }}>Collaboration request sent.</div>}
            {error && <div style={{ marginTop: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>{error}</div>}

            {open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(26,10,0,0.5)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', background: '#FDF6EE', border: '1px solid #EDD9BC', boxShadow: '0 16px 40px rgba(26,10,0,0.1)' }}>
                        <div style={{ position: 'sticky', top: 0, background: 'rgba(253,246,238,0.95)', borderBottom: '1px solid #EDD9BC', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, backdropFilter: 'blur(8px)' }}>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: '18px', color: '#1A0A00' }}>Request collaboration</p>
                                <p style={{ fontSize: '12px', color: '#7A5030', fontWeight: 500, marginTop: '2px' }}>{influencerName || 'Creator'} - Step {step} of 3</p>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ color: '#C4A882', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }} onMouseEnter={e => { e.currentTarget.style.color = '#1A0A00'; e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }} onMouseLeave={e => { e.currentTarget.style.color = '#C4A882'; e.currentTarget.style.background = 'transparent' }}>x</button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {step === 1 && (
                                <>
                                    {rates && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#C4A882' }}>Reel {rates.reelPrice ? formatMoney(rates.reelPrice) : '—'}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#C4A882' }}>Post {rates.postPrice ? formatMoney(rates.postPrice) : '—'}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {['Reel', 'Post'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggle('contentType', type)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    border: `1px solid ${form.contentType.includes(type) ? '#C2340A' : '#EDD9BC'}`,
                                                    background: form.contentType.includes(type) ? 'rgba(194,52,10,0.1)' : 'rgba(255,255,255,0.6)',
                                                    color: form.contentType.includes(type) ? '#C2340A' : '#7A5030',
                                                    transition: 'all 0.15s',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit',
                                                }}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calculated total</p>
                                        <p style={{ marginTop: '4px', fontSize: '22px', fontWeight: 800, color: '#1A0A00' }}>{formatMoney(calculatedTotal)}</p>
                                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#7A5030' }}>Automatically calculated from the influencer’s declared fixed rates.</p>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {OBJECTIVES.map((objective) => (
                                            <button key={objective} type="button" onClick={() => setForm((f) => ({ ...f, campaignObjective: objective }))} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: `1px solid ${form.campaignObjective === objective ? '#C2340A' : '#EDD9BC'}`, background: form.campaignObjective === objective ? 'rgba(194,52,10,0.1)' : 'rgba(255,255,255,0.6)', color: form.campaignObjective === objective ? '#C2340A' : '#7A5030', transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => { if (form.campaignObjective !== objective) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1A0A00'; } }} onMouseLeave={e => { if (form.campaignObjective !== objective) { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#7A5030'; } }}>
                                                {objective}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {CONTENT_TYPES.map((type) => (
                                            <button key={type} type="button" onClick={() => toggle('contentType', type)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: `1px solid ${form.contentType.includes(type) ? '#C2340A' : '#EDD9BC'}`, background: form.contentType.includes(type) ? 'rgba(194,52,10,0.1)' : 'rgba(255,255,255,0.6)', color: form.contentType.includes(type) ? '#C2340A' : '#7A5030', transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => { if (!form.contentType.includes(type)) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1A0A00'; } }} onMouseLeave={e => { if (!form.contentType.includes(type)) { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#7A5030'; } }}>
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
                                <textarea key={key} rows={2} style={{ ...IS, resize: 'vertical' }} placeholder={label} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
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
                                        <textarea key={key} rows={2} style={{ ...IS, resize: 'vertical' }} placeholder={label} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                                    ))}
                                    {form.hashtags ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {form.hashtags.split(' ').filter(Boolean).map((tag) => (
                                                <span key={tag} style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', color: '#1A0A00', fontSize: '12px', fontWeight: 700 }}>
                                                    #{tag.replace(/^#/, '')}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                    <input type="date" style={IS} value={form.postingDeadline} onChange={(e) => setForm((f) => ({ ...f, postingDeadline: e.target.value }))} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                                    <select style={{ ...IS, cursor: 'pointer' }} value={form.disclosureRequirements} onChange={(e) => setForm((f) => ({ ...f, disclosureRequirements: e.target.value }))} onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}>
                                        <option>Ad</option>
                                        <option>Paid partnership</option>
                                        <option>Sponsored</option>
                                        <option>Collaboration</option>
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        style={IS}
                                        placeholder="Revision rounds allowed"
                                        value={form.revisionRoundsAllowed}
                                        onChange={(e) => setForm((f) => ({ ...f, revisionRoundsAllowed: e.target.value }))}
                                        onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}
                                    />
                                </>
                            )}
                        </div>

                        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(253,246,238,0.95)', borderTop: '1px solid #EDD9BC', padding: '16px', display: 'flex', justifyContent: 'space-between', backdropFilter: 'blur(8px)' }}>
                            <button onClick={() => (step > 1 ? setStep((s) => s - 1) : setOpen(false))} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', color: '#7A5030', fontSize: '14px', fontWeight: 700, transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1A0A00'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#7A5030'; }}>
                                {step === 1 ? 'Cancel' : 'Back'}
                            </button>
                            {step < 3 ? (
                                <button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && (!form.contentType.length || !form.campaignObjective)} style={{ padding: '10px 24px', borderRadius: '12px', background: '#C2340A', color: '#fff', fontSize: '14px', fontWeight: 700, transition: 'all 0.15s', border: 'none', cursor: (step === 1 && (!form.contentType.length || !form.campaignObjective)) ? 'not-allowed' : 'pointer', opacity: (step === 1 && (!form.contentType.length || !form.campaignObjective)) ? 0.5 : 1, fontFamily: 'inherit' }} onMouseEnter={e => { if (!(step === 1 && (!form.contentType.length || !form.campaignObjective))) e.currentTarget.style.background = '#E8400A' }} onMouseLeave={e => { if (!(step === 1 && (!form.contentType.length || !form.campaignObjective))) e.currentTarget.style.background = '#C2340A' }}>
                                    Next
                                </button>
                            ) : (
                                <button onClick={handleSend} disabled={sending} style={{ padding: '10px 24px', borderRadius: '12px', background: '#C2340A', color: '#fff', fontSize: '14px', fontWeight: 700, transition: 'all 0.15s', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.5 : 1, fontFamily: 'inherit' }} onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#E8400A' }} onMouseLeave={e => { if (!sending) e.currentTarget.style.background = '#C2340A' }}>
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
