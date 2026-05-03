'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Megaphone, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function OverviewPage({ profileCompleteOverride }: { profileCompleteOverride?: boolean } = {}) {
    const router = useRouter();
    const { user, token, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [profileComplete, setProfileComplete] = useState<boolean>(profileCompleteOverride ?? true);
    const [loading, setLoading] = useState(true);
    const showInternalProfilePrompt = profileCompleteOverride === undefined ? !profileComplete : false;

    useEffect(() => {
        if (authLoading || user?.role !== 'brand' || !token) return;
        setLoading(true);
        Promise.all([brandAPI.getRequests(), brandAPI.getDashboard()])
            .then(([reqRes, dashRes]) => {
                setRequests(reqRes.data.requests || []);
                if (profileCompleteOverride === undefined) {
                    setProfileComplete(!!dashRes.data.dashboard.profileComplete);
                }
            })
            .catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, [authLoading, token, user?.role, profileCompleteOverride]);

    const pending = requests.filter((r) => ['sent', 'viewed', 'negotiation'].includes(r.status));
    const accepted = requests.filter((r) => r.status === 'accepted');
    const completed = requests.filter((r) => r.status === 'deal_closed');
    const rejected = requests.filter((r) => ['rejected', 'cancelled'].includes(r.status));
    const totalAllocated = accepted.reduce((sum, r) => sum + (r.agreedPrice || 0), 0);

    if (authLoading || loading) {
        return <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6 text-sm text-gray-400">Loading brand dashboard...</div>;
    }

    const statCards = [
        { label: 'Running', value: accepted.length, tone: 'text-emerald-300', icon: Megaphone },
        { label: 'In Process', value: pending.length, tone: 'text-blue-300', icon: Clock },
        { label: 'Completed', value: completed.length, tone: 'text-violet-300', icon: CheckCircle2 },
        { label: 'Canceled', value: rejected.length, tone: 'text-red-300', icon: XCircle },
    ];

    const runningPreview = [...accepted, ...completed].slice(0, 5);

    return (
        <div className="space-y-6">
            {showInternalProfilePrompt && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/20 bg-[#202025] text-amber-300">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-amber-200/80">Action required</p>
                                <h2 className="mt-1 text-xl font-semibold text-white">Complete your brand profile first</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-300">
                                    You need a complete brand profile before you can browse influencers. Finish your business, audience, and campaign preferences in the profile page.
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/brand/profile" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
                            Complete profile <ArrowRight size={15} />
                        </Link>
                    </div>
                </motion.div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6">
                        <card.icon className={`mb-4 ${card.tone}`} size={18} />
                        <p className={`text-3xl font-bold ${card.tone}`}>{card.value}</p>
                        <p className="mt-2 text-sm text-gray-400">{card.label} campaigns</p>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">Budget summary</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">Campaign spend</h3>
                    </div>
                    <button onClick={() => router.push('/dashboard/brand/collaborations')} className="text-sm font-medium text-blue-300 hover:text-blue-200">
                        View all
                    </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-[#2A2A30] bg-[#202025] p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-400">Total committed</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{totalAllocated > 0 ? `$${totalAllocated.toLocaleString()}` : '—'}</p>
                    </div>
                    <div className="rounded-lg border border-[#2A2A30] bg-[#202025] p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-400">Active collaborations</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{accepted.length}</p>
                    </div>
                    <div className="rounded-lg border border-[#2A2A30] bg-[#202025] p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-400">Pending decisions</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{pending.length}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">Active campaigns</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">Running collaboration snapshot</h3>
                    </div>
                    <button onClick={() => router.push('/dashboard/brand/influencers')} className="text-sm font-medium text-blue-300 hover:text-blue-200">
                        Find creators
                    </button>
                </div>

                {runningPreview.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#2A2A30] bg-[#202025] p-10 text-center">
                        <FileText size={36} className="mx-auto mb-3 text-gray-500" />
                        <p className="text-sm font-medium text-white">No campaigns yet</p>
                        <p className="mt-2 text-sm text-gray-400">Create your first campaign request from the influencers page.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {runningPreview.map((r: any) => (
                            <div key={r._id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#2A2A30] bg-[#202025] px-4 py-3">
                                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#2A2A30] bg-[#1A1A1E] text-xs font-bold text-white">
                                    {r.influencerProfilePic ? <img src={r.influencerProfilePic} alt="" className="h-full w-full object-cover" /> : 'PR'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">{r.campaignTitle}</p>
                                    <p className="truncate text-xs text-gray-400">{r.influencerName || 'Influencer'}</p>
                                </div>
                                <span className="rounded-full border border-[#2A2A30] bg-[#1A1A1E] px-3 py-1 text-[11px] font-semibold text-gray-300">
                                    {r.status === 'deal_closed' ? 'Completed' : 'Running'}
                                </span>
                                <p className="text-sm font-semibold text-blue-300">${r.agreedPrice?.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
