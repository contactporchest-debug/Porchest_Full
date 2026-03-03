'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Star, Mail, Lock, Eye, EyeOff, ChevronDown, Globe, Calendar } from 'lucide-react';

const NICHES = ['Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance', 'Other'];
const COUNTRIES = [
    'Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia', 'India',
    'United Arab Emirates', 'Saudi Arabia', 'Germany', 'France', 'Netherlands',
    'Singapore', 'Malaysia', 'Turkey', 'South Africa', 'Nigeria', 'Kenya', 'Other',
];

const TERMS_TEXT = `Welcome to Porchest — the AI-powered influencer-brand collaboration platform.

By creating an account, you agree to the following:

1. Authenticity: You confirm that you are a real content creator with genuine followers and engagement. Fake engagement, bot-driven metrics, or impersonation are strictly prohibited.

2. Data Usage: Porchest may store your profile data including niche, pricing, and Instagram metrics to match you with relevant brand campaigns. No data is sold to third parties.

3. Campaign Conduct: If you accept a campaign request from a brand, you are obligated to deliver the agreed content within the specified timeline. Failure to deliver without valid reason may result in account suspension.

4. Pricing Accuracy: The average post and reel cost you set in your profile must reflect your genuine market rate. Misleading pricing information is grounds for removal.

5. Intellectual Property: Content you post as part of brand collaborations must be original. You may not use copyrighted material without proper licensing.

6. Platform Rules: Porchest reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent behavior, or harm the platform community.

7. Modifications: These terms may be updated. Continued use of the platform after changes constitutes acceptance.

By checking the box below, you acknowledge that you have read, understood, and agree to these Terms & Conditions.`;

export default function InfluencerSignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [form, setForm] = useState({
        fullName: '', email: '', password: '', niche: '', country: '', age: '', bio: '', termsAccepted: false,
    });

    const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName || !form.email || !form.password || !form.niche || !form.country) {
            return toast.error('Please fill all required fields');
        }
        if (!form.termsAccepted) {
            return toast.error('You must accept the Terms & Conditions');
        }
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            await authAPI.register({
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                niche: form.niche,
                country: form.country,
                age: form.age ? Number(form.age) : undefined,
                bio: form.bio,
                role: 'influencer',
                termsAccepted: true,
            });
            toast.success('Account created! Check your email for the verification code.');
            router.push(`/signup/verify-otp?email=${encodeURIComponent(form.email)}`);
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 16px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
        boxSizing: 'border-box', transition: 'border-color 200ms ease',
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', background: '#000' }}>
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 60%)' }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', background: 'linear-gradient(135deg, #7B2FF7, #9d4dff)', boxShadow: '0 0 20px rgba(123,47,247,0.5)', color: '#fff' }}>P</div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px' }}>
                            <span style={{ color: '#fff' }}>Por</span>
                            <span style={{ background: 'linear-gradient(135deg, #7B2FF7, #be8bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chest</span>
                        </span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>
                            <Star size={15} />
                        </div>
                        <span style={{ fontSize: '13px', color: '#00d4ff', fontWeight: '600' }}>Influencer Account</span>
                    </div>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '24px', color: '#fff', marginBottom: '6px' }}>Join as Influencer</h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Fill your basic info — add pricing & Instagram from your profile.</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                        {/* Full Name */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name *</label>
                            <input style={inputStyle} placeholder="Your full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                                onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                        </div>

                        {/* Email */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email *</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                <input type="email" style={{ ...inputStyle, paddingLeft: '42px' }} placeholder="you@email.com" value={form.email} onChange={(e) => set('email', e.target.value)}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password *</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                <input type={showPass ? 'text' : 'password'} style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '42px' }} placeholder="Min. 6 characters" value={form.password} onChange={(e) => set('password', e.target.value)}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Niche + Age */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Niche *</label>
                                <div style={{ position: 'relative' }}>
                                    <select style={{ ...inputStyle, appearance: 'none', paddingRight: '36px', color: form.niche ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                        value={form.niche} onChange={(e) => set('niche', e.target.value)}>
                                        <option value="" disabled>Select niche</option>
                                        {NICHES.map((n) => <option key={n} value={n} style={{ background: '#0d0118' }}>{n}</option>)}
                                    </select>
                                    <ChevronDown size={13} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            <div style={{ width: '90px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Age</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                    <input type="number" min={13} max={100} style={{ ...inputStyle, paddingLeft: '34px' }} placeholder="25" value={form.age} onChange={(e) => set('age', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Country */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Country of Residence *</label>
                            <div style={{ position: 'relative' }}>
                                <Globe size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                <select style={{ ...inputStyle, paddingLeft: '42px', appearance: 'none', paddingRight: '36px', color: form.country ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                    value={form.country} onChange={(e) => set('country', e.target.value)}>
                                    <option value="" disabled>Select country</option>
                                    {COUNTRIES.map((c) => <option key={c} value={c} style={{ background: '#0d0118' }}>{c}</option>)}
                                </select>
                                <ChevronDown size={13} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Bio (optional) */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bio <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: '400', textTransform: 'none' }}>(optional)</span></label>
                            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '75px', lineHeight: '1.6' }}
                                placeholder="Tell brands about yourself and your audience…"
                                value={form.bio} onChange={(e) => set('bio', e.target.value)} />
                        </div>

                        {/* Terms & Conditions */}
                        <div style={{ borderRadius: '16px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.18)', padding: '18px' }}>
                            <button type="button" onClick={() => setShowTerms(!showTerms)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#c084fc', fontSize: '13px', fontWeight: '700', padding: 0 }}>
                                <span>📄 Terms & Conditions</span>
                                <ChevronDown size={14} style={{ transform: showTerms ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} />
                            </button>
                            <AnimatePresence>
                                {showTerms && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                        <div style={{ marginTop: '14px', maxHeight: '200px', overflowY: 'auto', fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', whiteSpace: 'pre-line', paddingRight: '8px' }}>
                                            {TERMS_TEXT}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.termsAccepted} onChange={(e) => set('termsAccepted', e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: '#A855F7', cursor: 'pointer' }} />
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: '500' }}>
                                    I agree to the <span style={{ color: '#c084fc', fontWeight: '700' }}>Terms & Conditions</span>
                                </span>
                            </label>
                        </div>

                        <GlowButton type="submit" fullWidth loading={loading} size="lg" style={{ background: 'linear-gradient(135deg, #00d4ff, #7B2FF7)', marginTop: '4px' } as React.CSSProperties}>
                            Create Influencer Account
                        </GlowButton>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                    <Link href="/signup" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Choose role</Link>
                    {' · '}
                    <Link href="/login" style={{ color: '#9d4dff', textDecoration: 'none' }}>Already have an account?</Link>
                </p>
            </motion.div>
        </main>
    );
}
