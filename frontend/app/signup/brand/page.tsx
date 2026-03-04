'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, Eye, EyeOff, ChevronDown, DollarSign, FileText } from 'lucide-react';
import OTPVerify from '@/components/auth/OTPVerify';

const NICHES = ['Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance', 'Other'];

export default function BrandSignupPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({
        companyName: '', email: '', password: '', brandNiche: '',
        brandGoal: '', approxBudgetUSD: '', website: '',
    });
    const [showOTP, setShowOTP] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
    const wordCount = form.brandGoal.trim() ? form.brandGoal.trim().split(/\s+/).length : 0;
    const wordsLeft = 150 - wordCount;

    const onVerifySuccess = async (token: string, user: any) => {
        toast.success('Welcome to Porchest! 🎉');
        router.push('/dashboard/brand');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.companyName || !form.email || !form.password || !form.brandNiche) {
            return toast.error('Please fill all required fields');
        }
        if (wordCount > 150) return toast.error('Brand Goal must be 150 words or less');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            await authAPI.register({
                companyName: form.companyName,
                email: form.email,
                password: form.password,
                brandNiche: form.brandNiche,
                brandGoal: form.brandGoal,
                website: form.website,
                approxBudgetUSD: form.approxBudgetUSD ? Number(form.approxBudgetUSD) : undefined,
                role: 'brand',
            });

            setRegisteredEmail(form.email);
            setShowOTP(true);
            toast.success('Account created! Please verify your email.');
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
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 0%, rgba(123,47,247,0.12) 0%, transparent 60%)' }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 10 }}>
                {showOTP ? (
                    <OTPVerify email={registeredEmail} onSuccess={onVerifySuccess} />
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', background: 'linear-gradient(135deg, #7B2FF7, #9d4dff)', boxShadow: '0 0 20px rgba(123,47,247,0.5)', color: '#fff' }}>P</div>
                                <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px' }}>
                                    <span style={{ color: '#fff' }}>Por</span>
                                    <span style={{ background: 'linear-gradient(135deg, #7B2FF7, #be8bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chest</span>
                                </span>
                            </Link>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(123,47,247,0.15)', color: '#9d4dff' }}>
                                    <Building2 size={15} />
                                </div>
                                <span style={{ fontSize: '13px', color: '#9d4dff', fontWeight: '600' }}>Brand Account</span>
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '24px', color: '#fff' }}>Create Brand Account</h1>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                                {/* Company Name */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company Name *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Building2 size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                        <input style={{ ...inputStyle, paddingLeft: '42px' }} placeholder="Your company name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)}
                                            onFocus={e => (e.target.style.borderColor = 'rgba(123,63,242,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Official Email *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                        <input type="email" style={{ ...inputStyle, paddingLeft: '42px' }} placeholder="company@email.com" value={form.email} onChange={(e) => set('email', e.target.value)}
                                            onFocus={e => (e.target.style.borderColor = 'rgba(123,63,242,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                        <input type={showPass ? 'text' : 'password'} style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '42px' }} placeholder="Min. 6 characters" value={form.password} onChange={(e) => set('password', e.target.value)}
                                            onFocus={e => (e.target.style.borderColor = 'rgba(123,63,242,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Brand Niche + Budget */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand Niche *</label>
                                        <div style={{ position: 'relative' }}>
                                            <select style={{ ...inputStyle, appearance: 'none', paddingRight: '36px', color: form.brandNiche ? '#fff' : 'rgba(255,255,255,0.3)' }}
                                                value={form.brandNiche} onChange={(e) => set('brandNiche', e.target.value)}>
                                                <option value="" disabled>Select niche</option>
                                                {NICHES.map((n) => <option key={n} value={n} style={{ background: '#0d0118' }}>{n}</option>)}
                                            </select>
                                            <ChevronDown size={13} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approx. Budget (USD)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                            <input type="number" min={0} style={{ ...inputStyle, paddingLeft: '42px' }} placeholder="e.g. 5000" value={form.approxBudgetUSD} onChange={(e) => set('approxBudgetUSD', e.target.value)}
                                                onFocus={e => (e.target.style.borderColor = 'rgba(123,63,242,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                                        </div>
                                    </div>
                                </div>

                                {/* Brand Goal */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            <FileText size={12} /> Brand Goal
                                        </label>
                                        <span style={{ fontSize: '11px', color: wordsLeft < 0 ? '#f87171' : wordsLeft < 20 ? '#fbbf24' : 'rgba(255,255,255,0.25)', fontWeight: '600' }}>
                                            {wordCount}/150 words
                                        </span>
                                    </div>
                                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
                                        placeholder="Describe what your brand does, your marketing intent, and target audience (max 150 words)…"
                                        value={form.brandGoal} onChange={(e) => set('brandGoal', e.target.value)} />
                                </div>

                                <GlowButton type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '4px' } as React.CSSProperties}>
                                    Create Brand Account
                                </GlowButton>
                            </form>
                        </div>

                        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                            <Link href="/signup" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Choose role</Link>
                            {' · '}
                            <Link href="/login" style={{ color: '#9d4dff', textDecoration: 'none' }}>Already have an account?</Link>
                        </p>
                    </>
                )}
            </motion.div>
        </main>
    );
}
