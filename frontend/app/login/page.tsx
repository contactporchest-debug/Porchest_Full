'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { resolveDashboardRole } from '@/lib/accessRoles';
import { GlowButton } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Building2, Star, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const inputClass = 'w-full rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500';

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
            if (result.success) {
                toast.success('Signed in');
                goToDashboard(result.role);
            }
        } catch (err: unknown) {
            const message = (err as Error).message || 'Login failed';
            setLoginError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
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
            const message = err?.response?.data?.message || err?.message || 'Google auth error';
            if (message.includes('Role is required')) {
                setPendingGoogleToken(idToken);
                setShowRolePicker(true);
                toast('Choose how you want to use Porchest.');
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRoleSelect = async (role: 'brand' | 'influencer') => {
        if (!pendingGoogleToken) {
            toast.error('Session expired. Try again.');
            setShowRolePicker(false);
            return;
        }
        try {
            setRoleSubmitting(role);
            const { data } = await authAPI.googleAuth({ idToken: pendingGoogleToken, role });
            if (!data.success) return toast.error(data.message || 'Failed');
            localStorage.setItem('porchest_token', data.token);
            localStorage.setItem('porchest_user', JSON.stringify(data.user));
            setShowRolePicker(false);
            setPendingGoogleToken(null);
            toast.success(`Your ${role} account is ready!`);
            window.location.href = `/dashboard/${resolveDashboardRole(data.user?.role || role)}`;
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed');
        } finally {
            setRoleSubmitting(null);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid w-full gap-0 overflow-hidden rounded-2xl border border-[#2A2A30] bg-[#1A1A1E] lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="border-b border-[#2A2A30] bg-[#202025] p-8 lg:border-b-0 lg:border-r">
                        <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-[#2A2A30] bg-[#1A1A1E] px-4 py-2">
                            <Image src="/logo.png" alt="Porchest" width={26} height={26} className="rounded-md" />
                            <span className="text-sm font-semibold tracking-wide">PORCHEST</span>
                        </Link>
                        <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">Sign in to your workspace</h1>
                        <p className="mt-3 max-w-md text-sm leading-7 text-gray-400">
                            Access dashboards, collaboration requests, analytics, and campaign tools in a cleaner dark interface.
                        </p>

                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-4">
                                <p className="text-xs uppercase tracking-wider text-gray-400">Fast access</p>
                                <p className="mt-2 text-lg font-semibold text-white">Campaign data</p>
                            </div>
                            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-4">
                                <p className="text-xs uppercase tracking-wider text-gray-400">Live metrics</p>
                                <p className="mt-2 text-lg font-semibold text-white">Audience fit</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-6">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Welcome back</p>
                            <h2 className="mt-2 text-2xl font-semibold text-white">Sign in</h2>
                            <p className="mt-2 text-sm text-gray-400">Use your email or Google account to continue.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Email address</label>
                                <div className="relative">
                                    <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input className={`${inputClass} pl-11`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input className={`${inputClass} pl-11 pr-11`} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" />
                                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-white">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {loginError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loginError}</div>}

                            <GlowButton type="submit" fullWidth loading={loading} size="lg">
                                Sign in
                            </GlowButton>

                            <div className="flex items-center gap-3 py-2">
                                <div className="h-px flex-1 bg-[#2A2A30]" />
                                <span className="text-[11px] uppercase tracking-[0.14em] text-gray-500">or continue with</span>
                                <div className="h-px flex-1 bg-[#2A2A30]" />
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google login failed')} useOneTap />
                            </div>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-400">
                            No account?{' '}
                            <Link href="/signup" className="font-semibold text-blue-400 transition hover:text-blue-300">
                                Create one free
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {loading && (
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80">
                    <div className="rounded-2xl border border-[#2A2A30] bg-[#1A1A1E] p-6 text-center">
                        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-blue-600/15 text-blue-300 flex items-center justify-center">
                            <ArrowRight size={20} />
                        </div>
                        <p className="text-lg font-semibold text-white">Signing you in</p>
                        <p className="mt-1 text-sm text-gray-400">Preparing your Porchest workspace.</p>
                    </div>
                </div>
            )}

            {showRolePicker && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-[#2A2A30] bg-[#1A1A1E] p-6">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-4 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">
                                New Google account
                            </div>
                            <h2 className="text-2xl font-semibold text-white">Choose your role</h2>
                            <p className="mt-2 text-sm text-gray-400">Pick how you want to use Porchest.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { role: 'brand' as const, icon: Building2, title: 'Brand', desc: 'Find influencers and manage campaigns.', color: 'text-blue-300' },
                                { role: 'influencer' as const, icon: Star, title: 'Influencer', desc: 'Get discovered and manage collaborations.', color: 'text-emerald-300' },
                            ].map((opt) => (
                                <button key={opt.role} type="button" onClick={() => handleGoogleRoleSelect(opt.role)} disabled={!!roleSubmitting} className="rounded-xl border border-[#2A2A30] bg-[#202025] p-5 text-left transition hover:bg-[#2A2A30] disabled:cursor-not-allowed disabled:opacity-60">
                                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A30] bg-[#1A1A1E] ${opt.color}`}>
                                        <opt.icon size={18} />
                                    </div>
                                    <p className="text-lg font-semibold text-white">{opt.title}</p>
                                    <p className="mt-2 text-sm leading-7 text-gray-400">{opt.desc}</p>
                                    <span className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${opt.color}`}>
                                        Continue <ArrowRight size={14} />
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center justify-between text-sm">
                            <button type="button" onClick={() => { setShowRolePicker(false); setPendingGoogleToken(null); }} className="text-gray-500 transition hover:text-white">
                                Cancel
                            </button>
                            <p className="text-gray-500">{roleSubmitting ? `Creating ${roleSubmitting} account...` : 'Complete your profile after this step.'}</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
