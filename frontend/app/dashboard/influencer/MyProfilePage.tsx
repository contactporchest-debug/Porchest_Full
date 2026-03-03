'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, Globe, ChevronDown, Instagram, Link2, Image,
    DollarSign, TrendingUp, Save, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { influencerAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const NICHES = ['Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance', 'Other'];
const COUNTRIES = [
    'Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia', 'India',
    'United Arab Emirates', 'Saudi Arabia', 'Germany', 'France', 'Netherlands',
    'Singapore', 'Malaysia', 'Turkey', 'South Africa', 'Nigeria', 'Kenya', 'Other',
];

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(14,12,26,0.75)', border: '1px solid rgba(123,63,242,0.15)', borderRadius: '28px', padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                {icon}
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color: '#fff' }}>{title}</h3>
        </div>
        {children}
    </motion.div>
);

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 15px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 200ms ease',
};

const Label = ({ children }: { children: React.ReactNode }) => (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {children}
    </label>
);

const ReadOnlyField = ({ label, value, color = '#60d5f8' }: { label: string; value: string; color?: string }) => (
    <div style={{ padding: '11px 15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '15px', color }}>{value || '—'}</p>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>API-synced · read-only</p>
    </div>
);

export default function MyProfilePage() {
    const { user, updateUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        fullName: '', age: '', country: '', contactEmail: '', niche: '', bio: '',
        instagramUsername: '', instagramProfileURL: '', instagramDPURL: '', accountType: '',
        avgPostCostUSD: '', avgReelCostUSD: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                fullName: user.fullName || '',
                age: user.age ? String(user.age) : '',
                country: user.country || '',
                contactEmail: user.contactEmail || user.email || '',
                niche: user.niche || '',
                bio: user.bio || '',
                instagramUsername: user.instagramUsername || '',
                instagramProfileURL: user.instagramProfileURL || '',
                instagramDPURL: user.instagramDPURL || '',
                accountType: user.accountType || '',
                avgPostCostUSD: user.avgPostCostUSD ? String(user.avgPostCostUSD) : '',
                avgReelCostUSD: user.avgReelCostUSD ? String(user.avgReelCostUSD) : '',
            });
        }
    }, [user]);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const completionScore = (() => {
        const fields = [form.fullName, form.country, form.niche, form.instagramUsername, form.avgPostCostUSD, form.avgReelCostUSD];
        return Math.round((fields.filter(Boolean).length / fields.length) * 100);
    })();

    const handleSave = async () => {
        if (!form.fullName) return toast.error('Full name is required');
        if (!form.niche) return toast.error('Please select your niche');
        if (!form.avgPostCostUSD || !form.avgReelCostUSD) return toast.error('Pricing fields are required for brand discovery');
        setSaving(true);
        try {
            const res = await influencerAPI.updateProfile({
                ...form,
                age: form.age ? Number(form.age) : undefined,
                avgPostCostUSD: Number(form.avgPostCostUSD),
                avgReelCostUSD: Number(form.avgReelCostUSD),
            });
            if (updateUser) updateUser(res.data.user);
            toast.success('Profile updated successfully! ✅');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '720px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>My Profile</h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Your profile is shown to brands searching for influencers</p>
                </div>
                {/* Completion badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '99px', background: completionScore === 100 ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${completionScore === 100 ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                    {completionScore === 100 ? <CheckCircle2 size={14} style={{ color: '#4ade80' }} /> : <AlertCircle size={14} style={{ color: '#fbbf24' }} />}
                    <span style={{ fontSize: '12px', fontWeight: '700', color: completionScore === 100 ? '#4ade80' : '#fbbf24' }}>{completionScore}% complete</span>
                </div>
            </div>

            {/* ── BASIC INFORMATION ── */}
            <SectionCard title="Basic Information" icon={<User size={16} />}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Label>Full Name *</Label>
                        <input style={inputStyle} placeholder="Your full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                            onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                    </div>
                    <div>
                        <Label>Age</Label>
                        <input type="number" min={13} max={100} style={inputStyle} placeholder="e.g. 25" value={form.age} onChange={(e) => set('age', e.target.value)}
                            onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                    </div>
                    <div>
                        <Label>Country of Residence *</Label>
                        <div style={{ position: 'relative' }}>
                            <Globe size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                            <select style={{ ...inputStyle, paddingLeft: '36px', appearance: 'none', color: form.country ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                value={form.country} onChange={(e) => set('country', e.target.value)}>
                                <option value="">Select country</option>
                                {COUNTRIES.map((c) => <option key={c} value={c} style={{ background: '#0d0118' }}>{c}</option>)}
                            </select>
                            <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                        </div>
                    </div>
                    <div>
                        <Label>Contact Email</Label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                            <input type="email" style={{ ...inputStyle, paddingLeft: '36px' }} placeholder="contact@you.com" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)}
                                onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                        </div>
                    </div>
                    <div>
                        <Label>Niche *</Label>
                        <div style={{ position: 'relative' }}>
                            <select style={{ ...inputStyle, appearance: 'none', paddingRight: '32px', color: form.niche ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                value={form.niche} onChange={(e) => set('niche', e.target.value)}>
                                <option value="">Select niche</option>
                                {NICHES.map((n) => <option key={n} value={n} style={{ background: '#0d0118' }}>{n}</option>)}
                            </select>
                            <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                        </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Label>Bio <span style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'none', fontWeight: '400' }}>(optional)</span></Label>
                        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.6' }}
                            placeholder="Short description about yourself and your audience…"
                            value={form.bio} onChange={(e) => set('bio', e.target.value)} />
                    </div>
                </div>
            </SectionCard>

            {/* ── INSTAGRAM PROFILE ── */}
            <SectionCard title="Instagram Profile" icon={<Instagram size={16} />}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <Label>Instagram Username</Label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>@</span>
                            <input style={{ ...inputStyle, paddingLeft: '30px' }} placeholder="yourhandle" value={form.instagramUsername} onChange={(e) => set('instagramUsername', e.target.value)}
                                onFocus={e => (e.target.style.borderColor = 'rgba(131,58,180,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                        </div>
                    </div>
                    <div>
                        <Label>Account Type</Label>
                        <div style={{ position: 'relative' }}>
                            <select style={{ ...inputStyle, appearance: 'none', paddingRight: '32px', color: form.accountType ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                value={form.accountType} onChange={(e) => set('accountType', e.target.value)}>
                                <option value="">Select type</option>
                                <option value="Creator" style={{ background: '#0d0118' }}>Creator</option>
                                <option value="Business" style={{ background: '#0d0118' }}>Business</option>
                            </select>
                            <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                        </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Label>Instagram Profile URL</Label>
                        <div style={{ position: 'relative' }}>
                            <Link2 size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                            <input style={{ ...inputStyle, paddingLeft: '36px' }} placeholder="https://instagram.com/yourhandle" value={form.instagramProfileURL} onChange={(e) => set('instagramProfileURL', e.target.value)}
                                onFocus={e => (e.target.style.borderColor = 'rgba(131,58,180,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                        </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Label>Profile Picture URL (DP)</Label>
                        <div style={{ position: 'relative' }}>
                            <Image size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                            <input style={{ ...inputStyle, paddingLeft: '36px' }} placeholder="https://cdn.instagram.com/your-dp.jpg" value={form.instagramDPURL} onChange={(e) => set('instagramDPURL', e.target.value)}
                                onFocus={e => (e.target.style.borderColor = 'rgba(131,58,180,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '5px' }}>Enter the URL of your Instagram profile photo. Used by brands to identify you.</p>
                    </div>
                    {/* API-synced read-only */}
                    <ReadOnlyField label="Followers" value={user?.followers ? `${(user.followers / 1000).toFixed(1)}K` : '—'} color="#60d5f8" />
                    <ReadOnlyField label="Engagement Rate" value={user?.engagementRate ? `${user.engagementRate}%` : '—'} color="#4ade80" />
                </div>
            </SectionCard>

            {/* ── PRICING ── */}
            <SectionCard title="Collaboration Pricing" icon={<DollarSign size={16} />}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px', lineHeight: '1.6' }}>
                    Set your average rates so brands can evaluate you before sending a campaign request. These are displayed on your discovery card.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <Label>Avg. Post Cost (USD) *</Label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>$</span>
                            <input type="number" min={0} style={{ ...inputStyle, paddingLeft: '26px' }} placeholder="e.g. 200" value={form.avgPostCostUSD} onChange={(e) => set('avgPostCostUSD', e.target.value)}
                                onFocus={e => (e.target.style.borderColor = 'rgba(74,222,128,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Per Instagram post</p>
                    </div>
                    <div>
                        <Label>Avg. Reel Cost (USD) *</Label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>$</span>
                            <input type="number" min={0} style={{ ...inputStyle, paddingLeft: '26px' }} placeholder="e.g. 350" value={form.avgReelCostUSD} onChange={(e) => set('avgReelCostUSD', e.target.value)}
                                onFocus={e => (e.target.style.borderColor = 'rgba(74,222,128,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Per Instagram reel</p>
                    </div>
                </div>
                <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={13} style={{ color: '#4ade80' }} />
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            Estimated monthly revenue at 4 posts:{'  '}
                            <span style={{ color: '#4ade80', fontWeight: '700' }}>
                                ${form.avgPostCostUSD && form.avgReelCostUSD
                                    ? ((Number(form.avgPostCostUSD) * 2) + (Number(form.avgReelCostUSD) * 2)).toLocaleString()
                                    : '—'}
                            </span>
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* Save Button */}
            <button onClick={handleSave} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '15px', borderRadius: '16px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 0 32px rgba(123,63,242,0.4)', transition: 'all 200ms ease', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
                {saving ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={17} />}
                {saving ? 'Saving…' : 'Save Profile'}
            </button>
        </motion.div>
    );
}
