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

    const inputClass = 'w-full rounded-2xl border border-[#e5dccf] bg-white px-4 py-3 text-sm text-[#2a241c] outline-none transition placeholder:text-[#a1927e] shadow-sm focus:border-[#c79b6a]/70 focus:ring-2 focus:ring-[#c79b6a]/15';
    const selectClass = `${inputClass} appearance-none pr-10`;
    const pillClass = 'rounded-full border px-4 py-2 text-xs font-semibold transition-colors';
    const sectionCard = 'rounded-[28px] border border-[#e9e1d4] bg-[#fbf8f1] p-5 md:p-6 shadow-[0_18px_48px_rgba(0,0,0,0.10)]';

    return (
        <div className="space-y-6">
            <div className={sectionCard}>
                <div className="mb-5 flex flex-col gap-3 border-b border-[#ece3d6] pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7d64]">Profile setup</p>
                        <h3 className="mt-1 text-xl font-semibold text-[#241d15]">Manual profile details</h3>
                        <p className="mt-1 text-sm text-[#7f6f5a]">
                            These details are visible to brands and help us match you with the right collaboration requests.
                        </p>
                    </div>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${profile?.profileComplete ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-700' : 'border-amber-400/30 bg-amber-400/10 text-amber-700'}`}>
                        {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2 rounded-[24px] border border-[#ece3d6] bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8a73]">Avatar</p>
                                <p className="text-sm text-[#7b6a55]">Use a clear photo or brand image that represents your profile.</p>
                            </div>
                            {form.avatar && (
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                    Preview ready
                                </span>
                            )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                            <input
                                className={inputClass}
                                placeholder="Avatar URL or data URL"
                                value={form.avatar}
                                onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))}
                            />
                            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-[#e5dccf] bg-[#fffaf4] px-4 py-3 text-sm font-semibold text-[#6f5a42] transition hover:bg-[#f7f0e6]">
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
                            <div className="mt-4 overflow-hidden rounded-[24px] border border-[#ece3d6] bg-[#fdfaf5]">
                                <div className="flex items-center gap-3 border-b border-[#ece3d6] p-3">
                                    <div className="h-11 w-11 overflow-hidden rounded-full border border-[#e8ddcd] bg-white">
                                        <img src={form.avatar} alt="Avatar preview" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#241d15]">Avatar preview</p>
                                        <p className="text-xs text-[#7f6f5a]">This is what brands will see.</p>
                                    </div>
                                </div>
                                <img src={form.avatar} alt="Avatar preview large" className="h-72 w-full object-contain bg-[#f4f0ea]" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Full name</label>
                        <input className={inputClass} placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Display name</label>
                        <input className={inputClass} placeholder="Display name" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Contact email</label>
                        <input className={inputClass} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Phone number</label>
                        <input className={inputClass} placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Country</label>
                        <input className={inputClass} placeholder="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">City</label>
                        <input className={inputClass} placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Bio</label>
                        <textarea
                            className={`${inputClass} min-h-[132px] resize-y`}
                            placeholder="Short bio"
                            value={form.bio}
                            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                        />
                    </div>
                </div>
            </div>

            <div className={sectionCard}>
                <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7d64]">Positioning</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#241d15]">Niche, languages, and content style</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Niche</label>
                        <div className="flex flex-wrap gap-2">
                            {NICHES.map((niche) => (
                                <button
                                    key={niche}
                                    type="button"
                                    onClick={() => toggleArray('niche', niche)}
                                    className={`${pillClass} ${form.niche.includes(niche) ? 'border-[#c79b6a]/40 bg-[#c79b6a]/15 text-[#6b4d2f]' : 'border-[#e5dccf] bg-white text-[#6c5f4f] hover:bg-[#faf6ef]'}`}
                                >
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Content style tags</label>
                        <div className="flex flex-wrap gap-2">
                            {CONTENT_STYLES.map((style) => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => toggleArray('contentStyleTags', style)}
                                    className={`${pillClass} ${form.contentStyleTags.includes(style) ? 'border-[#c79b6a]/40 bg-[#c79b6a]/15 text-[#6b4d2f]' : 'border-[#e5dccf] bg-white text-[#6c5f4f] hover:bg-[#faf6ef]'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Languages</label>
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
                                className="rounded-2xl border border-[#e5dccf] bg-white px-4 py-3 text-sm font-semibold text-[#6f5a42] transition hover:bg-[#faf6ef]"
                            >
                                Add
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {form.languages.map((language) => (
                                <span key={language} className="rounded-full border border-[#e5dccf] bg-white px-3 py-1 text-xs font-semibold text-[#6f5a42]">
                                    {language}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={sectionCard}>
                <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7d64]">Rates</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#241d15]">Set your collaboration pricing</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Story price</label>
                        <input
                            type="number"
                            className={inputClass}
                            placeholder="Story price"
                            value={form.rates.storyPrice}
                            onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, storyPrice: event.target.value } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Reel price</label>
                        <input
                            type="number"
                            className={inputClass}
                            placeholder="Reel price"
                            value={form.rates.reelPrice}
                            onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, reelPrice: event.target.value } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Post price</label>
                        <input
                            type="number"
                            className={inputClass}
                            placeholder="Post price"
                            value={form.rates.postPrice}
                            onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, postPrice: event.target.value } }))}
                        />
                    </div>
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
