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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (!data) return null;

    const StatCard = ({ label, value, sub, color, icon, progress }: any) => (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 22, padding: '22px 24px', position: 'relative', overflow: 'hidden', boxShadow: '0 18px 40px rgba(15,23,42,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 22px 0 80px', background: `${color}08` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                    {icon}
                </div>
            </div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color, letterSpacing: '-0.04em', filter: `drop-shadow(0 0 8px ${color}50)` }}>{value}</p>
            <p style={{ fontSize: 12, color: '#667085', marginTop: 4 }}>{label}</p>
            {sub && <p style={{ fontSize: 11, color, opacity: 0.65, marginTop: 3 }}>{sub}</p>}
            {progress != null && (
                <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: 'rgba(148,163,184,0.18)' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, progress)}%`, background: color, transition: 'width 700ms ease' }} />
                </div>
            )}
        </motion.div>
    );

    return (
        <ProtectedRoute allowedRoles={['software-client']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: 800, color: '#172033', letterSpacing: '-0.03em' }}>
                                Welcome, {data.clientProfile.fullName} 👋
                            </h1>
                            <p style={{ color: '#667085', marginTop: '6px', fontSize: '14px' }}>
                                Here is the latest overview of {data.clientProfile.companyName}'s digital product development.
                            </p>
                        </div>
                        <Link href="mailto:hello@porchest.com?subject=New Project Proposal" style={{ padding: '12px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 16px rgba(37,99,235,0.2)' }}>
                            <Briefcase size={16} /> Propose New Project
                        </Link>
                    </motion.div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                        <StatCard label="Overall Completion" value={`${data.overview.completionPercent}%`} color="#2563eb" icon={<Activity size={18} />} progress={data.overview.completionPercent} sub="For active project phase" />
                        <StatCard label="Total Projects" value={data.totals.totalProjects} color="#7B3FF2" icon={<LayoutDashboard size={18} />} />
                        <StatCard label="Completed Milestones" value={data.totals.completedMilestones} color="#4ade80" icon={<Briefcase size={18} />} sub={`${data.totals.remainingMilestones} remaining`} />
                        <StatCard label="Current Phase" value={data.overview.currentPhase} color="#f59e0b" icon={<Activity size={18} />} />
                    </div>

                    {/* Project Snapshot */}
                    <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, padding: 32, boxShadow: '0 18px 40px rgba(15,23,42,0.05)' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '18px', color: '#172033', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            Active Project Snapshot
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#172033', marginBottom: 10 }}>{data.overview.projectName}</h3>
                                <p style={{ color: '#667085', fontSize: '14px', lineHeight: 1.6, marginBottom: 20 }}>{data.overview.simpleDescription}</p>
                                
                                <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Status</p>
                                        <p style={{ fontSize: '14px', color: '#172033', fontWeight: 600 }}>{data.overview.currentStatus}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Deadline</p>
                                        <p style={{ fontSize: '14px', color: '#172033', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Calendar size={14} style={{ color: '#2563eb' }} />
                                            {new Date(data.overview.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 24, border: '1px solid rgba(148,163,184,0.1)' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: 12 }}>Next Proposed Project</p>
                                <p style={{ fontSize: '15px', color: '#172033', fontWeight: 700, marginBottom: 20 }}>{data.overview.nextProjectProposal}</p>
                                <Link href="/dashboard/software-client/projects" style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    View full project details &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
