'use client';

import { useEffect, useState } from 'react';
import { useApi, apiPut } from '../../hooks/useApi';

const NICHES = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Finance', 'Education', 'Lifestyle', 'Music', 'Art'];
const STYLES = ['Casual', 'Luxury', 'Funny', 'Professional', 'Emotional', 'Minimalist', 'Bold', 'Aesthetic'];

export default function ProfileForm() {
    const { data: profile } = useApi('/profile/influencer/me');
    const [form, setForm] = useState({
        displayName: '',
        bio: '',
        niche: [],
        country: '',
        city: '',
        contactEmail: '',
        languages: [],
        contentStyleTags: [],
        rates: { storyPrice: '', reelPrice: '', postPrice: '' },
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [languageInput, setLanguageInput] = useState('');

    useEffect(() => {
        if (!profile) return;
        setForm({
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            niche: profile.niche || [],
            country: profile.country || '',
            city: profile.city || '',
            contactEmail: profile.contactEmail || '',
            languages: profile.languages || [],
            contentStyleTags: profile.contentStyleTags || [],
            rates: {
                storyPrice: profile.rates?.storyPrice || '',
                reelPrice: profile.rates?.reelPrice || profile.avgReelPrice || '',
                postPrice: profile.rates?.postPrice || profile.avgPostPrice || '',
            },
        });
    }, [profile]);

    function toggleArray(field, value) {
        setForm((f) => ({
            ...f,
            [field]: f[field].includes(value) ? f[field].filter((x) => x !== value) : [...f[field], value],
        }));
    }

    function addLanguage() {
        const value = languageInput.trim();
        if (!value) return;
        setForm((f) => ({ ...f, languages: [...new Set([...f.languages, value])] }));
        setLanguageInput('');
    }

    async function handleSave() {
        setSaving(true);
        await apiPut('/profile/influencer', form);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
    }

    const inputClass = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-stone-500/10';

    return (
        <div className="space-y-6">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-sm font-medium text-white">Manual profile details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className={inputClass} placeholder="Display name" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
                    <input className={inputClass} placeholder="Contact email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
                    <input className={inputClass} placeholder="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                    <input className={inputClass} placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-sm font-medium text-white">Niche</h3>
                <div className="flex flex-wrap gap-2">
                    {NICHES.map((n) => {
                        const value = n.toLowerCase();
                        return (
                            <button key={n} type="button" onClick={() => toggleArray('niche', value)} className={`px-3 py-1.5 rounded-full text-xs border transition-all ${form.niche.includes(value) ? 'bg-stone-700 border-stone-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-stone-500/10'}`}>
                                {n}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-sm font-medium text-white">Content style</h3>
                <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => {
                        const value = s.toLowerCase();
                        return (
                            <button key={s} type="button" onClick={() => toggleArray('contentStyleTags', value)} className={`px-3 py-1.5 rounded-full text-xs border transition-all ${form.contentStyleTags.includes(value) ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-teal-500/50'}`}>
                                {s}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-sm font-medium text-white">Languages and rates</h3>
                <div className="flex gap-2">
                    <input className={inputClass} placeholder="Add language" value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLanguage()} />
                    <button type="button" onClick={addLanguage} className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {form.languages.map((lang) => (
                        <span key={lang} className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs">{lang}</span>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        ['Story', 'storyPrice'],
                        ['Reel', 'reelPrice'],
                        ['Feed post', 'postPrice'],
                    ].map(([label, key]) => (
                        <input key={key} type="number" className={inputClass} placeholder={`${label} price`} value={form.rates[key]} onChange={(e) => setForm((f) => ({ ...f, rates: { ...f.rates, [key]: e.target.value } }))} />
                    ))}
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-stone-700 hover:bg-stone-500 text-white font-medium text-sm transition-all disabled:opacity-40">
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save profile'}
            </button>
        </div>
    );
}
