'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';

const INDUSTRIES = [
    'Fashion', 'Beauty', 'Tech', 'Food & Beverage', 'Travel', 'Health & Fitness',
    'Finance', 'Education', 'Gaming', 'Home & Living', 'Automotive', 'Entertainment',
];

const NICHES = [
    'fashion', 'beauty', 'tech', 'food', 'travel', 'fitness',
    'gaming', 'finance', 'education', 'lifestyle', 'business', 'entertainment',
];

const GENDERS = ['female', 'male', 'both'];
const COUNTRIES = ['Pakistan', 'United States', 'United Kingdom', 'Canada', 'United Arab Emirates', 'Saudi Arabia', 'Australia', 'India'];

function unique(values) {
    return [...new Set(values)];
}

function parseList(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
    return [];
}

function parseBudgetRange(value) {
    if (value && typeof value === 'object') {
        return { min: value.min ?? '', max: value.max ?? '' };
    }
    if (typeof value === 'string' && value.includes('-')) {
        const [min, max] = value.split('-').map((part) => part.trim());
        return { min: min || '', max: max || '' };
    }
    return { min: '', max: '' };
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

export default function BrandProfileForm() {
    const { data: profile, refetch } = useApi('/profile/brand/me');
    const [isEditing, setIsEditing] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        businessName: '',
        representerName: '',
        industry: '',
        website: '',
        instagramLink: '',
        linkedinLink: '',
        googleMapLink: '',
        description: '',
        contactEmail: '',
        marketingGoals: '',
        budgetRange: { min: '', max: '' },
        targetAudience: { ageRange: [18, 35], genders: [], countries: [] },
        preferredNiches: [],
    });

    useEffect(() => {
        if (!profile) return;

        setForm({
            businessName: profile.businessName || profile.brandName || '',
            representerName: profile.representerName || profile.brandRepresenterName || '',
            industry: profile.industry || profile.category || '',
            website: profile.website || '',
            instagramLink: profile.instagramLink || '',
            linkedinLink: profile.linkedinLink || '',
            googleMapLink: profile.googleMapLink || '',
            description: profile.description || profile.bio || '',
            contactEmail: profile.contactEmail || profile.contactDetails?.officialEmail || '',
            marketingGoals: profile.marketingGoals || '',
            budgetRange: parseBudgetRange(profile.budgetRange),
            targetAudience: {
                ageRange: Array.isArray(profile.targetAudience?.ageRange) && profile.targetAudience.ageRange.length === 2 ? profile.targetAudience.ageRange : [18, 35],
                genders: parseList(profile.targetAudience?.genders),
                countries: parseList(profile.targetAudience?.countries),
            },
            preferredNiches: parseList(profile.preferredNiches),
        });

        setIsEditing(!profile.profileComplete);
    }, [profile]);

    const profileInitials = useMemo(() => {
        const base = form.businessName || profile?.businessName || profile?.brandName || 'B';
        return String(base).slice(0, 2).toUpperCase();
    }, [form.businessName, profile]);

    function toggleArray(field, value) {
        setForm((current) => ({
            ...current,
            [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value],
        }));
    }

    function toggleNestedArray(field, value) {
        setForm((current) => ({
            ...current,
            targetAudience: {
                ...current.targetAudience,
                [field]: current.targetAudience[field].includes(value)
                    ? current.targetAudience[field].filter((item) => item !== value)
                    : [...current.targetAudience[field], value],
            },
        }));
    }

    function toggleCountry(value) {
        setForm((current) => {
            const selected = current.targetAudience.countries.includes(value);
            if (selected) {
                return {
                    ...current,
                    targetAudience: {
                        ...current.targetAudience,
                        countries: current.targetAudience.countries.filter((item) => item !== value),
                    },
                };
            }

            if (current.targetAudience.countries.length >= 3) {
                return current;
            }

            return {
                ...current,
                targetAudience: {
                    ...current.targetAudience,
                    countries: unique([...current.targetAudience.countries, value]),
                },
            };
        });
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/brand`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessName: form.businessName,
                    representerName: form.representerName,
                    industry: form.industry,
                    website: form.website,
                    instagramLink: form.instagramLink,
                    linkedinLink: form.linkedinLink,
                    googleMapLink: form.googleMapLink,
                    description: form.description,
                    contactEmail: form.contactEmail,
                    marketingGoals: form.marketingGoals,
                    budgetRange: form.budgetRange,
                    targetAudience: form.targetAudience,
                    preferredNiches: form.preferredNiches,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Failed to save brand profile');
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
    const selectClass = `${inputClass} appearance-none pr-10`;
    const sectionCard = 'rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5 md:p-6';
    const summaryBadge = profile?.profileComplete
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
        : 'border-amber-400/20 bg-amber-400/10 text-amber-300';

    const summaryItems = [
        { label: 'Business name', value: form.businessName || '—' },
        { label: 'Representer', value: form.representerName || '—' },
        { label: 'Website', value: form.website || '—' },
        { label: 'Contact email', value: form.contactEmail || '—' },
        { label: 'Industry', value: form.industry || '—' },
    ];

    if (!isEditing && profile?.profileComplete) {
        return (
            <div className="space-y-6" id="brand-profile-form">
                <div className={sectionCard}>
                    <div className="mb-5 flex flex-col gap-3 border-b border-[#2A2A30] pb-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Brand profile</p>
                            <h3 className="mt-1 text-xl font-semibold text-white">Profile Setup</h3>
                            <p className="mt-1 text-sm text-gray-400">View your brand details and click edit if you need to make changes.</p>
                        </div>
                        <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${summaryBadge}`}>
                            {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {summaryItems.map((item) => (
                            <div key={item.label} className="rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{item.label}</p>
                                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Business icon</p>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                                {profileInitials}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{form.businessName || 'Brand profile'}</p>
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
        <div className="space-y-6" id="brand-profile-form">
            <div className={sectionCard}>
                <div className="mb-5 flex flex-col gap-3 border-b border-[#2A2A30] pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Brand profile</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">Profile Setup</h3>
                        <p className="mt-1 text-sm text-gray-400">Keep your brand details, audience, and campaign preferences up to date.</p>
                    </div>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${summaryBadge}`}>
                        {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Business name</label>
                        <input className={inputClass} placeholder="Business name" value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Brand representer name</label>
                        <input className={inputClass} placeholder="Brand representer name" value={form.representerName} onChange={(event) => setForm((current) => ({ ...current, representerName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Website</label>
                        <input className={inputClass} placeholder="Website" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Instagram link</label>
                        <input className={inputClass} placeholder="Instagram link" value={form.instagramLink} onChange={(event) => setForm((current) => ({ ...current, instagramLink: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">LinkedIn link</label>
                        <input className={inputClass} placeholder="LinkedIn link" value={form.linkedinLink} onChange={(event) => setForm((current) => ({ ...current, linkedinLink: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Google map link</label>
                        <input className={inputClass} placeholder="Google map link" value={form.googleMapLink} onChange={(event) => setForm((current) => ({ ...current, googleMapLink: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Contact email</label>
                        <input className={inputClass} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Industry</label>
                        <div className="relative">
                            <select className={selectClass} value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}>
                                <option value="">Select an industry</option>
                                {INDUSTRIES.map((industry) => (
                                    <option key={industry} value={industry.toLowerCase()}>{industry}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">⌄</div>
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Description</label>
                        <textarea className={`${inputClass} min-h-[132px] resize-y`} placeholder="Tell creators what your brand does" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Marketing goals for Porchest</label>
                        <textarea
                            className={`${inputClass} min-h-[132px] resize-y`}
                            maxLength={900}
                            placeholder="Describe your marketing goals in your own words"
                            value={form.marketingGoals}
                            onChange={(event) => setForm((current) => ({ ...current, marketingGoals: event.target.value }))}
                        />
                        <p className="text-xs text-gray-500">Keep this short and focused. Up to 150 words.</p>
                    </div>
                </div>
            </div>

            <div className={sectionCard}>
                <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Audience</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Target audience and preferences</h3>
                </div>

                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Minimum age</label>
                            <input className="w-full accent-blue-500" type="range" min="13" max="65" value={form.targetAudience.ageRange[0]} onChange={(event) => setForm((current) => ({ ...current, targetAudience: { ...current.targetAudience, ageRange: [Number(event.target.value), current.targetAudience.ageRange[1]] } }))} />
                            <p className="text-xs text-gray-400">{form.targetAudience.ageRange[0]} years</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Maximum age</label>
                            <input className="w-full accent-blue-500" type="range" min="13" max="65" value={form.targetAudience.ageRange[1]} onChange={(event) => setForm((current) => ({ ...current, targetAudience: { ...current.targetAudience, ageRange: [current.targetAudience.ageRange[0], Number(event.target.value)] } }))} />
                            <p className="text-xs text-gray-400">{form.targetAudience.ageRange[1]} years</p>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Genders</label>
                        <div className="flex flex-wrap gap-2">
                            {GENDERS.map((gender) => (
                                <button key={gender} type="button" onClick={() => toggleNestedArray('genders', gender)} className={chipClass(form.targetAudience.genders.includes(gender))}>
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                            Countries
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COUNTRIES.map((country) => {
                                const selected = form.targetAudience.countries.includes(country);
                                const disabled = !selected && form.targetAudience.countries.length >= 3;
                                return (
                                    <button
                                        key={country}
                                        type="button"
                                        onClick={() => toggleCountry(country)}
                                        disabled={disabled}
                                        className={`${chipClass(selected)} ${disabled ? 'cursor-not-allowed opacity-40 hover:bg-[#202025]' : ''}`}
                                    >
                                        {country}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-xs text-gray-500">Select up to 3 countries from the list.</p>
                            <p className="text-xs font-semibold text-gray-400">
                                {form.targetAudience.countries.length}/3 selected
                            </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {form.targetAudience.countries.map((country) => (
                                <span key={country} className="inline-flex items-center rounded-full border border-[#2A2A30] bg-[#202025] px-3 py-1 text-xs font-semibold text-gray-300">
                                    {country}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Preferred niches</label>
                        <div className="flex flex-wrap gap-2">
                            {NICHES.map((niche) => (
                                <button key={niche} type="button" onClick={() => toggleArray('preferredNiches', niche)} className={chipClass(form.preferredNiches.includes(niche))}>
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Budget minimum</label>
                            <input className={inputClass} type="number" min="0" placeholder="Budget minimum" value={form.budgetRange.min} onChange={(event) => setForm((current) => ({ ...current, budgetRange: { ...current.budgetRange, min: event.target.value } }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Budget maximum</label>
                            <input className={inputClass} type="number" min="0" placeholder="Budget maximum" value={form.budgetRange.max} onChange={(event) => setForm((current) => ({ ...current, budgetRange: { ...current.budgetRange, max: event.target.value } }))} />
                        </div>
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
