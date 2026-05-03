'use client';

import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';

const INDUSTRIES = [
    'Fashion', 'Beauty', 'Tech', 'Food & Beverage', 'Travel', 'Health & Fitness',
    'Finance', 'Education', 'Gaming', 'Home & Living', 'Automotive', 'Entertainment',
];

const NICHES = [
    'fashion', 'beauty', 'tech', 'food', 'travel', 'fitness',
    'gaming', 'finance', 'education', 'lifestyle', 'business', 'entertainment',
];

const TIERS = ['nano', 'micro', 'macro', 'mega'];
const GENDERS = ['female', 'male', 'non-binary', 'all'];

function unique(values) {
    return [...new Set(values)];
}

function parseList(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string' && value.trim()) return [value.trim()];
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

export default function BrandProfileForm() {
    const { data: profile } = useApi('/profile/brand/me');
    const [form, setForm] = useState({
        businessName: '',
        logo: '',
        industry: '',
        website: '',
        description: '',
        contactEmail: '',
        pixelId: '',
        budgetRange: { min: '', max: '' },
        targetAudience: { ageRange: [18, 35], genders: [], countries: [], interests: [] },
        preferredNiches: [],
        preferredTiers: [],
        usageRightsDefault: false,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [countryInput, setCountryInput] = useState('');
    const [interestInput, setInterestInput] = useState('');

    useEffect(() => {
        if (!profile) return;
        setForm({
            businessName: profile.businessName || profile.brandName || '',
            logo: profile.logo || profile.logoUrl || '',
            industry: profile.industry || profile.category || '',
            website: profile.website || '',
            description: profile.description || profile.bio || '',
            contactEmail: profile.contactEmail || profile.contactDetails?.officialEmail || '',
            pixelId: profile.pixelId || '',
            budgetRange: parseBudgetRange(profile.budgetRange),
            targetAudience: {
                ageRange: Array.isArray(profile.targetAudience?.ageRange) && profile.targetAudience.ageRange.length === 2 ? profile.targetAudience.ageRange : [18, 35],
                genders: parseList(profile.targetAudience?.genders),
                countries: parseList(profile.targetAudience?.countries),
                interests: parseList(profile.targetAudience?.interests),
            },
            preferredNiches: parseList(profile.preferredNiches),
            preferredTiers: parseList(profile.preferredTiers),
            usageRightsDefault: Boolean(profile.usageRightsDefault),
        });
    }, [profile]);

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

    function addToNested(field, rawValue) {
        const value = rawValue.trim();
        if (!value) return;
        setForm((current) => ({
            ...current,
            targetAudience: {
                ...current.targetAudience,
                [field]: unique([...current.targetAudience[field], value]),
            },
        }));
    }

    async function handleLogoFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setForm((current) => ({ ...current, logo: String(reader.result || '') }));
        };
        reader.readAsDataURL(file);
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
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Failed to save brand profile');
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
    const pillClass = 'rounded-full border px-4 py-2 text-xs font-semibold transition-colors';
    const sectionCard = 'rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5 md:p-6';

    return (
        <div className="space-y-6">
            <div className={sectionCard}>
                <div className="mb-5 flex flex-col gap-3 border-b border-[#2A2A30] pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Brand profile</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">Manual profile details</h3>
                        <p className="mt-1 text-sm text-gray-400">These details are visible to creators and help Porchest match your brand with the right influencers.</p>
                    </div>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${profile?.profileComplete ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'}`}>
                        {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2 rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Logo</p>
                                <p className="text-sm text-gray-400">Keep a clear, square version of your brand mark or profile image here.</p>
                            </div>
                            {form.logo && <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Preview ready</span>}
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                            <input className={inputClass} placeholder="Logo URL or data URL" value={form.logo} onChange={(event) => setForm((current) => ({ ...current, logo: event.target.value }))} />
                            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-[#2A2A30] bg-[#1A1A1E] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-[#202025]">
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleLogoFile(event.target.files?.[0])} />
                            </label>
                        </div>
                        {form.logo && (
                            <div className="mt-4 overflow-hidden rounded-xl border border-[#2A2A30] bg-[#0F0F12]">
                                <div className="flex items-center gap-3 border-b border-[#2A2A30] p-3">
                                    <div className="h-11 w-11 overflow-hidden rounded-full border border-[#2A2A30] bg-[#1A1A1E]">
                                        <img src={form.logo} alt="Brand logo preview" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Logo preview</p>
                                        <p className="text-xs text-gray-400">This is what creators will see.</p>
                                    </div>
                                </div>
                                <img src={form.logo} alt="Brand logo preview large" className="h-72 w-full object-contain bg-[#0F0F12]" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Business name</label>
                        <input className={inputClass} placeholder="Business name" value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Website</label>
                        <input className={inputClass} placeholder="Website" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Contact email</label>
                        <input className={inputClass} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Porchest pixel ID</label>
                        <input className={inputClass} placeholder="Porchest pixel ID" value={form.pixelId} onChange={(event) => setForm((current) => ({ ...current, pixelId: event.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
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
                                <button key={gender} type="button" onClick={() => toggleNestedArray('genders', gender)} className={`${pillClass} ${form.targetAudience.genders.includes(gender) ? 'border-blue-500/40 bg-blue-500/15 text-blue-200' : 'border-[#2A2A30] bg-[#202025] text-gray-300 hover:bg-[#2A2A30]'}`}>
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Countries</label>
                        <div className="flex gap-2">
                            <input className={inputClass} placeholder="Add country code or name" value={countryInput} onChange={(event) => setCountryInput(event.target.value)} onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addToNested('countries', countryInput);
                                    setCountryInput('');
                                }
                            }} />
                            <button type="button" onClick={() => { addToNested('countries', countryInput); setCountryInput(''); }} className="rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-[#2A2A30]">
                                Add
                            </button>
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
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Interests</label>
                        <div className="flex gap-2">
                            <input className={inputClass} placeholder="Add interest" value={interestInput} onChange={(event) => setInterestInput(event.target.value)} onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addToNested('interests', interestInput);
                                    setInterestInput('');
                                }
                            }} />
                            <button type="button" onClick={() => { addToNested('interests', interestInput); setInterestInput(''); }} className="rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-[#2A2A30]">
                                Add
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {form.targetAudience.interests.map((interest) => (
                                <span key={interest} className="inline-flex items-center rounded-full border border-[#2A2A30] bg-[#202025] px-3 py-1 text-xs font-semibold text-gray-300">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Preferred niches</label>
                        <div className="flex flex-wrap gap-2">
                            {NICHES.map((niche) => (
                                <button key={niche} type="button" onClick={() => toggleArray('preferredNiches', niche)} className={`${pillClass} ${form.preferredNiches.includes(niche) ? 'border-blue-500/40 bg-blue-500/15 text-blue-200' : 'border-[#2A2A30] bg-[#202025] text-gray-300 hover:bg-[#2A2A30]'}`}>
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Preferred tiers</label>
                        <div className="flex flex-wrap gap-2">
                            {TIERS.map((tier) => (
                                <button key={tier} type="button" onClick={() => toggleArray('preferredTiers', tier)} className={`${pillClass} ${form.preferredTiers.includes(tier) ? 'border-blue-500/40 bg-blue-500/15 text-blue-200' : 'border-[#2A2A30] bg-[#202025] text-gray-300 hover:bg-[#2A2A30]'}`}>
                                    {tier}
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

                    <label className="flex items-center gap-3 rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm text-gray-300">
                        <input type="checkbox" checked={form.usageRightsDefault} onChange={(event) => setForm((current) => ({ ...current, usageRightsDefault: event.target.checked }))} className="h-4 w-4 rounded border-[#2A2A30] bg-[#1A1A1E] text-blue-500 focus:ring-blue-500" />
                        Usage rights included by default
                    </label>
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
