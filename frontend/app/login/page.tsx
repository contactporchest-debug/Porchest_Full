'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Zap, Building2, Star, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const shellStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 20px',
    background: 'linear-gradient(180deg, #fcfaf4 0%, #f4efe4 100%)',
    position: 'relative',
    overflow: 'hidden',
};

const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '460px',
    padding: '38px',
    borderRadius: '32px',
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(148,163,184,0.20)',
    boxShadow: '0 28px 70px rgba(15,23,42,0.10), 0 10px 28px rgba(123,63,242,0.08)',
    backdropFilter: 'blur(18px)',
};

const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#5f6b7d',
    marginBottom: '8px',
    display: 'block',
};

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [roleSubmitting, setRoleSubmitting] = useState<'brand' | 'influencer' | null>(null);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return toast.error('Enter email and password');
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                toast.success('Welcome back!');
                router.push(`/dashboard/${result.role}`);
            }
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        const idToken = credentialResponse.credential;
        if (!idToken) {
            toast.error('Google login did not return a valid credential.');
            return;
        }
        try {
            setLoading(true);
            const { data } = await authAPI.googleAuth({ idToken, role: null });

            if (data.success) {
                localStorage.setItem('porchest_token', data.token);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
                window.location.href = data.user?.role ? `/dashboard/${data.user.role}` : '/dashboard/brand';
            }
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                (typeof err?.response?.data === 'string' ? err.response.data : null) ||
                err?.message ||
                'Google auth error';
            if (message.includes('Role is required')) {
                setPendingGoogleToken(idToken);
                setShowRolePicker(true);
                toast('Choose how you want to use Porchest to finish creating your account.', { icon: '🪄' });
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRoleSelect = async (role: 'brand' | 'influencer') => {
        if (!pendingGoogleToken) {
            toast.error('Your Google session expired. Please try Google sign in again.');
            setShowRolePicker(false);
            return;
        }

        try {
            setRoleSubmitting(role);
            const { data } = await authAPI.googleAuth({ idToken: pendingGoogleToken, role });
            if (!data.success) {
                toast.error(data.message || 'Google signup failed');
                return;
            }

            localStorage.setItem('porchest_token', data.token);
            localStorage.setItem('porchest_user', JSON.stringify(data.user));
            setShowRolePicker(false);
            setPendingGoogleToken(null);
            toast.success(`Your ${role} account is ready!`);
            window.location.href = `/dashboard/${data.user?.role || role}`;
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                (typeof err?.response?.data === 'string' ? err.response.data : null) ||
                err?.message ||
                'Google signup failed';
            toast.error(message);
        } finally {
            setRoleSubmitting(null);
        }
    };

    return (
        <main style={shellStyle}>
            <div className="neon-grid" />
            <div className="edge-glow" />
            <div style={{ position: 'absolute', top: '-120px', left: '-120px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,63,242,0.15) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', right: '-140px', bottom: '-140px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 72%)' }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '26px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '18px' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '15px', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '21px', boxShadow: '0 14px 28px rgba(123,63,242,0.24)' }}>P</div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '24px', color: '#172033', letterSpacing: '-0.03em' }}>
                            Por<span className="gradient-text">chest</span>
                        </span>
                    </Link>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '32px', color: '#172033', letterSpacing: '-0.04em', marginBottom: '8px' }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: '15px', color: '#6b7688', lineHeight: 1.6 }}>
                        Sign in to manage campaigns, requests, and your Porchest workspace.
                    </p>
                </div>

                <div style={cardStyle}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={labelStyle}>Email address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-dark"
                                    placeholder="you@example.com"
                                    style={{ paddingLeft: '44px' }}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-dark"
                                    placeholder="Your password"
                                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <GlowButton type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '6px' }}>
                            {!loading && <Zap size={15} />} Sign In
                        </GlowButton>

                        <div style={{ position: 'relative', margin: '8px 0 4px', textAlign: 'center' }}>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(148,163,184,0.22)' }} />
                            <span style={{ position: 'relative', background: '#fffdf8', padding: '0 12px', fontSize: '12px', color: '#7a8798' }}>or continue with</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google login failed')} useOneTap />
                        </div>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: '#6b7688' }}>
                    No account?{' '}
                    <Link href="/signup" style={{ color: '#7B3FF2', fontWeight: 700, textDecoration: 'none' }}>
                        Create one free
                    </Link>
                </p>
            </motion.div>

            {showRolePicker && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(248,250,252,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 20 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                        style={{ width: '100%', maxWidth: '560px', borderRadius: '30px', background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(148,163,184,0.20)', boxShadow: '0 28px 70px rgba(15,23,42,0.12)', padding: '34px' }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(123,63,242,0.08)', color: '#7B3FF2', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
                                New Google Account
                            </div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '28px', color: '#172033', letterSpacing: '-0.04em', marginBottom: '8px' }}>
                                Choose Your Role
                            </h2>
                            <p style={{ fontSize: '14px', color: '#667085', lineHeight: 1.65 }}>
                                Your Google account is verified. Pick how you want to use Porchest and we’ll create the right account instantly.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                            <button
                                type="button"
                                onClick={() => handleGoogleRoleSelect('brand')}
                                disabled={!!roleSubmitting}
                                style={{ textAlign: 'left', padding: '22px', borderRadius: '22px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid rgba(148,163,184,0.24)', cursor: roleSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                            >
                                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(123,63,242,0.10)', color: '#7B3FF2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                    <Building2 size={20} />
                                </div>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '18px', color: '#172033', marginBottom: '6px' }}>Brand</p>
                                <p style={{ fontSize: '13px', color: '#667085', lineHeight: 1.6, marginBottom: '14px' }}>
                                    Find influencers, send collaboration requests, and manage campaigns.
                                </p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#7B3FF2', fontSize: '13px', fontWeight: 700 }}>
                                    Continue as Brand <ArrowRight size={14} />
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleGoogleRoleSelect('influencer')}
                                disabled={!!roleSubmitting}
                                style={{ textAlign: 'left', padding: '22px', borderRadius: '22px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid rgba(148,163,184,0.24)', cursor: roleSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                            >
                                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(14,165,233,0.10)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                    <Star size={20} />
                                </div>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '18px', color: '#172033', marginBottom: '6px' }}>Influencer</p>
                                <p style={{ fontSize: '13px', color: '#667085', lineHeight: 1.6, marginBottom: '14px' }}>
                                    Build your profile, get discovered by brands, and manage paid collaborations.
                                </p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0ea5e9', fontSize: '13px', fontWeight: 700 }}>
                                    Continue as Influencer <ArrowRight size={14} />
                                </span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRolePicker(false);
                                    setPendingGoogleToken(null);
                                }}
                                disabled={!!roleSubmitting}
                                style={{ background: 'none', border: 'none', color: '#667085', fontSize: '13px', fontWeight: 600, cursor: roleSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                            >
                                Cancel
                            </button>
                            <p style={{ fontSize: '12px', color: '#7a8798' }}>
                                {roleSubmitting ? `Creating your ${roleSubmitting} account...` : 'You can complete the rest of your profile after this step.'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
