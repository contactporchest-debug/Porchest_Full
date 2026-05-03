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
        return {
            min: value.min ?? '',
            max: value.max ?? '',
        };
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
    const { data: profile, loading } = useApi('/profile/brand/me');
    const [form, setForm] = useState({
        businessName: '',
        logo: '',
        industry: '',
        website: '',
        description: '',
        contactEmail: '',
        pixelId: '',
        budgetRange: { min: '', max: '' },
        targetAudience: {
            ageRange: [18, 35],
            genders: [],
            countries: [],
            interests: [],
        },
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
                ageRange: Array.isArray(profile.targetAudience?.ageRange) && profile.targetAudience.ageRange.length === 2
                    ? profile.targetAudience.ageRange
                    : [18, 35],
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
            [field]: current[field].includes(value)
                ? current[field].filter((item) => item !== value)
                : [...current[field], value],
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
            if (!res.ok) {
                throw new Error(data?.message || 'Failed to save brand profile');
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
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7d64]">Brand profile</p>
                        <h3 className="mt-1 text-xl font-semibold text-[#241d15]">Manual profile details</h3>
                        <p className="mt-1 text-sm text-[#7f6f5a]">
                            These details are visible to creators and help Porchest match your brand with the right influencers.
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
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8a73]">Logo</p>
                                <p className="text-sm text-[#7b6a55]">Keep a clear, square version of your brand mark or profile image here.</p>
                            </div>
                            {form.logo && (
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                    Preview ready
                                </span>
                            )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                            <input
                                className={inputClass}
                                placeholder="Logo URL or data URL"
                                value={form.logo}
                                onChange={(event) => setForm((current) => ({ ...current, logo: event.target.value }))}
                            />
                            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-[#e5dccf] bg-[#fffaf4] px-4 py-3 text-sm font-semibold text-[#6f5a42] transition hover:bg-[#f7f0e6]">
                                Upload
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => handleLogoFile(event.target.files?.[0])}
                                />
                            </label>
                        </div>
                        {form.logo && (
                            <div className="mt-4 overflow-hidden rounded-[24px] border border-[#ece3d6] bg-[#fdfaf5]">
                                <div className="flex items-center gap-3 border-b border-[#ece3d6] p-3">
                                    <div className="h-11 w-11 overflow-hidden rounded-full border border-[#e8ddcd] bg-white">
                                        <img src={form.logo} alt="Brand logo preview" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#241d15]">Logo preview</p>
                                        <p className="text-xs text-[#7f6f5a]">This is what creators will see.</p>
                                    </div>
                                </div>
                                <img src={form.logo} alt="Brand logo preview large" className="h-72 w-full object-contain bg-[#f4f0ea]" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Business name</label>
                        <input className={inputClass} placeholder="Business name" value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Website</label>
                        <input className={inputClass} placeholder="Website" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Contact email</label>
                        <input className={inputClass} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Porchest pixel ID</label>
                        <input className={inputClass} placeholder="Porchest pixel ID" value={form.pixelId} onChange={(event) => setForm((current) => ({ ...current, pixelId: event.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Industry</label>
                        <div className="relative">
                            <select className={selectClass} value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}>
                                <option value="">Select an industry</option>
                                {INDUSTRIES.map((industry) => (
                                    <option key={industry} value={industry.toLowerCase()}>{industry}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#8a7b67]">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Description</label>
                        <textarea
                            className={`${inputClass} min-h-[132px] resize-y`}
                            placeholder="Short description of your business"
                            value={form.description}
                            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        />
                    </div>
                </div>
            </div>

            <div className={sectionCard}>
                <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7d64]">Target audience</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#241d15]">Define the audience you want to reach</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Age range</label>
                            <span className="text-sm text-[#7f6f5a]">{form.targetAudience.ageRange[0]} - {form.targetAudience.ageRange[1]}</span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <input
                                    type="range"
                                    min="13"
                                    max={form.targetAudience.ageRange[1]}
                                    value={form.targetAudience.ageRange[0]}
                                    onChange={(event) => {
                                        const value = Number(event.target.value);
                                        setForm((current) => ({
                                            ...current,
                                            targetAudience: {
                                                ...current.targetAudience,
                                                ageRange: [value, current.targetAudience.ageRange[1]],
                                            },
                                        }));
                                    }}
                                    className="w-full accent-[#c79b6a]"
                                />
                                <p className="mt-1 text-xs text-[#988976]">Minimum age</p>
                            </div>
                            <div>
                                <input
                                    type="range"
                                    min={form.targetAudience.ageRange[0]}
                                    max="70"
                                    value={form.targetAudience.ageRange[1]}
                                    onChange={(event) => {
                                        const value = Number(event.target.value);
                                        setForm((current) => ({
                                            ...current,
                                            targetAudience: {
                                                ...current.targetAudience,
                                                ageRange: [current.targetAudience.ageRange[0], value],
                                            },
                                        }));
                                    }}
                                    className="w-full accent-[#c79b6a]"
                                />
                                <p className="mt-1 text-xs text-[#988976]">Maximum age</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Genders</label>
                        <div className="flex flex-wrap gap-2">
                            {GENDERS.map((gender) => (
                                <button
                                    key={gender}
                                    type="button"
                                    onClick={() => toggleNestedArray('genders', gender)}
                                    className={`${pillClass} ${form.targetAudience.genders.includes(gender) ? 'border-[#c79b6a]/40 bg-[#c79b6a]/15 text-[#6b4d2f]' : 'border-[#e5dccf] bg-white text-[#6c5f4f] hover:bg-[#faf6ef]'}`}
                                >
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[22px] border border-[#ece3d6] bg-white p-4">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Countries</label>
                            <div className="flex gap-2">
                                <input
                                    className={inputClass}
                                    placeholder="Add country code or name"
                                    value={countryInput}
                                    onChange={(event) => setCountryInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            addToNested('countries', countryInput);
                                            setCountryInput('');
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        addToNested('countries', countryInput);
                                        setCountryInput('');
                                    }}
                                    className="rounded-2xl border border-[#e5dccf] bg-white px-4 py-3 text-sm font-semibold text-[#6f5a42] transition hover:bg-[#faf6ef]"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {form.targetAudience.countries.map((country) => (
                                    <span key={country} className="rounded-full border border-[#e5dccf] bg-white px-3 py-1 text-xs font-semibold text-[#6f5a42]">
                                        {country}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[22px] border border-[#ece3d6] bg-white p-4">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Interests</label>
                            <div className="flex gap-2">
                                <input
                                    className={inputClass}
                                    placeholder="Add interest"
                                    value={interestInput}
                                    onChange={(event) => setInterestInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            addToNested('interests', interestInput);
                                            setInterestInput('');
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        addToNested('interests', interestInput);
                                        setInterestInput('');
                                    }}
                                    className="rounded-2xl border border-[#e5dccf] bg-white px-4 py-3 text-sm font-semibold text-[#6f5a42] transition hover:bg-[#faf6ef]"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {form.targetAudience.interests.map((interest) => (
                                    <span key={interest} className="rounded-full border border-[#e5dccf] bg-white px-3 py-1 text-xs font-semibold text-[#6f5a42]">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={sectionCard}>
                <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7d64]">Campaign preferences</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#241d15]">Match preferences and budget</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Preferred niches</label>
                        <div className="flex flex-wrap gap-2">
                            {NICHES.map((niche) => (
                                <button
                                    key={niche}
                                    type="button"
                                    onClick={() => toggleArray('preferredNiches', niche)}
                                    className={`${pillClass} ${form.preferredNiches.includes(niche) ? 'border-[#c79b6a]/40 bg-[#c79b6a]/15 text-[#6b4d2f]' : 'border-[#e5dccf] bg-white text-[#6c5f4f] hover:bg-[#faf6ef]'}`}
                                >
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Preferred tiers</label>
                        <div className="flex flex-wrap gap-2">
                            {TIERS.map((tier) => (
                                <button
                                    key={tier}
                                    type="button"
                                    onClick={() => toggleArray('preferredTiers', tier)}
                                    className={`${pillClass} ${form.preferredTiers.includes(tier) ? 'border-[#c79b6a]/40 bg-[#c79b6a]/15 text-[#6b4d2f]' : 'border-[#e5dccf] bg-white text-[#6c5f4f] hover:bg-[#faf6ef]'}`}
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Budget minimum</label>
                            <input
                                type="number"
                                className={inputClass}
                                placeholder="Budget minimum"
                                value={form.budgetRange.min}
                                onChange={(event) => setForm((current) => ({ ...current, budgetRange: { ...current.budgetRange, min: event.target.value } }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e7d64]">Budget maximum</label>
                            <input
                                type="number"
                                className={inputClass}
                                placeholder="Budget maximum"
                                value={form.budgetRange.max}
                                onChange={(event) => setForm((current) => ({ ...current, budgetRange: { ...current.budgetRange, max: event.target.value } }))}
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-[22px] border border-[#ece3d6] bg-white px-4 py-3 text-sm text-[#4a3c2a]">
                        <input
                            type="checkbox"
                            checked={form.usageRightsDefault}
                            onChange={(event) => setForm((current) => ({ ...current, usageRightsDefault: event.target.checked }))}
                            className="h-4 w-4 accent-[#c79b6a]"
                        />
                        Usage rights included by default
                    </label>
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
