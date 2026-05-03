'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import OTPVerify from '@/components/auth/OTPVerify';
import { GoogleLogin } from '@react-oauth/google';

const IS: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.40)', border: '1px solid #EDD9BC',
    borderRadius: '8px', padding: '11px 14px', fontSize: '14px', color: '#1A0A00',
    outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s',
};

export default function BrandSignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });
    const [showOTP, setShowOTP] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const onVerifySuccess = async () => { toast.success('Welcome to Porchest!'); router.push('/dashboard/brand'); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast.error('Please fill all required fields');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            await authAPI.register({ email: form.email, password: form.password, role: 'brand' });
            setRegisteredEmail(form.email); setShowOTP(true);
            toast.success('Account created! Please verify your email.');
        } catch (err: unknown) {
            toast.error((err as any)?.response?.data?.message || 'Registration failed');
        } finally { setLoading(false); }
    };
    const handleGoogleSuccess = async (credentialResponse: any) => {
        const idToken = credentialResponse.credential;
        if (!idToken) return toast.error('Google signup did not return a valid credential.');
        try {
            setLoading(true);
            const { data } = await authAPI.googleAuth({ idToken, role: 'brand' });
            if (data.success) { localStorage.setItem('porchest_token', data.token); localStorage.setItem('porchest_user', JSON.stringify(data.user)); window.location.href = '/dashboard/brand'; }
            else toast.error(data.message || 'Google Auth failed');
        } catch (err: any) { toast.error(err?.response?.data?.message || err?.message || 'Google auth error'); }
        finally { setLoading(false); }
    };

    return (
        <main style={{ minHeight: '100vh', background: '#FDF6EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '920px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
                {showOTP ? (
                    <div style={{ padding: '40px' }}><OTPVerify email={registeredEmail} onSuccess={onVerifySuccess} /></div>
                ) : (
                    <div style={{ display: 'grid' }} className="lg:grid-cols-[0.95fr_1.05fr]">
                        {/* Left */}
                        <div style={{ padding: '40px', borderRight: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)' }}>
                            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}>
                                <Image src="/porchest-logo.png" alt="Porchest" width={28} height={28} style={{ borderRadius: '5px', objectFit: 'contain' }} />
                                <span style={{ fontSize: '16px', fontWeight: 600, color: '#1A0A00' }}>Porchest</span>
                            </Link>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, marginBottom: '20px' }}>
                                <Building2 size={12} /> Brand account
                            </span>
                            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '10px' }}>Create your brand account</h1>
                            <p style={{ fontSize: '14px', color: '#7A5030', lineHeight: 1.65 }}>Start with secure login details. You can finish your profile after signup.</p>
                        </div>

                        {/* Right: form */}
                        <div style={{ padding: '40px' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#7A5030', letterSpacing: '0.03em', marginBottom: '6px' }}>Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', pointerEvents: 'none' }} />
                                        <input style={{ ...IS, paddingLeft: '40px' }} type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#7A5030', letterSpacing: '0.03em', marginBottom: '6px' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', pointerEvents: 'none' }} />
                                        <input style={{ ...IS, paddingLeft: '40px', paddingRight: '40px' }} type={showPass ? 'text' : 'password'} placeholder="Minimum 6 characters" value={form.password} onChange={e => set('password', e.target.value)} onFocus={e => (e.target.style.borderColor = '#C2340A')} onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                                        <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: loading ? 'rgba(194,52,10,0.40)' : '#C2340A', color: '#fff', fontSize: '13px', fontWeight: 500, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.01em', fontFamily: 'inherit' }}>
                                    {loading ? 'Creating account…' : 'Create Brand Account'}
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ flex: 1, height: '1px', background: '#EDD9BC' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.10em' }}>or sign up with</span>
                                    <div style={{ flex: 1, height: '1px', background: '#EDD9BC' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google registration failed')} useOneTap />
                                </div>
                            </form>
                            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#7A5030' }}>
                                Already have an account? <Link href="/login" style={{ color: '#C2340A', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>
        </main>
    );
}
