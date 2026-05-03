'use client';

import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';

const NICHES = ['fashion', 'beauty', 'tech', 'food', 'travel', 'fitness', 'gaming', 'finance', 'education', 'lifestyle', 'business', 'entertainment'];
const CONTENT_STYLES = ['aesthetic', 'luxury', 'casual', 'funny', 'professional', 'minimalist', 'bold', 'emotional'];

function unique(values) {
    return [...new Set(values)];
}

function parseList(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
}

function token() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('porchest_token') || localStorage.getItem('token') || '';
}

export default function ProfileForm() {
    const { data: profile } = useApi('/profile/influencer/me');
    const [form, setForm] = useState({
        fullName: '',
        displayName: '',
        avatar: '',
        bio: '',
        country: '',
        city: '',
        contactEmail: '',
        phoneNumber: '',
        niche: [],
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
            fullName: profile.fullName || '',
            displayName: profile.displayName || '',
            avatar: profile.avatar || profile.profilePictureUrl || '',
            bio: profile.bio || '',
            country: profile.country || profile.countryOfResidence || '',
            city: profile.city || '',
            contactEmail: profile.contactEmail || '',
            phoneNumber: profile.phoneNumber || '',
            niche: parseList(profile.niche),
            languages: parseList(profile.languages),
            contentStyleTags: parseList(profile.contentStyleTags),
            rates: {
                storyPrice: profile.rates?.storyPrice ?? profile.avgStoryPrice ?? '',
                reelPrice: profile.rates?.reelPrice ?? profile.avgReelPrice ?? '',
                postPrice: profile.rates?.postPrice ?? profile.avgPostPrice ?? '',
            },
        });
    }, [profile]);

    function toggleArray(field, value) {
        setForm((current) => ({
            ...current,
            [field]: current[field].includes(value)
                ? current[field].filter((item) => item !== value)
                : [...current[field], value],
        }));
    }

    function addLanguage() {
        const value = languageInput.trim();
        if (!value) return;
        setForm((current) => ({ ...current, languages: unique([...current.languages, value]) }));
        setLanguageInput('');
    }

    async function handleAvatarFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setForm((current) => ({ ...current, avatar: String(reader.result || '') }));
        };
        reader.readAsDataURL(file);
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/influencer`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Failed to save influencer profile');
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1800);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    const inputClass = 'w-full rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500';
    const pillClass = 'rounded-full border px-4 py-2 text-xs font-semibold transition-colors';
    const sectionCard = 'rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5 md:p-6';

    return (
        <div className="space-y-6">
            <div className={sectionCard}>
                <div className="mb-5 flex flex-col gap-3 border-b border-[#2A2A30] pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Profile setup</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">Manual profile details</h3>
                        <p className="mt-1 text-sm text-gray-400">These details are visible to brands and help us match you with the right collaboration requests.</p>
                    </div>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${profile?.profileComplete ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'}`}>
                        {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2 rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Avatar</p>
                                <p className="text-sm text-gray-400">Use a clear photo or brand image that represents your profile.</p>
                            </div>
                            {form.avatar && (
                                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Preview ready</span>
                            )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                            <input className={inputClass} placeholder="Avatar URL or data URL" value={form.avatar} onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))} />
                            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-[#2A2A30] bg-[#1A1A1E] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-[#202025]">
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
                            </label>
                        </div>
                        {form.avatar && (
                            <div className="mt-4 overflow-hidden rounded-xl border border-[#2A2A30] bg-[#0F0F12]">
                                <div className="flex items-center gap-3 border-b border-[#2A2A30] p-3">
                                    <div className="h-11 w-11 overflow-hidden rounded-full border border-[#2A2A30] bg-[#1A1A1E]">
                                        <img src={form.avatar} alt="Avatar preview" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Avatar preview</p>
                                        <p className="text-xs text-gray-400">This is what brands will see.</p>
                                    </div>
                                </div>
                                <img src={form.avatar} alt="Avatar preview large" className="h-72 w-full object-contain bg-[#0F0F12]" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Full name</label>
                        <input className={inputClass} placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Display name</label>
                        <input className={inputClass} placeholder="Display name" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Contact email</label>
                        <input className={inputClass} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Phone number</label>
                        <input className={inputClass} placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Country</label>
                        <input className={inputClass} placeholder="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">City</label>
                        <input className={inputClass} placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Bio</label>
                        <textarea className={`${inputClass} min-h-[132px] resize-y`} placeholder="Short bio" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
                    </div>
                </div>
            </div>

            <div className={sectionCard}>
                <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Positioning</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Niche, languages, and content style</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Niche</label>
                        <div className="flex flex-wrap gap-2">
                            {NICHES.map((niche) => (
                                <button key={niche} type="button" onClick={() => toggleArray('niche', niche)} className={`${pillClass} ${form.niche.includes(niche) ? 'border-blue-500/40 bg-blue-500/15 text-blue-200' : 'border-[#2A2A30] bg-[#202025] text-gray-300 hover:bg-[#2A2A30]'}`}>
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Content style tags</label>
                        <div className="flex flex-wrap gap-2">
                            {CONTENT_STYLES.map((style) => (
                                <button key={style} type="button" onClick={() => toggleArray('contentStyleTags', style)} className={`${pillClass} ${form.contentStyleTags.includes(style) ? 'border-blue-500/40 bg-blue-500/15 text-blue-200' : 'border-[#2A2A30] bg-[#202025] text-gray-300 hover:bg-[#2A2A30]'}`}>
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Languages</label>
                        <div className="flex gap-2">
                            <input className={inputClass} placeholder="Add language" value={languageInput} onChange={(event) => setLanguageInput(event.target.value)} onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addLanguage();
                                }
                            }} />
                            <button type="button" onClick={addLanguage} className="rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-[#2A2A30]">
                                Add
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {form.languages.map((language) => (
                                <span key={language} className="inline-flex items-center rounded-full border border-[#2A2A30] bg-[#202025] px-3 py-1 text-xs font-semibold text-gray-300">
                                    {language}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={sectionCard}>
                <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Rates</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Set your collaboration pricing</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Story price</label>
                        <input className={inputClass} type="number" min="0" placeholder="Story price" value={form.rates.storyPrice} onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, storyPrice: event.target.value } }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Reel price</label>
                        <input className={inputClass} type="number" min="0" placeholder="Reel price" value={form.rates.reelPrice} onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, reelPrice: event.target.value } }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Post price</label>
                        <input className={inputClass} type="number" min="0" placeholder="Post price" value={form.rates.postPrice} onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, postPrice: event.target.value } }))} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-3">
                {saved && <p className="text-sm font-medium text-emerald-400">Profile saved successfully.</p>}
                <button onClick={handleSave} disabled={saving} className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save profile'}
                </button>
            </div>
        </div>
    );
}
