'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import CampaignsFlow from '@/components/influencer/CampaignsFlow';
import { buildInfluencerProfileCompletion } from '@/lib/influencerProfileCompletion';

export default function InfluencerCollaborationsRoute() {
    const { user } = useAuth();
    const { data: profile, loading } = useApi('/profile/influencer/me');
    const instagramConnected = Boolean(user?.instagramConnected || user?.instagramConnectionStatus === 'connected');
    const profileCompletion = useMemo(() => buildInfluencerProfileCompletion(profile as any, {
        instagramConnected,
        instagramConnectionStatus: user?.instagramConnectionStatus,
    }), [profile, instagramConnected, user?.instagramConnectionStatus]);

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                {loading ? (
                    <div style={{ padding: '28px', borderRadius: '24px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.52)', color: '#7A5030' }}>
                        Checking profile completion...
                    </div>
                ) : profileCompletion.isComplete ? (
                    <CampaignsFlow />
                ) : (
                    <div style={{ padding: '28px', borderRadius: '24px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.52)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C2340A' }}>Profile incomplete</p>
                        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#1A0A00' }}>Complete your profile first</h2>
                        <p style={{ color: '#7A5030', lineHeight: 1.7 }}>
                            Fill every required field in your profile and connect Instagram before you can accept, decline, or manage collaborations.
                        </p>
                        <Link href="/dashboard/influencer/profile" style={{ alignSelf: 'flex-start', padding: '12px 18px', borderRadius: '999px', background: '#C2340A', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                            Go to profile
                        </Link>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
