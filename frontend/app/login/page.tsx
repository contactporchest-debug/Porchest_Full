'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { resolveDashboardRole } from '@/lib/accessRoles';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Building2, Star, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.40)',
    border: '1px solid #EDD9BC',
    borderRadius: '8px',
    padding: '11px 14px',
    fontSize: '14px',
    color: '#1A0A00',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s',
};

export default function LoginPage() {
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading]           = useState(false);
    const [loginError, setLoginError]     = useState('');
    const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
    const [showRolePicker, setShowRolePicker]         = useState(false);
    const [roleSubmitting, setRoleSubmitting]         = useState<'brand' | 'influencer' | null>(null);
    const { login } = useAuth();
    const router = useRouter();

    const goToDashboard = (role?: string) => router.push(`/dashboard/${resolveDashboardRole(role)}`);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        if (!email || !password) return toast.error('Enter email and password');
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) { toast.success('Signed in'); goToDashboard(result.role); }
        } catch (err: unknown) {
            const msg = (err as Error).message || 'Login failed';
            setLoginError(msg); toast.error(msg);
        } finally { setLoading(false); }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        const idToken = credentialResponse.credential;
        if (!idToken) return toast.error('Google login did not return a valid credential.');
        try {
            setLoading(true);
            const { data } = await authAPI.googleAuth({ idToken, role: null });
            if (data.success) {
                localStorage.setItem('porchest_token', data.token);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
                window.location.href = `/dashboard/${resolveDashboardRole(data.user?.role)}`;
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Google auth error';
            if (msg.includes('Role is required')) { setPendingGoogleToken(idToken); setShowRolePicker(true); toast('Choose how you want to use Porchest.'); }
            else toast.error(msg);
        } finally { setLoading(false); }
    };

    const handleGoogleRoleSelect = async (role: 'brand' | 'influencer') => {
        if (!pendingGoogleToken) { toast.error('Session expired. Try again.'); setShowRolePicker(false); return; }
        try {
            setRoleSubmitting(role);
            const { data } = await authAPI.googleAuth({ idToken: pendingGoogleToken, role });
            if (!data.success) return toast.error(data.message || 'Failed');
            localStorage.setItem('porchest_token', data.token);
            localStorage.setItem('porchest_user', JSON.stringify(data.user));
            setShowRolePicker(false); setPendingGoogleToken(null);
            toast.success(`Your ${role} account is ready!`);
            window.location.href = `/dashboard/${resolveDashboardRole(data.user?.role || role)}`;
        } catch (err: any) { toast.error(err?.response?.data?.message || err?.message || 'Failed'); }
        finally { setRoleSubmitting(null); }
    };

    return (
        <main style={{ minHeight: '100vh', background: '#FDF6EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '960px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', overflow: 'hidden', display: 'grid' }}
                className="lg:grid-cols-[0.95fr_1.05fr]"
            >
                {/* Left panel */}
                <div style={{ padding: '40px', borderRight: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '36px' }}>
                        <Image src="/porchest-logo.png" alt="Porchest" width={30} height={30} style={{ borderRadius: '6px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '17px', fontWeight: 600, color: '#1A0A00' }}>Porchest</span>
                    </Link>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '10px' }}>Sign in to your workspace</h1>
                    <p style={{ fontSize: '14px', color: '#7A5030', lineHeight: 1.65, maxWidth: '360px', marginBottom: '28px' }}>
                        Access dashboards, collaboration requests, analytics, and campaign tools in one clean interface.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {[
                            { label: 'Fast access', value: 'Campaign data' },
                            { label: 'Live metrics', value: 'Audience fit' },
                        ].map(item => (
                            <div key={item.label} style={{ padding: '16px', borderRadius: '10px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)' }}>
                                <p style={{ fontSize: '11px', fontWeight: 500, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{item.label}</p>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A0A00' }}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: form */}
                <div style={{ padding: '40px' }}>
                    <div style={{ marginBottom: '28px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '12px' }}>Welcome back</span>
                        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1A0A00', marginBottom: '6px' }}>Sign in</h2>
                        <p style={{ fontSize: '14px', color: '#7A5030' }}>Use your email or Google account to continue.</p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#7A5030', letterSpacing: '0.03em', marginBottom: '6px' }}>Email address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', pointerEvents: 'none' }} />
                                <input style={{ ...inputStyle, paddingLeft: '40px' }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                                    onFocus={e => (e.target.style.borderColor = '#C2340A')}
                                    onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#7A5030', letterSpacing: '0.03em', marginBottom: '6px' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', pointerEvents: 'none' }} />
                                <input style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '40px' }} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password"
                                    onFocus={e => (e.target.style.borderColor = '#C2340A')}
                                    onBlur={e => (e.target.style.borderColor = '#EDD9BC')} />
                                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {loginError && (
                            <div style={{ borderRadius: '8px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', fontSize: '13px', color: '#991b1b' }}>{loginError}</div>
                        )}

                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: loading ? 'rgba(194,52,10,0.40)' : '#C2340A', color: '#fff', fontSize: '13px', fontWeight: 500, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.01em', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, height: '1px', background: '#EDD9BC' }} />
                            <span style={{ fontSize: '11px', fontWeight: 500, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.10em' }}>or</span>
                            <div style={{ flex: 1, height: '1px', background: '#EDD9BC' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google login failed')} useOneTap />
                        </div>
                    </form>

                    <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#7A5030' }}>
                        No account?{' '}
                        <Link href="/signup" style={{ color: '#C2340A', fontWeight: 500, textDecoration: 'none' }}>Create one free</Link>
                    </p>
                </div>
            </motion.div>

            {/* Role picker modal */}
            {showRolePicker && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,10,0,0.40)', backdropFilter: 'blur(6px)', padding: '16px' }}>
                    <div style={{ width: '100%', maxWidth: '560px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(253,246,238,0.98)', backdropFilter: 'blur(16px)', padding: '36px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '12px' }}>New Google account</span>
                            <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1A0A00', marginBottom: '8px' }}>Choose your role</h2>
                            <p style={{ fontSize: '14px', color: '#7A5030' }}>Pick how you want to use Porchest.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { role: 'brand' as const, icon: Building2, title: 'Brand', desc: 'Find influencers and manage campaigns.' },
                                { role: 'influencer' as const, icon: Star, title: 'Influencer', desc: 'Get discovered and manage collaborations.' },
                            ].map(opt => (
                                <button key={opt.role} type="button" onClick={() => handleGoogleRoleSelect(opt.role)} disabled={!!roleSubmitting}
                                    style={{ padding: '20px', borderRadius: '10px', border: '1.5px solid #EDD9BC', background: 'rgba(255,255,255,0.60)', textAlign: 'left', cursor: roleSubmitting ? 'not-allowed' : 'pointer', opacity: roleSubmitting ? 0.6 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { if (!roleSubmitting) { (e.currentTarget as HTMLElement).style.borderColor = '#C2340A'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.90)'; } }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#EDD9BC'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.60)'; }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(194,52,10,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                        <opt.icon size={18} style={{ color: '#C2340A' }} />
                                    </div>
                                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A0A00', marginBottom: '6px' }}>{opt.title}</p>
                                    <p style={{ fontSize: '13px', color: '#7A5030', lineHeight: 1.65 }}>{opt.desc}</p>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '13px', fontWeight: 500, color: '#C2340A' }}>Continue <ArrowRight size={13} /></span>
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                            <button type="button" onClick={() => { setShowRolePicker(false); setPendingGoogleToken(null); }} style={{ fontSize: '13px', color: '#7A5030', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
