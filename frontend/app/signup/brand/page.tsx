'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import OTPVerify from '@/components/auth/OTPVerify';
import { GoogleLogin } from '@react-oauth/google';

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

export default function BrandSignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });
    const [showOTP, setShowOTP] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const onVerifySuccess = async () => {
        toast.success('Welcome to Porchest!');
        router.push('/dashboard/brand');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast.error('Please fill all required fields');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            await authAPI.register({ email: form.email, password: form.password, role: 'brand' });
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
            const { data } = await authAPI.googleAuth({ idToken, role: 'brand' });

            if (data.success) {
                localStorage.setItem('porchest_token', data.token);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
                window.location.href = '/dashboard/brand';
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
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'linear-gradient(180deg, #fcfaf4 0%, #f4efe4 100%)', position: 'relative', overflow: 'hidden' }}>
            <div className="neon-grid" />
            <div className="edge-glow" />
            <div style={{ position: 'absolute', top: '-140px', right: '-120px', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,63,242,0.14) 0%, transparent 70%)' }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
                {showOTP ? (
                    <OTPVerify email={registeredEmail} onSuccess={onVerifySuccess} />
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '18px', textDecoration: 'none' }}>
                                <Image src="/porchest-logo.png" alt="Porchest" width={168} height={42} priority style={{ width: '168px', height: 'auto' }} />
                            </Link>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(123,63,242,0.10)', color: '#7B3FF2' }}>
                                <Building2 size={14} />
                                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Brand Account</span>
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '30px', color: '#172033', letterSpacing: '-0.04em', marginBottom: '8px' }}>Create your brand account</h1>
                            <p style={{ fontSize: '15px', color: '#667085', lineHeight: 1.7 }}>Start with secure login details. You can finish your brand profile after signup.</p>
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
                                            onFocus={(e) => { e.target.style.borderColor = 'rgba(123,63,242,0.45)'; e.target.style.boxShadow = '0 0 0 4px rgba(123,63,242,0.08)'; }}
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
                                            onFocus={(e) => { e.target.style.borderColor = 'rgba(123,63,242,0.45)'; e.target.style.boxShadow = '0 0 0 4px rgba(123,63,242,0.08)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.24)'; e.target.style.boxShadow = 'none'; }}
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <GlowButton type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '4px' }}>
                                    Create Brand Account
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
                            <Link href="/login" style={{ color: '#7B3FF2', textDecoration: 'none', fontWeight: 700 }}>Already have an account?</Link>
                        </p>
                    </>
                )}
            </motion.div>
        </main>
    );
}
