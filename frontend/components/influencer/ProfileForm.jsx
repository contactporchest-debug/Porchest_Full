'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi';
import { influencerAPI } from '@/lib/api';

const NICHES = ['fashion', 'beauty', 'tech', 'food', 'travel', 'fitness', 'gaming', 'finance', 'education', 'lifestyle', 'business', 'entertainment'];
const CONTENT_STYLES = ['aesthetic', 'luxury', 'casual', 'funny', 'professional', 'minimalist', 'bold', 'emotional'];
const LANGUAGES = ['English', 'Urdu', 'Arabic', 'Punjabi', 'Hindi', 'French', 'Spanish', 'German', 'Pashto'];
const COUNTRIES = ['Pakistan', 'United States', 'United Kingdom', 'Canada', 'United Arab Emirates', 'Saudi Arabia', 'Australia', 'India'];
const COUNTRY_CITIES = {
    Pakistan: ['Rawalpindi', 'Islamabad', 'Lahore', 'Karachi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'],
    Canada: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Dallas', 'San Francisco', 'Seattle'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol'],
    'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain'],
    'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar'],
    Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
    India: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'],
};

function parseList(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
    return [];
}

function getProfileCompleteState(profile) {
    return Boolean(profile?.profileComplete ?? profile?.profileCompletionStatus ?? profile?.profileCompletion?.isComplete);
}

function chipClass(selected, disabled = false) {
    return [
        'rounded-full border px-4 py-2 text-xs font-semibold transition-colors',
        selected
            ? 'border-[#C2340A]/30 bg-[#C2340A]/8 text-[#C2340A]'
            : 'border-[#EDD9BC] bg-[rgba(255,255,255,0.72)] text-[#7A5030] hover:bg-white',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
    ].join(' ');
}

function inputStyle() {
    return {
        width: '100%',
        borderRadius: '12px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.72)',
        padding: '12px 16px',
        fontSize: '14px',
        color: '#1A0A00',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: 'inherit',
    };
}

function sectionStyle() {
    return {
        borderRadius: '24px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.42)',
        padding: '24px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(26,10,0,0.02)',
    };
}

