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

    const inputStyle = {
        width: '100%',
        borderRadius: '12px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.6)',
        padding: '12px 16px',
        fontSize: '14px',
        color: '#1A0A00',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: 'inherit'
    };

    const sectionStyle = {
        borderRadius: '24px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.4)',
        padding: '24px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(26,10,0,0.02)'
    };

    const summaryItems = [
        { label: 'Business name', value: form.businessName || '—' },
        { label: 'Representer', value: form.representerName || '—' },
        { label: 'Website', value: form.website || '—' },
        { label: 'Contact email', value: form.contactEmail || '—' },
        { label: 'Industry', value: form.industry || '—' },
    ];

    const getChipStyle = (selected) => ({
        borderRadius: '99px',
        border: selected ? '1px solid rgba(194,52,10,0.3)' : '1px solid #EDD9BC',
        background: selected ? 'rgba(194,52,10,0.08)' : 'rgba(255,255,255,0.6)',
        color: selected ? '#C2340A' : '#7A5030',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s'
    });

    if (!isEditing && profile?.profileComplete) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={sectionStyle}>
                    <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #EDD9BC', display: 'flex', flexDirection: 'column', gap: '12px' }} className="md:flex-row md:items-start md:justify-between">
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Brand profile</p>
                            <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Profile Setup</h3>
                            <p style={{ marginTop: '4px', fontSize: '14px', color: '#7A5030' }}>View your brand details and click edit if you need to make changes.</p>
                        </div>
                        <div style={{ display: 'inline-flex', borderRadius: '99px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
                            Profile complete
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        {summaryItems.map((item) => (
                            <div key={item.label} style={{ borderRadius: '16px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>{item.label}</p>
                                <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: '#1A0A00' }}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '16px', borderRadius: '16px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Business icon</p>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', height: '56px', width: '56px', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#C2340A', fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                                {profileInitials}
                            </div>
                            <div>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A0A00' }}>{form.businessName || 'Brand profile'}</p>
                                <p style={{ fontSize: '13px', color: '#7A5030' }}>Used across your Porchest profile.</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: '#C2340A', padding: '12px 24px', fontSize: '14px', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#E8400A'}
                            onMouseLeave={e => e.currentTarget.style.background = '#C2340A'}
                        >
                            Edit profile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={sectionStyle}>
                <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #EDD9BC', display: 'flex', flexDirection: 'column', gap: '12px' }} className="md:flex-row md:items-start md:justify-between">
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Brand profile</p>
                        <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Profile Setup</h3>
                        <p style={{ marginTop: '4px', fontSize: '14px', color: '#7A5030' }}>Keep your brand details, audience, and campaign preferences up to date.</p>
                    </div>
                    <div style={{ display: 'inline-flex', borderRadius: '99px', border: profile?.profileComplete ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)', background: profile?.profileComplete ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: profile?.profileComplete ? '#059669' : '#d97706', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
                        {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '16px' }} className="md:grid-cols-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Business name</label>
                        <input style={inputStyle} placeholder="Business name" value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Brand representer name</label>
                        <input style={inputStyle} placeholder="Brand representer name" value={form.representerName} onChange={(event) => setForm((current) => ({ ...current, representerName: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Website</label>
                        <input style={inputStyle} placeholder="Website" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Instagram link</label>
                        <input style={inputStyle} placeholder="Instagram link" value={form.instagramLink} onChange={(event) => setForm((current) => ({ ...current, instagramLink: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>LinkedIn link</label>
                        <input style={inputStyle} placeholder="LinkedIn link" value={form.linkedinLink} onChange={(event) => setForm((current) => ({ ...current, linkedinLink: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Google map link</label>
                        <input style={inputStyle} placeholder="Google map link" value={form.googleMapLink} onChange={(event) => setForm((current) => ({ ...current, googleMapLink: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Contact email</label>
                        <input style={inputStyle} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Industry</label>
                        <div style={{ position: 'relative' }}>
                            <select style={{ ...inputStyle, appearance: 'none' }} value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                                onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}>
                                <option value="">Select an industry</option>
                                {INDUSTRIES.map((industry) => (
                                    <option key={industry} value={industry.toLowerCase()}>{industry}</option>
                                ))}
                            </select>
                            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7A5030' }}>⌄</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="md:col-span-2">
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Description</label>
                        <textarea style={{ ...inputStyle, minHeight: '132px', resize: 'vertical' }} placeholder="Tell creators what your brand does" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="md:col-span-2">
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Marketing goals for Porchest</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: '132px', resize: 'vertical' }}
                            maxLength={900}
                            placeholder="Describe your marketing goals in your own words"
                            value={form.marketingGoals}
                            onChange={(event) => setForm((current) => ({ ...current, marketingGoals: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}
                        />
                        <p style={{ fontSize: '12px', color: '#7A5030' }}>Keep this short and focused. Up to 150 words.</p>
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Audience</p>
                    <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Target audience and preferences</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gap: '16px' }} className="md:grid-cols-2">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Minimum age</label>
                            <input style={{ width: '100%', accentColor: '#C2340A' }} type="range" min="13" max="65" value={form.targetAudience.ageRange[0]} onChange={(event) => setForm((current) => ({ ...current, targetAudience: { ...current.targetAudience, ageRange: [Number(event.target.value), current.targetAudience.ageRange[1]] } }))} />
                            <p style={{ fontSize: '13px', color: '#7A5030' }}>{form.targetAudience.ageRange[0]} years</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Maximum age</label>
                            <input style={{ width: '100%', accentColor: '#C2340A' }} type="range" min="13" max="65" value={form.targetAudience.ageRange[1]} onChange={(event) => setForm((current) => ({ ...current, targetAudience: { ...current.targetAudience, ageRange: [current.targetAudience.ageRange[0], Number(event.target.value)] } }))} />
                            <p style={{ fontSize: '13px', color: '#7A5030' }}>{form.targetAudience.ageRange[1]} years</p>
                        </div>
                    </div>

                    <div>
                        <label style={{ marginBottom: '12px', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Genders</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {GENDERS.map((gender) => (
                                <button key={gender} type="button" onClick={() => toggleNestedArray('genders', gender)} style={getChipStyle(form.targetAudience.genders.includes(gender))}
                                    onMouseEnter={e => { if (!form.targetAudience.genders.includes(gender)) e.currentTarget.style.background = '#fff' }}
                                    onMouseLeave={e => { if (!form.targetAudience.genders.includes(gender)) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}>
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ marginBottom: '12px', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>
                            Countries
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {COUNTRIES.map((country) => {
                                const selected = form.targetAudience.countries.includes(country);
                                const disabled = !selected && form.targetAudience.countries.length >= 3;
                                return (
                                    <button
                                        key={country}
                                        type="button"
                                        onClick={() => toggleCountry(country)}
                                        disabled={disabled}
                                        style={{ ...getChipStyle(selected), opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                                        onMouseEnter={e => { if (!selected && !disabled) e.currentTarget.style.background = '#fff' }}
                                        onMouseLeave={e => { if (!selected && !disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
                                    >
                                        {country}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <p style={{ fontSize: '13px', color: '#7A5030' }}>Select up to 3 countries from the list.</p>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A0A00' }}>
                                {form.targetAudience.countries.length}/3 selected
                            </p>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {form.targetAudience.countries.map((country) => (
                                <span key={country} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '99px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.8)', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#1A0A00' }}>
                                    {country}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ marginBottom: '12px', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Preferred niches</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {NICHES.map((niche) => (
                                <button key={niche} type="button" onClick={() => toggleArray('preferredNiches', niche)} style={getChipStyle(form.preferredNiches.includes(niche))}
                                    onMouseEnter={e => { if (!form.preferredNiches.includes(niche)) e.currentTarget.style.background = '#fff' }}
                                    onMouseLeave={e => { if (!form.preferredNiches.includes(niche)) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}>
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }} className="md:grid-cols-2">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Budget minimum</label>
                            <input style={inputStyle} type="number" min="0" placeholder="Budget minimum" value={form.budgetRange.min} onChange={(event) => setForm((current) => ({ ...current, budgetRange: { ...current.budgetRange, min: event.target.value } }))}
                                onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Budget maximum</label>
                            <input style={inputStyle} type="number" min="0" placeholder="Budget maximum" value={form.budgetRange.max} onChange={(event) => setForm((current) => ({ ...current, budgetRange: { ...current.budgetRange, max: event.target.value } }))}
                                onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                {saved && <p style={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>Profile saved successfully.</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {profile?.profileComplete ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '12px 24px', fontSize: '14px', fontWeight: 700, color: '#1A0A00', cursor: 'pointer', transition: 'background-color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}
                        >
                            Cancel
                        </button>
                    ) : null}
                    <button onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', minWidth: '170px', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: '#C2340A', padding: '12px 24px', fontSize: '14px', fontWeight: 700, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'background-color 0.15s' }}
                        onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#E8400A' }}
                        onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#C2340A' }}>
                        {saving ? 'Saving...' : 'Save profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}
