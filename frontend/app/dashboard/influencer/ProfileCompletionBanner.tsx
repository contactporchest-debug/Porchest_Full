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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-6 backdrop-blur-[12px]">
            <div className="absolute right-10 top-0 h-36 w-64 rounded-full bg-[#C2340A]/5 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.55)]">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[#1A0A00]">{percentage}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-[#7A5030]">complete</div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-[#C2340A]" />
                        <h3 className="text-lg font-semibold text-[#1A0A00]">Complete your profile to get discovered</h3>
                    </div>
                    <p className="mb-5 max-w-2xl text-sm leading-7 text-[#7A5030]">
                        Your profile will only appear in the Brand Portal after all required information is completed. Add your profile photo, bio, pricing, and connect your Instagram to start receiving brand requests.
                    </p>

                    <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {pending.map((item) => (
                            <div key={item.key} className="flex items-center gap-3 rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.45)] px-3 py-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.65)] text-[#C2340A]">
                                    {ICON_MAP[item.key] || <AlertTriangle size={12} />}
                                </div>
                                <span className="text-sm font-medium text-[#C2340A]">{item.label}</span>
                            </div>
                        ))}
                        {done.map((item) => (
                            <div key={item.key} className="flex items-center gap-3 rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.45)] px-3 py-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#EDD9BC] bg-[rgba(255,255,255,0.65)] text-[#059669]">
                                    <CheckCircle2 size={12} />
                                </div>
                                <span className="text-sm text-[#7A5030] line-through">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => router.push('/dashboard/influencer/profile')}
                        className="inline-flex items-center gap-2 rounded-full bg-[#C2340A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E8400A]"
                    >
                        Complete profile <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
