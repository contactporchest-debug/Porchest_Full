'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Camera, User, FileText, Tag, Globe, Users, BarChart3, DollarSign, Instagram, ArrowRight } from 'lucide-react';

interface CheckItem {
    key: string;
    label: string;
    done: boolean;
}

interface ProfileCompletionData {
    percentage: number;
    isComplete: boolean;
    checklist: CheckItem[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
    profilePhoto: <Camera size={14} />,
    displayName: <User size={14} />,
    bio: <FileText size={14} />,
    niche: <Tag size={14} />,
    country: <Globe size={14} />,
    followers: <Users size={14} />,
    engagement: <BarChart3 size={14} />,
    postPrice: <DollarSign size={14} />,
    reelPrice: <DollarSign size={14} />,
    instagram: <Instagram size={14} />,
};

export default function ProfileCompletionBanner({ completion }: { completion: ProfileCompletionData | null }) {
    const router = useRouter();
    if (!completion || completion.isComplete) return null;

    const { percentage, checklist } = completion;
    const pending = checklist.filter((c) => !c.done);
    const done = checklist.filter((c) => c.done);

    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 overflow-hidden rounded-xl border border-amber-400/20 bg-[#1A1A1E] p-6">
            <div className="absolute right-10 top-0 h-36 w-64 rounded-full bg-amber-400/5 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-[#2A2A30] bg-[#202025]">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{percentage}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400">complete</div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-300" />
                        <h3 className="text-lg font-semibold text-white">Complete your profile to get discovered</h3>
                    </div>
                    <p className="mb-5 max-w-2xl text-sm leading-7 text-gray-400">
                        Your profile will only appear in the Brand Portal after all required information is completed. Add your profile photo, bio, pricing, and connect your Instagram to start receiving brand requests.
                    </p>

                    <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {pending.map((item) => (
                            <div key={item.key} className="flex items-center gap-3 rounded-lg border border-amber-400/10 bg-amber-400/10 px-3 py-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-400/20 bg-[#202025] text-amber-300">
                                    {ICON_MAP[item.key] || <AlertTriangle size={12} />}
                                </div>
                                <span className="text-sm font-medium text-amber-300">{item.label}</span>
                            </div>
                        ))}
                        {done.map((item) => (
                            <div key={item.key} className="flex items-center gap-3 rounded-lg border border-[#2A2A30] bg-[#202025] px-3 py-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                                    <CheckCircle2 size={12} />
                                </div>
                                <span className="text-sm text-gray-400 line-through">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => router.push('/dashboard/influencer/profile')}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                        Complete profile <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
