'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, BriefcaseBusiness, Users, Shield, Wallet, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';

interface Stats {
    totalUsers: number;
    totalBrands: number;
    totalInfluencers: number;
    totalAdmins: number;
    pendingUsers: number;
    pendingVerifications: number;
    pendingPayments?: number;
    totalCampaignRequests?: number;
    pendingRequests?: number;
    acceptedRequests?: number;
    activeRequests?: number;
}

function StatCard({
    label,
    value,
    sub,
    icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.42)',
                backdropFilter: 'blur(12px)',
                border: '1px solid #EDD9BC',
                borderRadius: 24,
                padding: 24,
                boxShadow: '0 4px 20px rgba(26,10,0,0.02)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.8)',
                        border: '1px solid #EDD9BC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#C2340A',
                    }}
                >
                    {icon}
                </div>
                <p style={{ fontSize: 13, color: '#7A5030', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            </div>
            <p style={{ fontWeight: 800, fontSize: 32, color: '#1A0A00', letterSpacing: '-0.02em' }}>{value}</p>
            {sub && <p style={{ fontSize: 13, color: '#C4A882', fontWeight: 500, marginTop: 4 }}>{sub}</p>}
        </motion.div>
    );
}

function ShortcutCard({
    title,
    description,
    href,
    icon,
}: {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
}) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
                background: 'rgba(255,255,255,0.46)',
                border: '1px solid #EDD9BC',
                borderRadius: 24,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: '0 4px 20px rgba(26,10,0,0.02)',
            }}
        >
            <div style={{ width: 48, height: 48, borderRadius: 16, border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2340A' }}>
                {icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A0A00' }}>{title}</h2>
                <p style={{ color: '#7A5030', lineHeight: 1.7 }}>{description}</p>
            </div>
            <Link
                href={href}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginTop: 'auto',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: '#FFF7EF',
                    border: '1px solid #EDD9BC',
                    color: '#C2340A',
                    fontWeight: 700,
                }}
            >
                Open section
                <ArrowRight size={16} />
            </Link>
        </motion.div>
    );
}

export default function AdminLandingPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
        const response = await adminAPI.getStats();
        setStats(response.data.stats);
    }, []);

    useEffect(() => {
        setLoading(true);
        loadStats()
            .catch(() => toast.error('Failed to load admin stats'))
            .finally(() => setLoading(false));
    }, [loadStats]);

    const quickCards = useMemo(
        () => [
            {
                title: 'Users',
                description: 'Manage accounts, roles, status, and profile completion from one place.',
                href: '/dashboard/admin/users',
                icon: <Users size={20} />,
            },
            {
                title: 'Campaigns',
                description: 'Review campaign requests, statuses, and approvals in a focused workspace.',
                href: '/dashboard/admin/campaigns',
                icon: <BriefcaseBusiness size={20} />,
            },
            {
                title: 'Collaborations',
                description: 'Track collaboration stages, verification steps, and admin actions.',
                href: '/dashboard/admin/collaborations',
                icon: <BarChart3 size={20} />,
            },
            {
                title: 'Payments',
                description: 'Review Easypaisa proof submissions and approve campaigns to start work.',
                href: '/dashboard/admin/payments',
                icon: <ShieldCheck size={20} />,
            },
            {
                title: 'Cashouts',
                description: 'Approve or reject influencer withdrawals and keep payout reviews organized.',
                href: '/dashboard/admin/cashouts',
                icon: <Wallet size={20} />,
            },
        ],
        []
    );

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(255,255,255,0.38)',
                            border: '1px solid rgba(255,255,255,0.65)',
                            borderRadius: 20,
                            padding: 28,
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <p style={{ textTransform: 'uppercase', letterSpacing: '0.25em', color: '#7A5030', fontSize: 12, fontWeight: 700 }}>Admin portal</p>
                        <h1 style={{ marginTop: 8, fontSize: 36, fontWeight: 900, color: '#1A0A00' }}>Dashboard</h1>
                        <p style={{ marginTop: 10, color: '#7A5030', lineHeight: 1.7, maxWidth: 760 }}>
                            A quick entry point for the admin workspace. Jump into users, campaigns, collaborations, and cashouts from a single view.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <StatCard label="Total users" value={loading ? '—' : stats?.totalUsers ?? '—'} icon={<Users size={18} />} />
                        <StatCard label="Brands" value={loading ? '—' : stats?.totalBrands ?? '—'} icon={<Shield size={18} />} />
                        <StatCard label="Influencers" value={loading ? '—' : stats?.totalInfluencers ?? '—'} icon={<Users size={18} />} />
                        <StatCard label="Pending users" value={loading ? '—' : stats?.pendingUsers ?? '—'} sub="Pending verifications" icon={<BarChart3 size={18} />} />
                        <StatCard label="Pending payments" value={loading ? '—' : stats?.pendingPayments ?? '—'} sub="Awaiting admin review" icon={<ShieldCheck size={18} />} />
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                            gap: 16,
                        }}
                    >
                        {quickCards.map((card) => (
                            <ShortcutCard key={card.title} {...card} />
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(255,255,255,0.46)',
                            border: '1px solid #EDD9BC',
                            borderRadius: 24,
                            padding: 24,
                            boxShadow: '0 4px 20px rgba(26,10,0,0.02)',
                        }}
                    >
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A0A00' }}>Workspace overview</h2>
                        <p style={{ marginTop: 8, color: '#7A5030', lineHeight: 1.7, maxWidth: 820 }}>
                            Use the cards above to move directly into the area you need. The admin workspace is now centered on users, with supporting operational screens kept available for campaign review, collaboration tracking, and cashout handling.
                        </p>
                    </motion.div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
