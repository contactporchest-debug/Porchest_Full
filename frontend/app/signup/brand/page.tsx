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
    padding: '14px 16px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 300ms ease, box-shadow 300ms ease, background 300ms ease',
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
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#0c0c0c', position: 'relative', overflow: 'hidden' }}>
            <div className="neon-grid" />
            <div style={{ position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(123,63,242,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
                {showOTP ? (
                    <OTPVerify email={registeredEmail} onSuccess={onVerifySuccess} />
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '20px', textDecoration: 'none' }}>
                                <Image src="/porchest-logo.png" alt="Porchest" width={168} height={42} priority style={{ width: '168px', height: 'auto', filter: 'brightness(10)' }} />
                            </Link>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.2)', color: '#a78bfa' }}>
                                <Building2 size={14} />
                                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Brand Account</span>
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '28px', color: '#fff', letterSpacing: '-0.04em', marginBottom: '8px' }}>Create your brand account</h1>
                            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>Start with secure login details. You can finish your profile after signup.</p>
                        </div>

                        <div style={{ borderRadius: '20px', padding: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                        <input
                                            type="email"
                                            style={{ ...inputStyle, paddingLeft: '42px' }}
                                            placeholder="you@email.com"
                                            value={form.email}
                                            onChange={(e) => set('email', e.target.value)}
                                            onFocus={(e) => { e.target.style.borderColor = 'rgba(123,63,242,0.5)'; e.target.style.background = 'rgba(123,63,242,0.04)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '42px' }}
                                            placeholder="Minimum 6 characters"
                                            value={form.password}
                                            onChange={(e) => set('password', e.target.value)}
                                            onFocus={(e) => { e.target.style.borderColor = 'rgba(123,63,242,0.5)'; e.target.style.background = 'rgba(123,63,242,0.04)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <GlowButton type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '4px' }}>
                                    Create Brand Account
                                </GlowButton>

                                <div style={{ position: 'relative', margin: '8px 0 2px', textAlign: 'center' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    <span style={{ position: 'relative', background: '#0c0c0c', padding: '0 10px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or sign up with</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google registration failed')} useOneTap />
                                </div>
                            </form>
                        </div>

                        <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                            <Link href="/signup" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Choose another role</Link>
                            {' · '}
                            <Link href="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 700 }}>Already have an account?</Link>
                        </p>
                    </>
                )}
            </motion.div>
        </main>
    );
}
