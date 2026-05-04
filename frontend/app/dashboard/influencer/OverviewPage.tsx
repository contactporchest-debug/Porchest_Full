'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
    totalRequests: number;
    totalAccepted: number;
    totalRejected: number;
    totalCompleted: number;
    profile: Record<string, unknown>;
}

interface Props {
    stats: DashboardStats | null;
}

export default function OverviewPage({ stats }: Props) {
    const { user } = useAuth();
    const cards = [
        { label: 'Total Requests Received', value: stats?.totalRequests ?? '—', tone: 'text-blue-300' },
        { label: 'Total Accepted', value: stats?.totalAccepted ?? '—', tone: 'text-emerald-300' },
        { label: 'Total Rejected', value: stats?.totalRejected ?? '—', tone: 'text-red-300' },
        { label: 'Total Completed', value: stats?.totalCompleted ?? '—', tone: 'text-violet-300' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-[#7A5030]">Collaboration Overview</h3>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card, index) => (
                        <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-6 backdrop-blur-[12px]">
                            <p className={`text-3xl font-bold ${card.tone}`}>{card.value}</p>
                            <p className="mt-2 text-sm text-[#7A5030]">{card.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
