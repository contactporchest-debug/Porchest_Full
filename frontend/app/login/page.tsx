'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
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
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, role: null }) // login doesn't need to pass a role, user will be prompted if new
            });
            const data = await res.json();
            
            if (data.success) {
                // Manually log the user in
                localStorage.setItem('porchest_token', data.token);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
                
                if (data.user && data.user.role) {
                    window.location.href = `/dashboard/${data.user.role}`;
                } else {
                    window.location.href = '/dashboard/brand'; // Default fallback
                }

            } else {
                toast.error(data.message || 'Google Auth failed');
                // if message indicates user is new, we redirect them to signup with token
                if(data.message && data.message.includes('Role is required')) {
                    toast.error('You do not have an account. Please sign up to choose a role.');
                    router.push('/signup');
                }
            }
        } catch (err: any) {
            toast.error(err.message || 'Google auth error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#050505', position: 'relative', overflow: 'hidden' }}>
            <div className="neon-grid" />
            <div className="edge-glow" />

            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '500px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(123,63,242,0.18) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '20px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', boxShadow: '0 0 30px rgba(123,63,242,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: '#fff' }}>P</div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em' }}>
                            Por<span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chest</span>
                        </span>
                    </Link>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '28px', color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Sign in to your account</p>
                </div>

                {/* Card */}
                <div className="glass-card" style={{ padding: '36px', borderRadius: '32px' }}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'block' }}>Email address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="input-dark" placeholder="you@example.com"
                                    style={{ paddingLeft: '44px' }} autoComplete="email" />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'block' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="input-dark" placeholder="Your password"
                                    style={{ paddingLeft: '44px', paddingRight: '44px' }} autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '0' }}>
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <GlowButton type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '4px' }}>
                            {!loading && <Zap size={15} />} Sign In
                        </GlowButton>

                        <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ position: 'relative', background: '#110c1f', padding: '0 10px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>or</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin 
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error('Google login failed')}
                                useOneTap
                            />
                        </div>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                    No account?{' '}
                    <Link href="/signup" style={{ color: '#a78bfa', fontWeight: '600', textDecoration: 'none' }}>Create one free →</Link>
                </p>
            </motion.div>
        </main>
    );
}
