'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useApi } from '@/hooks/useApi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

type InfluencerProfileResponse = {
    profileComplete?: boolean;
};

export default function InfluencerNotificationsPage() {
    const { data: profile, loading } = useApi<InfluencerProfileResponse>('/profile/influencer/me');
    const profileComplete = !!profile?.profileComplete;

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                {loading ? (
                    <div style={{ padding: '24px', borderRadius: '14px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', fontSize: '14px', color: '#7A5030' }}>
                        Loading profile status...
                    </div>
                ) : !profileComplete ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,107,26,0.3)', background: 'rgba(255,107,26,0.1)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <AlertCircle size={14} style={{ color: '#E8400A' }} />
                            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#E8400A', fontWeight: 600 }}>Profile incomplete</p>
                        </div>
                        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1A0A00' }}>Complete your influencer profile first</h1>
                        <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030', lineHeight: 1.65, maxWidth: '600px' }}>
                            Notifications are linked to your request inbox, cashouts, and verification flow, so your profile must be complete before the portal can load them.
                        </p>
                        <Link
                            href="/dashboard/influencer/profile"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '24px', borderRadius: '8px', background: '#C2340A', color: '#fff', padding: '11px 24px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E8400A'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#C2340A'; }}
                        >
                            Go to profile
                        </Link>
                    </motion.div>
                ) : (
                    <NotificationCenter role="influencer" />
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
