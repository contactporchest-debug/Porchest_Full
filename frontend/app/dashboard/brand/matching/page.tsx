'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import { UserX, ArrowRight, Loader2 } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui';

const AIMatchingComponent = dynamic(() => import('./AIMatchingComponent'), {
    loading: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#7A5030', fontSize: '14px', fontWeight: 500 }}>
            Loading recommendations...
        </div>
    ),
});

export default function AiMatchingPage() {
    const { user } = useAuth();
    const [profileComplete, setProfileComplete] = useState<boolean | null>(user?.profileCompletionStatus ?? null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem('brand_profile_complete');
            if (cached === 'true' || cached === 'false') {
                setProfileComplete(cached === 'true');
                setLoading(false);
            }
        }

        brandAPI.getDashboard().then(res => {
            const nextProfileComplete = !!res.data.dashboard.profileComplete;
            setProfileComplete(nextProfileComplete);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('brand_profile_complete', String(nextProfileComplete));
            }
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, []);

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#C2340A' }} />
                    </div>
                ) : profileComplete ? (
                    <AIMatchingComponent />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '4px' }}>Smart Matching</h1>
                            <p style={{ fontSize: '14px', color: '#7A5030' }}>Discover suitable influencers for your brand</p>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                            <GlassCard style={{ padding: '80px 40px', textAlign: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,107,26,0.15)', border: '1px solid rgba(255,107,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <UserX size={32} style={{ color: '#E8400A' }} />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1A0A00', marginBottom: '10px', letterSpacing: '-0.01em' }}>Action Required: Complete Your Profile</h2>
                                <p style={{ color: '#7A5030', fontSize: '14px', maxWidth: '420px', margin: '0 auto 28px', lineHeight: 1.65 }}>
                                    Complete your brand profile to unlock tailored creator recommendations and discovery tools.
                                </p>
                                <Link href="/dashboard/brand/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '8px', background: '#C2340A', color: '#fff', fontSize: '14px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}>
                                    Go to Profile <ArrowRight size={15} />
                                </Link>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
