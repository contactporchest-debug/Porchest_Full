'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { resolveDashboardRole } from '@/lib/accessRoles';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Zap, Building2, Star, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [roleSubmitting, setRoleSubmitting] = useState<'brand' | 'influencer' | null>(null);
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
            const message = (err as Error).message || 'Login failed';
            setLoginError(message); toast.error(message);
        } finally { setLoading(false); }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        const idToken = credentialResponse.credential;
        if (!idToken) { toast.error('Google login did not return a valid credential.'); return; }
        try {
            setLoading(true);
            const { data } = await authAPI.googleAuth({ idToken, role: null });
            if (data.success) {
                localStorage.setItem('porchest_token', data.token);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
                window.location.href = `/dashboard/${resolveDashboardRole(data.user?.role)}`;
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Google auth error';
            if (message.includes('Role is required')) {
                setPendingGoogleToken(idToken); setShowRolePicker(true);
                toast('Choose how you want to use Porchest.', { icon: '🪄' });
            } else { toast.error(message); }
        } finally { setLoading(false); }
    };

    const handleGoogleRoleSelect = async (role: 'brand' | 'influencer') => {
        if (!pendingGoogleToken) { toast.error('Session expired. Try again.'); setShowRolePicker(false); return; }
        try {
            setRoleSubmitting(role);
            const { data } = await authAPI.googleAuth({ idToken: pendingGoogleToken, role });
            if (!data.success) { toast.error(data.message || 'Failed'); return; }
            localStorage.setItem('porchest_token', data.token);
            localStorage.setItem('porchest_user', JSON.stringify(data.user));
            setShowRolePicker(false); setPendingGoogleToken(null);
            toast.success(`Your ${role} account is ready!`);
            window.location.href = `/dashboard/${resolveDashboardRole(data.user?.role || role)}`;
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed');
        } finally { setRoleSubmitting(null); }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
        transition: 'all 300ms ease',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
        marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em',
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', background: '#0c0c0c', position: 'relative', overflow: 'hidden' }}>
            <div className="neon-grid" />
            <div style={{ position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(123,63,242,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '20px' }}>
                        <Image src="/porchest-logo.png" alt="Porchest" width={168} height={42} priority style={{ width: '168px', height: 'auto', filter: 'brightness(10)' }} />
                    </Link>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                        Sign in to manage campaigns, requests, and your workspace.
                    </p>
                </div>

                <div style={{ padding: '32px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={labelStyle}>Email address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                                    style={inputStyle} onFocus={e => { e.target.style.borderColor = 'rgba(123,63,242,0.5)'; e.target.style.background = 'rgba(123,63,242,0.04)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password"
                                    style={{ ...inputStyle, paddingRight: '44px' }} onFocus={e => { e.target.style.borderColor = 'rgba(123,63,242,0.5)'; e.target.style.background = 'rgba(123,63,242,0.04)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0 }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {loginError && (
                            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', fontSize: '13px', fontWeight: 600 }}>
                                {loginError}
                            </div>
                        )}

                        <GlowButton type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '4px' }}>
                            {!loading && <Zap size={15} />} Sign In
                        </GlowButton>

                        <div style={{ position: 'relative', margin: '4px 0', textAlign: 'center' }}>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                            <span style={{ position: 'relative', background: '#0c0c0c', padding: '0 12px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or continue with</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google login failed')} useOneTap />
                        </div>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                    No account?{' '}
                    <Link href="/signup" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
                </p>
            </motion.div>

            {/* Loading overlay */}
            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,12,12,0.85)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15 }}>
                    <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        style={{ width: '100%', maxWidth: '340px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '32px', textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 0 40px rgba(123,63,242,0.3)' }}>
                            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                        </div>
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '8px' }}>Signing You In</p>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Preparing your Porchest workspace.</p>
                    </motion.div>
                </div>
            )}

            {/* Role picker overlay */}
            {showRolePicker && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,12,12,0.9)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 20 }}>
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        style={{ width: '100%', maxWidth: '520px', borderRadius: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '32px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '999px', background: 'rgba(123,63,242,0.12)', border: '1px solid rgba(123,63,242,0.2)', color: '#a78bfa', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>New Google Account</div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '26px', color: '#fff', marginBottom: '8px' }}>Choose Your Role</h2>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Pick how you want to use Porchest.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                            {[
                                { role: 'brand' as const, icon: <Building2 size={20} />, color: '#a78bfa', title: 'Brand', desc: 'Find influencers and manage campaigns.' },
                                { role: 'influencer' as const, icon: <Star size={20} />, color: '#60a5fa', title: 'Influencer', desc: 'Get discovered and manage collaborations.' },
                            ].map(opt => (
                                <button key={opt.role} type="button" onClick={() => handleGoogleRoleSelect(opt.role)} disabled={!!roleSubmitting}
                                    style={{ textAlign: 'left', padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: roleSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 300ms ease' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${opt.color}15`, color: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>{opt.icon}</div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '17px', color: '#fff', marginBottom: '6px' }}>{opt.title}</p>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: '14px' }}>{opt.desc}</p>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: opt.color, fontSize: '13px', fontWeight: 700 }}>
                                        Continue <ArrowRight size={14} />
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button type="button" onClick={() => { setShowRolePicker(false); setPendingGoogleToken(null); }} disabled={!!roleSubmitting}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                                {roleSubmitting ? `Creating ${roleSubmitting} account...` : 'Complete your profile after this step.'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
