'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlowButton } from '../ui';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface OTPVerifyProps {
    email: string;
    onSuccess: (token: string, user: unknown) => void;
}

export default function OTPVerify({ email, onSuccess }: OTPVerifyProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) {
            toast.error('Please enter the 6-digit code');
            return;
        }
        setLoading(true);
        try {
            // Uses the pre-configured api instance (baseURL = /api on Vercel)
            const res = await api.post('/auth/verify-otp', { email, otp: code });
            if (res.data.success) {
                // Save token & user to localStorage so AuthContext picks them up
                if (res.data.token) {
                    localStorage.setItem('porchest_token', res.data.token);
                    localStorage.setItem('porchest_user', JSON.stringify(res.data.user));
                }
                toast.success('Email verified successfully!');
                onSuccess(res.data.token, res.data.user);
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setResending(true);
        try {
            await api.post('/auth/resend-otp', { email });
            toast.success('New code sent to your email');
            setTimer(60);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full mx-auto"
            >
                <GlassCard padding="40px" className="text-center">
                    <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Verify Email</h2>
                    <p className="text-sm text-white/50 mb-8">
                        We&apos;ve sent a 6-digit code to <span className="text-white/80 font-medium">{email}</span>.
                        It expires in 10 minutes.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`otp-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handleChange(e.target.value, idx)}
                                    onKeyDown={(e) => handleKeyDown(e, idx)}
                                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-purple-500 focus:outline-none transition-all"
                                    maxLength={1}
                                    autoFocus={idx === 0}
                                />
                            ))}
                        </div>

                        <GlowButton type="submit" fullWidth loading={loading}>
                            Verify Account
                        </GlowButton>

                        <div className="pt-4">
                            <p className="text-sm text-white/40">
                                Didn&apos;t receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={timer > 0 || resending}
                                    className={`font-medium transition-colors ${timer > 0 ? 'text-white/20 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300'}`}
                                >
                                    {resending ? 'Sending…' : timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                                </button>
                            </p>
                        </div>
                    </form>
                </GlassCard>
            </motion.div>
        </AnimatePresence>
    );
}
