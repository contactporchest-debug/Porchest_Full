'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '@/lib/api';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Star, Mail, Lock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import OTPVerify from '@/components/auth/OTPVerify';
import { GoogleLogin } from '@react-oauth/google';

const TERMS_TEXT = `Welcome to Porchest — the influencer-brand collaboration platform.

By creating an account, you agree to the following:

1. Authenticity: You confirm that you are a real content creator with genuine followers and engagement.
2. Data Usage: Porchest may store your profile data and Instagram metrics to match you with relevant campaigns.
3. Campaign Conduct: Accepted collaborations should be delivered within the agreed timeline.
4. Pricing Accuracy: Your listed rates should reflect your genuine market pricing.
5. Intellectual Property: Sponsored content must be original or properly licensed.
6. Platform Rules: Fraudulent behavior can result in suspension or removal.
7. Modifications: Continued use after updates means you accept revised terms.`;

const inputClass = 'w-full rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500';

export default function InfluencerSignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', termsAccepted: false });
    const [showOTP, setShowOTP] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

    const onVerifySuccess = async () => {
        toast.success('Welcome to Porchest! Complete your profile next.');
        router.push('/dashboard/influencer/profile');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast.error('Please fill all required fields');
        if (!form.termsAccepted) return toast.error('You must accept the Terms & Conditions');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            await authAPI.register({ email: form.email, password: form.password, role: 'influencer', termsAccepted: true });
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
        if (!idToken) return toast.error('Google signup did not return a valid credential.');
        try {
            setLoading(true);
            const { data } = await authAPI.googleAuth({ idToken, role: 'influencer' });
            if (data.success) {
                localStorage.setItem('porchest_token', data.token);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
                window.location.href = '/dashboard/influencer';
            } else {
                toast.error(data.message || 'Google Auth failed');
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Google auth error';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full overflow-hidden rounded-2xl border border-[#2A2A30] bg-[#1A1A1E]">
                    {showOTP ? (
                        <div className="p-6 md:p-8">
                            <OTPVerify email={registeredEmail} onSuccess={onVerifySuccess} />
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                            <div className="border-b border-[#2A2A30] bg-[#202025] p-8 lg:border-b-0 lg:border-r">
                                <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-[#2A2A30] bg-[#1A1A1E] px-4 py-2">
                                    <Image src="/logo.png" alt="Porchest" width={26} height={26} className="rounded-md" />
                                    <span className="text-sm font-semibold tracking-wide">PORCHEST</span>
                                </Link>
                                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">
                                    <Star size={14} />
                                    Influencer account
                                </div>
                                <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">Join as an influencer</h1>
                                <p className="mt-3 text-sm leading-7 text-gray-400">Create your login first, then complete your profile inside the dashboard.</p>
                            </div>

                            <div className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Email</label>
                                        <div className="relative">
                                            <Mail size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input className={`${inputClass} pl-11`} type="email" placeholder="you@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Password</label>
                                        <div className="relative">
                                            <Lock size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input className={`${inputClass} pl-11 pr-11`} type={showPass ? 'text' : 'password'} placeholder="Minimum 6 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                                        <button type="button" onClick={() => setShowTerms(!showTerms)} className="flex w-full items-center justify-between text-left text-sm font-semibold text-blue-300">
                                            <span>Terms & Conditions</span>
                                            <ChevronDown size={14} className={`transition-transform ${showTerms ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {showTerms && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                    <div className="mt-4 max-h-56 overflow-y-auto whitespace-pre-line text-sm leading-7 text-gray-400">
                                                        {TERMS_TEXT}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <label className="mt-4 flex items-start gap-3">
                                            <input type="checkbox" checked={form.termsAccepted} onChange={(e) => set('termsAccepted', e.target.checked)} className="mt-1 h-4 w-4 rounded border-[#2A2A30] bg-[#1A1A1E] text-blue-500 focus:ring-blue-500" />
                                            <span className="text-sm leading-6 text-gray-400">I agree to the terms and conditions for collaborations on Porchest.</span>
                                        </label>
                                    </div>

                                    <GlowButton type="submit" fullWidth loading={loading} size="lg">
                                        Create Influencer Account
                                    </GlowButton>

                                    <div className="flex items-center gap-3 py-2">
                                        <div className="h-px flex-1 bg-[#2A2A30]" />
                                        <span className="text-[11px] uppercase tracking-[0.14em] text-gray-500">or sign up with</span>
                                        <div className="h-px flex-1 bg-[#2A2A30]" />
                                    </div>

                                    <div className="flex justify-center">
                                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google registration failed')} useOneTap />
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </main>
    );
}