export default function ProfileForm() {
    const { data: profile, refetch } = useApi('/profile/influencer/me');
    const [isEditing, setIsEditing] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const hasInitializedProfile = useRef(false);
    const [form, setForm] = useState({
        fullName: '',
        contactEmail: '',
        bio: '',
        country: '',
        city: '',
        niche: [],
        languages: [],
        contentStyleTags: [],
        rates: { reelPrice: '', postPrice: '' },
    });

    useEffect(() => {
        if (!profile) return;

        setForm({
            fullName: profile.fullName || '',
            contactEmail: profile.contactEmail || '',
            bio: profile.bio || profile.igBio || '',
            country: profile.country || profile.countryOfResidence || '',
            city: profile.city || '',
            niche: parseList(profile.niche),
            languages: parseList(profile.languages),
            contentStyleTags: parseList(profile.contentStyleTags),
            rates: {
                reelPrice: profile.rates?.reelPrice ?? profile.avgReelPrice ?? '',
                postPrice: profile.rates?.postPrice ?? profile.avgPostPrice ?? '',
            },
        });

        if (!hasInitializedProfile.current) {
            const hasPersistedProfile = Boolean(
                profile.fullName ||
                profile.contactEmail ||
                profile.bio ||
                profile.igBio ||
                profile.country ||
                profile.countryOfResidence ||
                profile.city ||
                parseList(profile.niche).length ||
                parseList(profile.languages).length ||
                parseList(profile.contentStyleTags).length ||
                profile.rates?.reelPrice ||
                profile.avgReelPrice ||
                profile.rates?.postPrice ||
                profile.avgPostPrice
            );

            setIsEditing(!hasPersistedProfile);
            hasInitializedProfile.current = true;
        }
    }, [profile]);

    const isComplete = useMemo(() => {
        const hasRates = Number(form.rates.reelPrice) > 0 && Number(form.rates.postPrice) > 0;
        return !!(
            form.fullName.trim() &&
            form.contactEmail.trim() &&
            form.bio.trim() &&
            form.country &&
            form.city &&
            form.niche.length > 0 &&
            form.contentStyleTags.length > 0 &&
            form.languages.length > 0 &&
            form.languages.length <= 2 &&
            hasRates
        );
    }, [form]);

    function toggleArray(field, value) {
        setSaved(false);
        setForm((current) => {
            const selected = current[field].includes(value);
            if (selected) {
                return { ...current, [field]: current[field].filter((item) => item !== value) };
            }

            if (field === 'languages' && current[field].length >= 2) {
                return current;
            }

            return { ...current, [field]: [...current[field], value] };
        });
    }

    const cityOptions = useMemo(() => {
        const countryCities = COUNTRY_CITIES[form.country] || [];
        if (!form.city) return countryCities;
        return countryCities.includes(form.city) ? countryCities : [form.city, ...countryCities];
    }, [form.country, form.city]);

    function handleCountryChange(value) {
        setSaved(false);
        setForm((current) => ({
            ...current,
            country: value,
            city: current.country === value ? current.city : '',
        }));
    }

    async function handleSave() {
        if (!isComplete) {
            toast.error('Please fill every required field to complete your profile.');
            return;
        }

        setSaving(true);
        try {
            await influencerAPI.updateProfile({
                fullName: form.fullName,
                contactEmail: form.contactEmail,
                bio: form.bio,
                country: form.country,
                city: form.city,
                niche: form.niche,
                languages: form.languages,
                contentStyleTags: form.contentStyleTags,
                rates: form.rates,
            });

            await refetch();
            setSaved(true);
            setIsEditing(false);
            window.setTimeout(() => setSaved(false), 1800);
        } catch (error) {
            console.error(error);
            toast.error(error?.message || 'Failed to save influencer profile');
        } finally {
            setSaving(false);
        }
    }

    const profileComplete = getProfileCompleteState(profile);

    if (!isEditing) {
        return (
            <div id="profile-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={sectionStyle()}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #EDD9BC' }} className="md:flex-row md:items-start md:justify-between">
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Basic profile</p>
                            <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Profile Setup</h3>
                            <p style={{ marginTop: '4px', fontSize: '14px', color: '#7A5030' }}>Your profile details are saved. Click edit if you want to make changes.</p>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                            <div style={{ display: 'inline-flex', borderRadius: '99px', border: profileComplete ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)', background: profileComplete ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: profileComplete ? '#059669' : '#d97706', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
                                {profileComplete ? 'Profile complete' : 'Saved, incomplete'}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                style={{ borderRadius: '99px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.72)', padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: '#1A0A00', cursor: 'pointer' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.72)'; }}
                            >
                                Edit profile
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }} className="md:grid-cols-2">
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Full name</p>
                            <p style={{ marginTop: '6px', fontSize: '15px', fontWeight: 600, color: '#1A0A00' }}>{profile.fullName || '—'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Contact email</p>
                            <p style={{ marginTop: '6px', fontSize: '15px', fontWeight: 600, color: '#1A0A00' }}>{profile.contactEmail || '—'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Country</p>
                            <p style={{ marginTop: '6px', fontSize: '15px', fontWeight: 600, color: '#1A0A00' }}>{profile.country || '—'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>City</p>
                            <p style={{ marginTop: '6px', fontSize: '15px', fontWeight: 600, color: '#1A0A00' }}>{profile.city || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Bio</p>
                            <p style={{ marginTop: '6px', fontSize: '15px', fontWeight: 500, color: '#1A0A00', lineHeight: 1.7 }}>{profile.bio || profile.igBio || '—'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Niche</p>
                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {(profile.niche || []).length ? parseList(profile.niche).map((item) => (
                                    <span key={item} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.72)', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#1A0A00' }}>{item}</span>
                                )) : <span style={{ fontSize: '14px', color: '#7A5030' }}>—</span>}
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Languages</p>
                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {parseList(profile.languages).length ? parseList(profile.languages).map((item) => (
                                    <span key={item} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.72)', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#1A0A00' }}>{item}</span>
                                )) : <span style={{ fontSize: '14px', color: '#7A5030' }}>—</span>}
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Content style</p>
                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {parseList(profile.contentStyleTags).length ? parseList(profile.contentStyleTags).map((item) => (
                                    <span key={item} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.72)', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#1A0A00' }}>{item}</span>
                                )) : <span style={{ fontSize: '14px', color: '#7A5030' }}>—</span>}
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Rates</p>
                            <p style={{ marginTop: '6px', fontSize: '15px', fontWeight: 600, color: '#1A0A00' }}>
                                Reel {profile.rates?.reelPrice ? `$${profile.rates.reelPrice}` : '—'} · Post {profile.rates?.postPrice ? `$${profile.rates.postPrice}` : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div id="profile-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={sectionStyle()}>
                <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #EDD9BC', display: 'flex', flexDirection: 'column', gap: '12px' }} className="md:flex-row md:items-start md:justify-between">
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Basic profile</p>
                        <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Profile Setup</h3>
                        <p style={{ marginTop: '4px', fontSize: '14px', color: '#7A5030' }}>Fill every field to complete your profile. Brands use this information to find and match you.</p>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'inline-flex', borderRadius: '99px', border: profileComplete ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)', background: profileComplete ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: profileComplete ? '#059669' : '#d97706', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
                            {profileComplete ? 'Profile complete' : 'Incomplete'}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '16px' }} className="md:grid-cols-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Full name</label>
                        <input required style={inputStyle()} placeholder="Full name" value={form.fullName} onChange={(event) => { setSaved(false); setForm((current) => ({ ...current, fullName: event.target.value })); }} onFocus={(e) => { e.target.style.borderColor = '#C2340A'; }} onBlur={(e) => { e.target.style.borderColor = '#EDD9BC'; }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Contact email</label>
                        <input required style={inputStyle()} placeholder="Contact email" value={form.contactEmail} onChange={(event) => { setSaved(false); setForm((current) => ({ ...current, contactEmail: event.target.value })); }} onFocus={(e) => { e.target.style.borderColor = '#C2340A'; }} onBlur={(e) => { e.target.style.borderColor = '#EDD9BC'; }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Country</label>
                        <div style={{ position: 'relative' }}>
                            <select required style={{ ...inputStyle(), appearance: 'none', paddingRight: '42px' }} value={form.country} onChange={(event) => handleCountryChange(event.target.value)} onFocus={(e) => { e.target.style.borderColor = '#C2340A'; }} onBlur={(e) => { e.target.style.borderColor = '#EDD9BC'; }}>
                                <option value="">Select country</option>
                                {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                            </select>
                            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7A5030' }}>⌄</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>City</label>
                        <div style={{ position: 'relative' }}>
                            <select required disabled={!form.country} style={{ ...inputStyle(), appearance: 'none', paddingRight: '42px', opacity: form.country ? 1 : 0.7 }} value={form.city} onChange={(event) => { setSaved(false); setForm((current) => ({ ...current, city: event.target.value })); }} onFocus={(e) => { e.target.style.borderColor = '#C2340A'; }} onBlur={(e) => { e.target.style.borderColor = '#EDD9BC'; }}>
                                <option value="">{form.country ? 'Select city' : 'Select country first'}</option>
                                {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
                            </select>
                            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7A5030' }}>⌄</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="md:col-span-2">
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Bio</label>
                        <textarea
                            required
                            rows={4}
                            style={{ ...inputStyle(), resize: 'vertical', minHeight: '120px' }}
                            placeholder="Write a short bio for your audience and brand partners"
                            value={form.bio}
                            onChange={(event) => { setSaved(false); setForm((current) => ({ ...current, bio: event.target.value })); }}
                            onFocus={(e) => { e.target.style.borderColor = '#C2340A'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#EDD9BC'; }}
                        />
                    </div>
                </div>
            </div>

            <div style={sectionStyle()}>
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Basic profile</p>
                    <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Niche & Content Style</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ marginBottom: '12px', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Niche</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {NICHES.map((niche) => (
                                <button key={niche} type="button" onClick={() => toggleArray('niche', niche)} className={chipClass(form.niche.includes(niche))}>
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ marginBottom: '12px', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Content style</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {CONTENT_STYLES.map((style) => (
                                <button key={style} type="button" onClick={() => toggleArray('contentStyleTags', style)} className={chipClass(form.contentStyleTags.includes(style))}>
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Languages</label>
                        <p style={{ fontSize: '12px', color: '#7A5030' }}>Select up to 2 languages.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {LANGUAGES.map((language) => {
                                const selected = form.languages.includes(language);
                                const locked = !selected && form.languages.length >= 2;
                                return (
                                    <button
                                        key={language}
                                        type="button"
                                        disabled={locked}
                                        onClick={() => toggleArray('languages', language)}
                                        className={chipClass(selected, locked)}
                                    >
                                        {language}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {form.languages.map((language) => (
                                <span key={language} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.8)', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#1A0A00' }}>
                                    {language}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={sectionStyle()}>
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030' }}>Basic profile</p>
                    <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: 800, color: '#1A0A00' }}>Collaboration Pricing</h3>
                </div>
                <div style={{ display: 'grid', gap: '16px' }} className="md:grid-cols-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Reel price</label>
                        <input required style={inputStyle()} type="number" min="0" placeholder="Reel price" value={form.rates.reelPrice} onChange={(event) => { setSaved(false); setForm((current) => ({ ...current, rates: { ...current.rates, reelPrice: event.target.value } })); }} onFocus={(e) => { e.target.style.borderColor = '#C2340A'; }} onBlur={(e) => { e.target.style.borderColor = '#EDD9BC'; }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7A5030' }}>Post price</label>
                        <input required style={inputStyle()} type="number" min="0" placeholder="Post price" value={form.rates.postPrice} onChange={(event) => { setSaved(false); setForm((current) => ({ ...current, rates: { ...current.rates, postPrice: event.target.value } })); }} onFocus={(e) => { e.target.style.borderColor = '#C2340A'; }} onBlur={(e) => { e.target.style.borderColor = '#EDD9BC'; }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                {saved && <p style={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>Profile saved successfully.</p>}
                {!isComplete && (
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#d97706' }}>Fill every required field to complete your profile.</p>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {profileComplete ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            style={{ borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.72)', padding: '12px 24px', fontSize: '14px', fontWeight: 700, color: '#1A0A00', cursor: 'pointer', transition: 'background-color 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.72)'; }}
                        >
                            Cancel
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !isComplete}
                        style={{ display: 'inline-flex', minWidth: '170px', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: '#C2340A', padding: '12px 24px', fontSize: '14px', fontWeight: 700, color: '#fff', border: 'none', cursor: saving || !isComplete ? 'not-allowed' : 'pointer', opacity: saving || !isComplete ? 0.6 : 1, transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#E8400A'; }}
                        onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = '#C2340A'; }}
                    >
                        {saving ? 'Saving...' : 'Save profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}
