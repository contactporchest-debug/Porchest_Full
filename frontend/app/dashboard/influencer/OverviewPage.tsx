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

    const collaborationCountCards = [
        { label: 'Total Requests Received', value: stats?.totalRequests ?? '—', color: '#60d5f8' },
        { label: 'Total Accepted', value: stats?.totalAccepted ?? '—', color: '#4ade80' },
        { label: 'Total Rejected', value: stats?.totalRejected ?? '—', color: '#f87171' },
        { label: 'Total Completed', value: stats?.totalCompleted ?? '—', color: '#a78bfa' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* ── COLLABORATION REQUEST COUNT CARDS ── */}
            <div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: '#7a8798', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Collaboration Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                    {collaborationCountCards.map((c, i) => (
                        <motion.div key={c.label}
                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.35 }}
                            className="glass-card" style={{ padding: '24px', borderRadius: '22px', border: `1px solid ${c.color}24` }}>
                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2rem', color: c.color, letterSpacing: '-0.04em', filter: `drop-shadow(0 0 10px ${c.color}55)` }}>
                                {c.value}
                            </p>
                            <p style={{ fontSize: '12px', color: '#667085', marginTop: '6px' }}>{c.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
