'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';

const NICHES = ['fashion', 'beauty', 'tech', 'food', 'travel', 'fitness', 'gaming', 'finance', 'education', 'lifestyle', 'business', 'entertainment'];
const CONTENT_STYLES = ['aesthetic', 'luxury', 'casual', 'funny', 'professional', 'minimalist', 'bold', 'emotional'];
const LANGUAGES = ['English', 'Urdu', 'Arabic', 'Punjabi', 'Hindi', 'French', 'Spanish', 'German', 'Pashto'];
const COUNTRIES = ['Pakistan', 'United States', 'United Kingdom', 'Canada', 'United Arab Emirates', 'Saudi Arabia', 'Australia', 'India'];
const CITIES = ['Rawalpindi', 'Islamabad', 'Lahore', 'Karachi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

function unique(values) {
    return [...new Set(values)];
}

function parseList(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
    return [];
}

function token() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('porchest_token') || localStorage.getItem('token') || '';
}

function chipClass(selected) {
    return `rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
        selected
            ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
            : 'border-[#2A2A30] bg-[#202025] text-gray-300 hover:bg-[#2A2A30]'
    }`;
}

export default function ProfileForm() {
    const { data: profile, refetch } = useApi('/profile/influencer/me');
    const [isEditing, setIsEditing] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        contactEmail: '',
        country: '',
        city: '',
        niche: [],
        languages: [],
        contentStyleTags: [],
        rates: { storyPrice: '', reelPrice: '', postPrice: '' },
    });

    useEffect(() => {
        if (!profile) return;

        setForm({
            fullName: profile.fullName || '',
            contactEmail: profile.contactEmail || '',
            country: profile.country || profile.countryOfResidence || '',
            city: profile.city || '',
            niche: parseList(profile.niche),
            languages: parseList(profile.languages),
            contentStyleTags: parseList(profile.contentStyleTags),
            rates: {
                storyPrice: profile.rates?.storyPrice ?? profile.avgStoryPrice ?? '',
                reelPrice: profile.rates?.reelPrice ?? profile.avgReelPrice ?? '',
                postPrice: profile.rates?.postPrice ?? profile.avgPostPrice ?? '',
            },
        });

        setIsEditing(!profile.profileComplete);
    }, [profile]);

    const profileImage = useMemo(() => {
        return profile?.igProfileUrl || profile?.profilePictureUrl || '';
    }, [profile]);

    function toggleArray(field, value) {
        setForm((current) => ({
            ...current,
            [field]: current[field].includes(value)
                ? current[field].filter((item) => item !== value)
                : [...current[field], value],
        }));
    }

    function handleMultiSelect(field, event) {
        const values = Array.from(event.target.selectedOptions, (option) => option.value);
        setForm((current) => ({ ...current, [field]: unique(values) }));
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
                body: JSON.stringify({
                    fullName: form.fullName,
                    contactEmail: form.contactEmail,
                    country: form.country,
                    city: form.city,
                    niche: form.niche,
                    languages: form.languages,
                    contentStyleTags: form.contentStyleTags,
                    rates: form.rates,
                }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Failed to save influencer profile');

            await refetch();
            setIsEditing(false);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1800);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    const inputClass = 'w-full rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500';
    const sectionCard = 'rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5 md:p-6';

    const summaryBadge = profile?.profileComplete
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
        : 'border-amber-400/20 bg-amber-400/10 text-amber-300';

    const name = form.fullName || profile?.fullName || 'Your name';
    const handle = profile?.igUsername ? `@${profile.igUsername}` : '@instagram';
    const profileSummary = [
        { label: 'Full name', value: form.fullName || '—' },
        { label: 'Contact email', value: form.contactEmail || '—' },
        { label: 'Country', value: form.country || '—' },
        { label: 'City', value: form.city || '—' },
    ];

    if (!isEditing && profile?.profileComplete) {
        return (
            <div className="space-y-6" id="profile-form">
                <div className={sectionCard}>
                    <div className="mb-5 flex flex-col gap-3 border-b border-[#2A2A30] pb-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Profile setup</p>
                            <h3 className="mt-1 text-xl font-semibold text-white">Profile Setup</h3>
                            <p className="mt-1 text-sm text-gray-400">View your profile details and click edit if you need to make changes.</p>
                        </div>
                        <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${summaryBadge}`}>
                            {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {profileSummary.map((item) => (
                            <div key={item.label} className="rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{item.label}</p>
                                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Instagram DP</p>
                        <div className="mt-3 flex items-center gap-3">
                            {profileImage ? (
                                <img src={profileImage} alt="Instagram profile" className="h-14 w-14 rounded-full object-cover ring-1 ring-[#2A2A30]" />
                            ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">IG</div>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-white">{handle}</p>
                                <p className="text-xs text-gray-400">Used across your Porchest profile.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                            Edit profile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" id="profile-form">
            <div className={sectionCard}>
                <div className="mb-5 flex flex-col gap-3 border-b border-[#2A2A30] pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Profile setup</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">Profile Setup</h3>
                        <p className="mt-1 text-sm text-gray-400">Keep your Instagram details, identity, and collaboration preferences up to date.</p>
                    </div>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${summaryBadge}`}>
                        {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Full name</label>
                        <input className={inputClass} placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Contact email</label>
                        <input className={inputClass} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Country</label>
                        <select className={inputClass} value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}>
                            <option value="">Select country</option>
                            {COUNTRIES.map((country) => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">City</label>
                        <select className={inputClass} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}>
                            <option value="">Select city</option>
                            {CITIES.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className={sectionCard}>
                <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Profile setup</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Niche, languages, and content style</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Niche</label>
                        <div className="flex flex-wrap gap-2">
                            {NICHES.map((niche) => (
                                <button key={niche} type="button" onClick={() => toggleArray('niche', niche)} className={chipClass(form.niche.includes(niche))}>
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Content style</label>
                        <div className="flex flex-wrap gap-2">
                            {CONTENT_STYLES.map((style) => (
                                <button key={style} type="button" onClick={() => toggleArray('contentStyleTags', style)} className={chipClass(form.contentStyleTags.includes(style))}>
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Languages</label>
                        <select
                            multiple
                            className={`${inputClass} min-h-[160px] py-3`}
                            value={form.languages}
                            onChange={(event) => handleMultiSelect('languages', event)}
                        >
                            {LANGUAGES.map((language) => (
                                <option key={language} value={language}>
                                    {language}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-xs text-gray-500">Hold Ctrl or Command to select multiple languages.</p>
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Profile setup</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Collaboration pricing</h3>
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
                <div className="flex gap-3">
                    {profile?.profileComplete ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="rounded-xl border border-[#2A2A30] bg-[#202025] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-[#2A2A30]"
                        >
                            Cancel
                        </button>
                    ) : null}
                    <button onClick={handleSave} disabled={saving} className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}
