'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { softwareClientAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Briefcase, Activity, Calendar, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
    clientProfile: {
        fullName: string;
        companyName: string;
        roleTitle: string;
        avatarUrl: string;
        industry: string;
        teamSize: string;
        companyStage: string;
    };
    overview: {
        projectName: string;
        currentStatus: string;
        simpleDescription: string;
        deadline: string;
        nextProjectProposal: string;
        currentPhase: string;
        completionPercent: number;
    };
    activeProject: {
        name: string;
        status: string;
        phase: string;
        progress: number;
    } | null;
    totals: {
        totalProjects: number;
        completedMilestones: number;
        remainingMilestones: number;
        totalRequirements: number;
    };
}

export default function SoftwareClientDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await softwareClientAPI.getDashboard();
            setData(response.data.dashboard);
        } catch (error) {
            toast.error('Failed to load dashboard data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['software-client']}>
                <DashboardLayout>
                    <div className="flex min-h-[60vh] items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-blue-400" />
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (!data) return null;

    const StatCard = ({ label, value, sub, color, icon, progress }: any) => (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A30] bg-[#202025]" style={{ color }}>
                {icon}
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <p className="mt-2 text-sm text-gray-400">{label}</p>
            {sub && <p className="mt-1 text-xs" style={{ color }}>{sub}</p>}
            {progress != null && (
                <div className="mt-4 h-2 rounded-full bg-[#202025]">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, progress)}%`, background: color }} />
                </div>
            )}
        </motion.div>
    );

    return (
        <ProtectedRoute allowedRoles={['software-client']}>
            <DashboardLayout>
                <div className="mx-auto flex max-w-7xl flex-col gap-8">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Software client dashboard</p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Welcome, {data.clientProfile.fullName}</h1>
                            <p className="mt-2 text-sm text-gray-400">Here is the latest overview of {data.clientProfile.companyName}'s digital product development.</p>
                        </div>
                        <Link href="mailto:hello@porchest.com?subject=New Project Proposal" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
                            <Briefcase size={16} /> Propose New Project
                        </Link>
                    </motion.div>

                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Overall Completion" value={`${data.overview.completionPercent}%`} color="#60a5fa" icon={<Activity size={18} />} progress={data.overview.completionPercent} sub="For active project phase" />
                        <StatCard label="Total Projects" value={data.totals.totalProjects} color="#60a5fa" icon={<LayoutDashboard size={18} />} />
                        <StatCard label="Completed Milestones" value={data.totals.completedMilestones} color="#34d399" icon={<Briefcase size={18} />} sub={`${data.totals.remainingMilestones} remaining`} />
                        <StatCard label="Current Phase" value={data.overview.currentPhase} color="#fbbf24" icon={<Activity size={18} />} />
                    </div>

                    <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6">
                        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                            <Calendar size={18} className="text-blue-300" />
                            Active Project Snapshot
                        </h2>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{data.overview.projectName}</h3>
                                <p className="mt-3 text-sm leading-7 text-gray-400">{data.overview.simpleDescription}</p>
                                <div className="mt-6 flex flex-wrap gap-5 text-sm">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</p>
                                        <p className="mt-1 font-medium text-white">{data.overview.currentStatus}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Deadline</p>
                                        <p className="mt-1 flex items-center gap-2 font-medium text-white">
                                            <Calendar size={14} className="text-blue-300" />
                                            {new Date(data.overview.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-5">
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Next Proposed Project</p>
                                <p className="mt-3 text-base font-semibold text-white">{data.overview.nextProjectProposal}</p>
                                <Link href="/dashboard/software-client/projects" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200">
                                    View full project details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
