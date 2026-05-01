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

const AIMatchingComponent = dynamic(() => import('./AIMatchingComponent'), {
    loading: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#64748b' }}>
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
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#9b6f50' }} />
                    </div>
                ) : profileComplete ? (
                    <AIMatchingComponent />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '4px' }}>Smart Matching</h1>
                            <p style={{ fontSize: '13px', color: '#64748b' }}>Discover suitable influencers for your brand</p>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                            className="glass-card" style={{ padding: '80px 40px', borderRadius: '36px', textAlign: 'center', border: '1px solid rgba(155,111,80,0.15)', position: 'relative', overflow: 'hidden' }}>
                            {/* Glow */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(155,111,80,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(155,111,80,0.12)', border: '1px solid rgba(155,111,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(155,111,80,0.2)' }}>
                                    <UserX size={40} style={{ color: '#9b6f50' }} />
                                </div>
                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#0f172a', marginBottom: '10px' }}>Action Required: Complete Your Profile</p>
                                <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 28px', lineHeight: '1.7' }}>
                                    Complete your brand profile to unlock tailored creator recommendations and discovery tools.
                                </p>
                                <Link href="/dashboard/brand/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '99px', background: 'linear-gradient(135deg,#9b6f50,#d7b48f)', color: '#fff', fontSize: '14px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 0 30px rgba(155,111,80,0.4)', transition: 'all 200ms ease' }}>
                                    Go to Profile <ArrowRight size={15} />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
