'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { softwareClientAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Briefcase, Calendar, CheckCircle, Clock, CheckCircle2, ChevronRight, Activity, DollarSign } from 'lucide-react';

interface Milestone {
    title: string;
    status: 'completed' | 'in_progress' | 'up_next';
    dueDate: string;
    summary?: string;
}

interface Project {
    name: string;
    status: string;
    phase: string;
    description: string;
    startDate: string;
    deadline: string;
    progress: number;
    budgetUsd: number;
    requirements: string[];
    deliverables: string[];
    notes: string;
    milestones: Milestone[];
}

interface ProjectsData {
    activeProject: Project | null;
    projects: Project[];
    requirements: string[];
}

export default function SoftwareClientProjectsPage() {
    const [data, setData] = useState<ProjectsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await softwareClientAPI.getProjects();
            setData(response.data);
        } catch (error) {
            toast.error('Failed to load projects data');
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', icon: <CheckCircle2 size={14} /> };
            case 'in_progress': return { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', icon: <Activity size={14} /> };
            case 'up_next': return { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', icon: <Clock size={14} /> };
            default: return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', icon: <Clock size={14} /> };
        }
    };

    return (
        <ProtectedRoute allowedRoles={['software-client']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
                            Projects & Delivery
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontSize: '14px' }}>
                            Track the status, requirements, and milestones of your active developments.
                        </p>
                    </motion.div>

                    {data.activeProject ? (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                                            {data.activeProject.name}
                                        </h2>
                                        <span style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(168,85,247,0.1)', color: '#c084fc', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Active
                                        </span>
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6, maxWidth: 600 }}>{data.activeProject.description}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Budget</p>
                                    <p style={{ fontSize: 18, color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                        <DollarSign size={16} />{data.activeProject.budgetUsd.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32, padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Status</p>
                                    <p style={{ fontSize: 14, color: '#ffffff', fontWeight: 600 }}>{data.activeProject.status}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Phase</p>
                                    <p style={{ fontSize: 14, color: '#ffffff', fontWeight: 600 }}>{data.activeProject.phase}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Start Date</p>
                                    <p style={{ fontSize: 14, color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Calendar size={14} style={{ color: 'rgba(255,255,255,0.5)' }} /> {new Date(data.activeProject.startDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Deadline</p>
                                    <p style={{ fontSize: 14, color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Calendar size={14} style={{ color: '#a855f7' }} /> {new Date(data.activeProject.deadline).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Overall Progress</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{data.activeProject.progress}%</span>
                                </div>
                                <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${data.activeProject.progress}%`, background: 'linear-gradient(90deg, #c084fc, #9333ea)', transition: 'width 1s ease' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>Key Milestones</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {data.activeProject.milestones.map((ms, i) => {
                                            const sc = getStatusColor(ms.status);
                                            return (
                                                <div key={i} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                                                    {i !== data.activeProject!.milestones.length - 1 && (
                                                        <div style={{ position: 'absolute', left: 16, top: 32, bottom: -16, width: 2, background: 'rgba(255,255,255,0.06)' }} />
                                                    )}
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: sc.bg, color: sc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, border: `2px solid #0c0c0c` }}>
                                                        {sc.icon}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 2 }}>{ms.title}</p>
                                                        {ms.summary && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{ms.summary}</p>}
                                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Calendar size={11} /> Due {new Date(ms.dueDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>Requirements & Deliverables</h3>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 10 }}>Current Requirements</p>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                                            {data.requirements.map((req, i) => (
                                                <li key={i} style={{ fontSize: 13, color: '#ffffff', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                    <ChevronRight size={14} style={{ color: '#a855f7', flexShrink: 0, marginTop: 2 }} /> {req}
                                                </li>
                                            ))}
                                        </ul>

                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 10 }}>Deliverables</p>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {data.activeProject.deliverables.map((del, i) => (
                                                <li key={i} style={{ fontSize: 13, color: '#ffffff', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                    <CheckCircle size={14} style={{ color: '#4ade80', flexShrink: 0, marginTop: 2 }} /> {del}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {data.activeProject.notes && (
                                        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.1)' }}>
                                            <p style={{ fontSize: 11, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Notes</p>
                                            <p style={{ fontSize: 13, color: 'rgba(251,191,36,0.8)', lineHeight: 1.5 }}>{data.activeProject.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div style={{ padding: 60, textAlign: 'center', background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24 }}>
                            <Briefcase size={32} style={{ color: 'rgba(168,85,247,0.2)', margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>No Active Projects</h3>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>You do not have any active projects at the moment.</p>
                        </div>
                    )}

                    {/* Past/Other Projects List */}
                    {data.projects.filter(p => p.name !== data.activeProject?.name).length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>Other Projects</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {data.projects.filter(p => p.name !== data.activeProject?.name).map((project, idx) => (
                                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{project.name}</h3>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{project.description}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: 99, background: project.progress === 100 ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)', color: project.progress === 100 ? '#4ade80' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-block', marginBottom: 6 }}>
                                                {project.status}
                                            </span>
                                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{new Date(project.startDate).getFullYear()} - {new Date(project.deadline).getFullYear()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
