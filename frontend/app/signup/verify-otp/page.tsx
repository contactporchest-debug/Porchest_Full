'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mail, RotateCcw } from 'lucide-react';

export default function VerifyOTPPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithToken } = useAuth();

    const email = searchParams.get('email') || '';
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) router.replace('/signup');
    }, [email, router]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const handleDigit = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);
        if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (text.length === 6) {
            setDigits(text.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otp = digits.join('');
        if (otp.length < 6) return toast.error('Enter the full 6-digit code');
        setLoading(true);
        try {
            const { data } = await authAPI.verifyOtp({ email, otp });
            if (data.success) {
                loginWithToken(data.token, data.user);
                toast.success('Email verified! Welcome to Porchest.');
                const role = data.user.role;
                router.push(role === 'brand' ? '/dashboard/brand' : '/dashboard/influencer/profile');
            }
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setResending(true);
        try {
            await authAPI.resendOtp({ email });
            toast.success('New code sent! Check your inbox.');
            setCooldown(60);
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    const boxStyle: React.CSSProperties = {
        width: '52px', height: '60px', borderRadius: '14px', textAlign: 'center',
        fontSize: '24px', fontWeight: '700', fontFamily: 'monospace',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
        color: '#fff', outline: 'none', transition: 'border-color 200ms ease, box-shadow 200ms ease',
        caretColor: '#9d4dff',
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', background: '#000' }}>
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 0%, rgba(123,47,247,0.12) 0%, transparent 60%)' }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', background: 'linear-gradient(135deg, #7B2FF7, #9d4dff)', boxShadow: '0 0 20px rgba(123,47,247,0.5)', color: '#fff' }}>P</div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px' }}>
                            <span style={{ color: '#fff' }}>Por</span>
                            <span style={{ background: 'linear-gradient(135deg, #7B2FF7, #be8bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chest</span>
                        </span>
                    </Link>

                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(123,47,247,0.15)', border: '1px solid rgba(123,47,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(123,47,247,0.2)' }}>
                        <Mail size={24} color="#9d4dff" />
                    </div>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Check your email</h1>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>
                        We sent a 6-digit code to<br />
                        <span style={{ color: '#9d4dff', fontWeight: '600' }}>{email}</span>
                    </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} onPaste={handlePaste}>
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={(e) => handleDigit(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    style={boxStyle}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'rgba(123,63,242,0.7)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(123,63,242,0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = d ? 'rgba(123,63,242,0.5)' : 'rgba(255,255,255,0.12)';
                                        e.target.style.boxShadow = '';
                                    }}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <GlowButton type="submit" fullWidth loading={loading} size="lg">
                            Verify & Continue
                        </GlowButton>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button
                            onClick={handleResend}
                            disabled={cooldown > 0 || resending}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer',
                                fontSize: '13px', fontWeight: '600',
                                color: cooldown > 0 ? 'rgba(255,255,255,0.25)' : '#9d4dff',
                                padding: '8px 12px', borderRadius: '8px',
                                transition: 'color 200ms ease',
                            }}
                        >
                            <RotateCcw size={13} />
                            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
                        </button>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                    <Link href="/signup" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Back to signup</Link>
                    {' · '}
                    <Link href="/login" style={{ color: '#9d4dff', textDecoration: 'none' }}>Sign in</Link>
                </p>
            </motion.div>
        </main>
    );
}
