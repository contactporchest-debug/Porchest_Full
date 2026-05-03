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
        if (timer > 0) interval = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
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
        if (code.length !== 6) return toast.error('Please enter the 6-digit code');
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', { email, otp: code });
            if (res.data.success) {
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
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
                <GlassCard padding="32px" className="text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Verify email</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Enter the 6-digit code</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        We&apos;ve sent a code to <span className="font-medium text-white">{email}</span>. It expires in 10 minutes.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="grid grid-cols-6 gap-2">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`otp-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handleChange(e.target.value, idx)}
                                    onKeyDown={(e) => handleKeyDown(e, idx)}
                                    className="h-14 rounded-xl border border-[#2A2A30] bg-[#202025] text-center text-xl font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500"
                                    maxLength={1}
                                    autoFocus={idx === 0}
                                />
                            ))}
                        </div>

                        <GlowButton type="submit" fullWidth loading={loading} size="lg">
                            Verify Account
                        </GlowButton>

                        <div className="pt-2 text-center">
                            <p className="text-sm text-gray-400">
                                Didn&apos;t receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={timer > 0 || resending}
                                    className={`font-medium transition-colors ${timer > 0 ? 'cursor-not-allowed text-gray-600' : 'text-blue-400 hover:text-blue-300'}`}
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
