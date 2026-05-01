'use client';

import { useEffect, useState } from 'react';
import { useApi, apiPut } from '../../hooks/useApi';
import InstagramConnect from '../shared/InstagramConnect';

const INDUSTRIES = ['Fashion', 'Beauty', 'Tech', 'Food & Beverage', 'Travel', 'Health & Fitness', 'Finance', 'Education', 'Gaming', 'Home & Living', 'Automotive', 'Entertainment'];

export default function BrandProfileForm() {
    const { data: profile } = useApi('/profile/brand/me');
    const [form, setForm] = useState({
        businessName: '',
        industry: '',
        website: '',
        description: '',
        budgetRange: { min: '', max: '' },
        targetAudience: { ageRange: [18, 35], genders: [], countries: [] },
    });
    const [countryInput, setCountryInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!profile) return;
        setForm({
            businessName: profile.businessName || profile.brandName || '',
            industry: profile.industry || '',
            website: profile.website || '',
            description: profile.description || profile.bio || '',
            budgetRange: { min: profile.budgetRange?.min || '', max: profile.budgetRange?.max || '' },
            targetAudience: {
                ageRange: profile.targetAudience?.ageRange || [18, 35],
                genders: profile.targetAudience?.genders || [],
                countries: profile.targetAudience?.countries || [],
            },
        });
    }, [profile]);

    function toggleGender(gender) {
        setForm((f) => ({
            ...f,
            targetAudience: {
                ...f.targetAudience,
                genders: f.targetAudience.genders.includes(gender)
                    ? f.targetAudience.genders.filter((g) => g !== gender)
                    : [...f.targetAudience.genders, gender],
            },
        }));
    }

    function addCountry() {
        const value = countryInput.trim().toUpperCase();
        if (!value) return;
        setForm((f) => ({ ...f, targetAudience: { ...f.targetAudience, countries: [...new Set([...f.targetAudience.countries, value])] } }));
        setCountryInput('');
    }

    async function handleSave() {
        setSaving(true);
        await apiPut('/profile/brand', form);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
    }

    const inputClass = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-stone-500/10';

    return (
        <div className="space-y-6">
            <InstagramConnect role="brand" />

            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-sm font-medium text-white">Business information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className={inputClass} placeholder="Business name" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
                    <input className={inputClass} placeholder="Website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                </div>
                <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((industry) => {
                        const value = industry.toLowerCase();
                        return (
                            <button key={industry} type="button" onClick={() => setForm((f) => ({ ...f, industry: value }))} className={`px-3 py-1.5 rounded-full text-xs border transition-all ${form.industry === value ? 'bg-stone-700 border-stone-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-stone-500/10'}`}>
                                {industry}
                            </button>
                        );
                    })}
                </div>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Business description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-sm font-medium text-white">Budget and target audience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" className={inputClass} placeholder="Min budget" value={form.budgetRange.min} onChange={(e) => setForm((f) => ({ ...f, budgetRange: { ...f.budgetRange, min: e.target.value } }))} />
                    <input type="number" className={inputClass} placeholder="Max budget" value={form.budgetRange.max} onChange={(e) => setForm((f) => ({ ...f, budgetRange: { ...f.budgetRange, max: e.target.value } }))} />
                </div>
                <div className="flex gap-2">
                    {['male', 'female', 'all'].map((gender) => (
                        <button key={gender} type="button" onClick={() => toggleGender(gender)} className={`px-4 py-2 rounded-lg text-sm border capitalize ${form.targetAudience.genders.includes(gender) ? 'bg-stone-700 border-stone-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                            {gender}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" min="13" max="65" className={inputClass} placeholder="Min age" value={form.targetAudience.ageRange[0]} onChange={(e) => {
                        const range = [...form.targetAudience.ageRange];
                        range[0] = Number(e.target.value);
                        setForm((f) => ({ ...f, targetAudience: { ...f.targetAudience, ageRange: range } }));
                    }} />
                    <input type="number" min="13" max="65" className={inputClass} placeholder="Max age" value={form.targetAudience.ageRange[1]} onChange={(e) => {
                        const range = [...form.targetAudience.ageRange];
                        range[1] = Number(e.target.value);
                        setForm((f) => ({ ...f, targetAudience: { ...f.targetAudience, ageRange: range } }));
                    }} />
                </div>
                <div className="flex gap-2">
                    <input className={inputClass} placeholder="Country code, e.g. PK" value={countryInput} onChange={(e) => setCountryInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCountry()} />
                    <button type="button" onClick={addCountry} className="px-4 py-2 rounded-lg bg-stone-700 text-white text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {form.targetAudience.countries.map((country) => (
                        <span key={country} className="px-3 py-1 rounded-full bg-stone-900/40 border border-stone-500/10 text-stone-300 text-xs">{country}</span>
                    ))}
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-stone-700 hover:bg-stone-500 text-white font-medium text-sm transition-all disabled:opacity-40">
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save profile'}
            </button>
        </div>
    );
}
