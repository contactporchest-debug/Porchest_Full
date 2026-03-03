'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Shield, Building2, Star, Zap } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent, demoEmail?: string, demoPass?: string) => {
        e?.preventDefault();
        const loginEmail = demoEmail || email;
        const loginPassword = demoPass || password;
        if (!loginEmail || !loginPassword) return toast.error('Enter email and password');
        setLoading(true);
        try {
            const result = await login(loginEmail, loginPassword);
            if (result.success) {
                toast.success('Welcome back!');
                router.push(`/dashboard/${result.role}`);
            }
        } catch (err: unknown) {
            const e = err as Error & { needsVerification?: boolean; email?: string };
            if (e.needsVerification && e.email) {
                toast.error('Please verify your email first.');
                router.push(`/signup/verify-otp?email=${encodeURIComponent(e.email)}`);
            } else {
                toast.error(e.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const demoLogins = [
        { label: 'Login as Admin', email: 'admin@porchest.com', pass: 'Admin123!', icon: <Shield size={14} />, color: '#ff8c42' },
        { label: 'Login as Brand', email: 'brand@demo.com', pass: 'Brand123!', icon: <Building2 size={14} />, color: '#7B3FF2' },
        { label: 'Login as Influencer', email: 'influencer@demo.com', pass: 'Influencer123!', icon: <Star size={14} />, color: '#A855F7' },
    ];

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#050505', position: 'relative', overflow: 'hidden' }}>
            <div className="neon-grid" />
            <div className="edge-glow" />

            {/* Glow halo behind the card */}
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
                    </form>

                    {/* Demo divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', fontFamily: 'Space Grotesk' }}>DEMO ACCESS</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {demoLogins.map((d) => (
                            <button key={d.label} onClick={(e) => handleLogin(e as React.FormEvent, d.email, d.pass)}
                                disabled={loading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                                    padding: '12px 16px', borderRadius: '16px', cursor: 'pointer',
                                    background: `${d.color}0c`, border: `1px solid ${d.color}25`,
                                    color: 'rgba(255,255,255,0.75)', fontSize: '13.5px', fontWeight: '500',
                                    fontFamily: 'inherit', transition: 'all 200ms ease',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${d.color}18`; (e.currentTarget as HTMLElement).style.borderColor = `${d.color}50`; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${d.color}0c`; (e.currentTarget as HTMLElement).style.borderColor = `${d.color}25`; }}>
                                <span style={{ color: d.color }}>{d.icon}</span>
                                {d.label}
                                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>DEMO</span>
                            </button>
                        ))}
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                    No account?{' '}
                    <Link href="/signup" style={{ color: '#a78bfa', fontWeight: '600', textDecoration: 'none' }}>Create one free →</Link>
                </p>
            </motion.div>
        </main>
    );
}
