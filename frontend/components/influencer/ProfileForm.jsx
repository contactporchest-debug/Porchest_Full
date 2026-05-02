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
    const { data: profile, loading } = useApi('/profile/influencer/me');
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
            if (!res.ok) {
                throw new Error(data?.message || 'Failed to save influencer profile');
            }
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1800);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    const inputClass = 'w-full rounded-2xl border border-white/15 bg-[#121212] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 shadow-inner shadow-black/20 focus:border-[#c79b6a]/60 focus:ring-1 focus:ring-[#c79b6a]/25 focus:bg-[#171717]';
    const pillClass = 'rounded-full border px-4 py-2 text-xs font-semibold transition-colors';

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Influencer profile</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">Manual profile details</h3>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${profile?.profileComplete ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>
                        {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Avatar</label>
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                            <input
                                className={inputClass}
                                placeholder="Avatar URL or data URL"
                                value={form.avatar}
                                onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))}
                            />
                            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                                Upload
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => handleAvatarFile(event.target.files?.[0])}
                                />
                            </label>
                        </div>
                        {form.avatar && (
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                <img src={form.avatar} alt="Avatar preview" className="h-14 w-14 rounded-xl object-cover" />
                                <p className="text-sm text-white/55">Preview of the avatar you will save with your profile.</p>
                            </div>
                        )}
                    </div>

                    <input className={inputClass} placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
                    <input className={inputClass} placeholder="Display name" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
                    <input className={inputClass} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
                    <input className={inputClass} placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
                    <input className={inputClass} placeholder="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
                    <input className={inputClass} placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                    <textarea
                        className={`${inputClass} min-h-[124px] md:col-span-2`}
                        placeholder="Short bio"
                        value={form.bio}
                        onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                    />
                </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
                <div className="mb-5">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Positioning</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Niche, languages, and content style</h3>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Niche</label>
                        <div className="flex flex-wrap gap-2">
                            {NICHES.map((niche) => (
                                <button
                                    key={niche}
                                    type="button"
                                    onClick={() => toggleArray('niche', niche)}
                                    className={`${pillClass} ${form.niche.includes(niche) ? 'border-[#c79b6a]/40 bg-[#c79b6a]/15 text-[#f0d6bf]' : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white'}`}
                                >
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Content style tags</label>
                        <div className="flex flex-wrap gap-2">
                            {CONTENT_STYLES.map((style) => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => toggleArray('contentStyleTags', style)}
                                    className={`${pillClass} ${form.contentStyleTags.includes(style) ? 'border-[#c79b6a]/40 bg-[#c79b6a]/15 text-[#f0d6bf]' : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Languages</label>
                        <div className="flex gap-2">
                            <input
                                className={inputClass}
                                placeholder="Add language"
                                value={languageInput}
                                onChange={(event) => setLanguageInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        addLanguage();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={addLanguage}
                                className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
                            >
                                Add
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {form.languages.map((language) => (
                                <span key={language} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70">
                                    {language}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
                <div className="mb-5">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Rates</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Set your collaboration pricing</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <input
                        type="number"
                        className={inputClass}
                        placeholder="Story price"
                        value={form.rates.storyPrice}
                        onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, storyPrice: event.target.value } }))}
                    />
                    <input
                        type="number"
                        className={inputClass}
                        placeholder="Reel price"
                        value={form.rates.reelPrice}
                        onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, reelPrice: event.target.value } }))}
                    />
                    <input
                        type="number"
                        className={inputClass}
                        placeholder="Post price"
                        value={form.rates.postPrice}
                        onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, postPrice: event.target.value } }))}
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#8f6a45] to-[#c79b6a] px-5 py-4 text-sm font-semibold text-white transition-shadow hover:shadow-[0_18px_36px_rgba(199,155,106,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save profile'}
            </button>
        </div>
    );
}
