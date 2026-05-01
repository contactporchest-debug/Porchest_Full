'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Star, Mail, Lock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import OTPVerify from '@/components/auth/OTPVerify';
import { GoogleLogin } from '@react-oauth/google';

const TERMS_TEXT = `Welcome to Porchest — the influencer-brand collaboration platform.

By creating an account, you agree to the following:

1. Authenticity: You confirm that you are a real content creator with genuine followers and engagement.
2. Data Usage: Porchest may store your profile data and Instagram metrics to match you with relevant campaigns.
3. Campaign Conduct: Accepted collaborations should be delivered within the agreed timeline.
4. Pricing Accuracy: Your listed rates should reflect your genuine market pricing.
5. Intellectual Property: Sponsored content must be original or properly licensed.
6. Platform Rules: Fraudulent behavior can result in suspension or removal.
7. Modifications: Continued use after updates means you accept revised terms.
`;

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.94)',
    border: '1px solid rgba(148,163,184,0.24)',
    color: '#172033',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
};

export default function InfluencerSignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', termsAccepted: false });
    const [showOTP, setShowOTP] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

    const onVerifySuccess = async () => {
        toast.success('Welcome to Porchest! Complete your profile next.');
        router.push('/dashboard/influencer/profile');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast.error('Please fill all required fields ');
        if (!form.termsAccepted) return toast.error('You must accept the Terms & Conditions');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            await authAPI.register({
                email: form.email,
                password: form.password,
                role: 'influencer',
                termsAccepted: true,
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

    const handleGoogleSuccess = async (credentialResponse: any) => {
        const idToken = credentialResponse.credential;
        if (!idToken) {
            toast.error('Google signup did not return a valid credential.');
            return;
        }
        try {
            setLoading(true);
            const { data } = await authAPI.googleAuth({ idToken, role: 'influencer' });

            if (data.success) {
                localStorage.setItem('porchest_token', data.token);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
                window.location.href = '/dashboard/influencer';
            } else {
                toast.error(data.message || 'Google Auth failed');
            }
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                (typeof err?.response?.data === 'string' ? err.response.data : null) ||
                err?.message ||
                'Google auth error';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'linear-gradient(180deg, #fcfaf4 0%, #f1efe8 100%)', position: 'relative', overflow: 'hidden' }}>
            <div className="neon-grid" />
            <div className="edge-glow" />
            <div style={{ position: 'absolute', top: '-120px', left: '-120px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(86,113,123,0.14) 0%, transparent 72%)' }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '540px', position: 'relative', zIndex: 1 }}>
                {showOTP ? (
                    <OTPVerify email={registeredEmail} onSuccess={onVerifySuccess} />
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '18px', textDecoration: 'none' }}>
                                <Image src="/porchest-logo.png" alt="Porchest" width={168} height={42} priority style={{ width: '168px', height: 'auto' }} />
                            </Link>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(86,113,123,0.10)', color: '#56717b' }}>
                                <Star size={14} />
                                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Influencer Account</span>
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '30px', color: '#172033', letterSpacing: '-0.04em', marginBottom: '8px' }}>Join as an influencer</h1>
                            <p style={{ fontSize: '15px', color: '#667085', lineHeight: 1.7 }}>Create your login first, then complete your profile, pricing, and collaboration details inside the dashboard.</p>
                        </div>

                        <div className="glass-card" style={{ borderRadius: '30px', padding: '34px' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#667085', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                        <input
                                            type="email"
                                            style={{ ...inputStyle, paddingLeft: '42px' }}
                                            placeholder="you@email.com"
                                            value={form.email}
                                            onChange={(e) => set('email', e.target.value)}
                                            onFocus={(e) => { e.target.style.borderColor = 'rgba(86,113,123,0.45)'; e.target.style.boxShadow = '0 0 0 4px rgba(86,113,123,0.08)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.24)'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#667085', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '42px' }}
                                            placeholder="Minimum 6 characters"
                                            value={form.password}
                                            onChange={(e) => set('password', e.target.value)}
                                            onFocus={(e) => { e.target.style.borderColor = 'rgba(86,113,123,0.45)'; e.target.style.boxShadow = '0 0 0 4px rgba(86,113,123,0.08)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.24)'; e.target.style.boxShadow = 'none'; }}
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ borderRadius: '18px', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.16)', padding: '18px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTerms(!showTerms)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#0f4c81', fontSize: '13px', fontWeight: 700, padding: 0 }}
                                    >
                                        <span>Terms & Conditions</span>
                                        <ChevronDown size={14} style={{ transform: showTerms ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} />
                                    </button>

                                    <AnimatePresence>
                                        {showTerms && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                                <div style={{ marginTop: '12px', maxHeight: '220px', overflowY: 'auto', fontSize: '12px', color: '#5f6b7d', lineHeight: 1.7, whiteSpace: 'pre-line', paddingRight: '8px' }}>
                                                    {TERMS_TEXT}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '14px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={form.termsAccepted}
                                            onChange={(e) => set('termsAccepted', e.target.checked)}
                                            style={{ width: '16px', height: '16px', accentColor: '#0ea5e9', cursor: 'pointer', marginTop: '2px' }}
                                        />
                                        <span style={{ fontSize: '13px', color: '#475467', fontWeight: 500, lineHeight: 1.6 }}>
                                            I agree to the terms and conditions for collaborations on Porchest.
                                        </span>
                                    </label>
                                </div>

                                <GlowButton type="submit" fullWidth loading={loading} size="lg" style={{ background: 'linear-gradient(135deg, #0ea5e9, #7B2FF7)', marginTop: '4px' }}>
                                    Create Influencer Account
                                </GlowButton>

                                <div style={{ position: 'relative', margin: '8px 0 2px', textAlign: 'center' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(148,163,184,0.22)' }} />
                                    <span style={{ position: 'relative', background: '#fffdf8', padding: '0 10px', fontSize: '12px', color: '#7a8798' }}>or sign up with</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google registration failed')} useOneTap />
                                </div>
                            </form>
                        </div>

                        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px', color: '#667085' }}>
                            <Link href="/signup" style={{ color: '#667085', textDecoration: 'none' }}>Choose another role</Link>
                            {' · '}
                            <Link href="/login" style={{ color: '#9b6f50', textDecoration: 'none', fontWeight: 700 }}>Already have an account?</Link>
                        </p>
                    </>
                )}
            </motion.div>
        </main>
    );
}
