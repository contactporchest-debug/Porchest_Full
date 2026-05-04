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

    const profileInitials = useMemo(() => {
        const base = form.fullName || profile?.fullName || 'I';
        return String(base).slice(0, 2).toUpperCase();
    }, [form.fullName, profile]);

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

    const handle = profile?.igUsername ? `@${profile.igUsername}` : '@instagram';
    const profileSummary = [
        { label: 'Full name', value: form.fullName || '—' },
        { label: 'Contact email', value: form.contactEmail || '—' },
        { label: 'Country', value: form.country || '—' },
        { label: 'City', value: form.city || '—' },
    ];

    if (!isEditing && profile?.profileComplete) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="profile-form">
                <div style={sectionStyle}>
                    <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #EDD9BC', display: 'flex', flexDirection: 'column', gap: '12px' }} className="md:flex-row md:items-start md:justify-between">
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Influencer profile</p>
                            <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Profile Setup</h3>
                            <p style={{ marginTop: '4px', fontSize: '14px', color: '#7A5030' }}>View your profile details and click edit if you need to make changes.</p>
                        </div>
                        <div style={{ display: 'inline-flex', borderRadius: '99px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
                            Profile complete
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        {profileSummary.map((item) => (
                            <div key={item.label} style={{ borderRadius: '16px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>{item.label}</p>
                                <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: '#1A0A00' }}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '16px', borderRadius: '16px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.6)', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Profile image</p>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {profileImage ? (
                                <img src={profileImage} alt="Instagram profile" style={{ height: '56px', width: '56px', borderRadius: '50%', objectCover: 'cover', border: '1px solid #EDD9BC' }} />
                            ) : (
                                <div style={{ display: 'flex', height: '56px', width: '56px', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#C2340A', fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                                    {profileInitials}
                                </div>
                            )}
                            <div>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A0A00' }}>{handle}</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="profile-form">
            <div style={sectionStyle}>
                <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #EDD9BC', display: 'flex', flexDirection: 'column', gap: '12px' }} className="md:flex-row md:items-start md:justify-between">
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Influencer profile</p>
                        <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Basic Identity</h3>
                        <p style={{ marginTop: '4px', fontSize: '14px', color: '#7A5030' }}>Keep your contact details and location up to date.</p>
                    </div>
                    <div style={{ display: 'inline-flex', borderRadius: '99px', border: profile?.profileComplete ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)', background: profile?.profileComplete ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: profile?.profileComplete ? '#059669' : '#d97706', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
                        {profile?.profileComplete ? 'Profile complete' : 'Incomplete'}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '16px' }} className="md:grid-cols-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Full name</label>
                        <input style={inputStyle} placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Contact email</label>
                        <input style={inputStyle} placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Country</label>
                        <div style={{ position: 'relative' }}>
                            <select style={{ ...inputStyle, appearance: 'none' }} value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                                onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}>
                                <option value="">Select country</option>
                                {COUNTRIES.map((country) => (
                                    <option key={country} value={country}>{country}</option>
                                ))}
                            </select>
                            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7A5030' }}>⌄</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>City</label>
                        <div style={{ position: 'relative' }}>
                            <select style={{ ...inputStyle, appearance: 'none' }} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                                onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}>
                                <option value="">Select city</option>
                                {CITIES.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7A5030' }}>⌄</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Profile setup</p>
                    <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Niche & Content Style</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ marginBottom: '12px', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Niche</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {NICHES.map((niche) => (
                                <button key={niche} type="button" onClick={() => toggleArray('niche', niche)} style={getChipStyle(form.niche.includes(niche))}
                                    onMouseEnter={e => { if (!form.niche.includes(niche)) e.currentTarget.style.background = '#fff' }}
                                    onMouseLeave={e => { if (!form.niche.includes(niche)) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}>
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ marginBottom: '12px', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Content style</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {CONTENT_STYLES.map((style) => (
                                <button key={style} type="button" onClick={() => toggleArray('contentStyleTags', style)} style={getChipStyle(form.contentStyleTags.includes(style))}
                                    onMouseEnter={e => { if (!form.contentStyleTags.includes(style)) e.currentTarget.style.background = '#fff' }}
                                    onMouseLeave={e => { if (!form.contentStyleTags.includes(style)) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}>
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Languages</label>
                        <select
                            multiple
                            style={{ ...inputStyle, minHeight: '160px', padding: '12px' }}
                            value={form.languages}
                            onChange={(event) => handleMultiSelect('languages', event)}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}
                        >
                            {LANGUAGES.map((language) => (
                                <option key={language} value={language}>
                                    {language}
                                </option>
                            ))}
                        </select>
                        <p style={{ fontSize: '12px', color: '#7A5030' }}>Hold Ctrl or Command to select multiple languages.</p>
                        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {form.languages.map((language) => (
                                <span key={language} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '99px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.8)', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#1A0A00' }}>
                                    {language}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Profile setup</p>
                    <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Collaboration Pricing</h3>
                </div>
                <div style={{ display: 'grid', gap: '16px' }} className="md:grid-cols-3">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Story price</label>
                        <input style={inputStyle} type="number" min="0" placeholder="Story price" value={form.rates.storyPrice} onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, storyPrice: event.target.value } }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Reel price</label>
                        <input style={inputStyle} type="number" min="0" placeholder="Reel price" value={form.rates.reelPrice} onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, reelPrice: event.target.value } }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Post price</label>
                        <input style={inputStyle} type="number" min="0" placeholder="Post price" value={form.rates.postPrice} onChange={(event) => setForm((current) => ({ ...current, rates: { ...current.rates, postPrice: event.target.value } }))}
                            onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'} />
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
