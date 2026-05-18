'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import OverviewPage from './OverviewPage';
import ProfileCompletionBanner from './ProfileCompletionBanner';
import InstagramAnalytics from '@/components/influencer/InstagramAnalytics';
import ConnectInstagramBanner from '@/components/shared/ConnectInstagramBanner';
import { useApi } from '@/hooks/useApi';
import { influencerAPI } from '@/lib/api';
import { buildInfluencerProfileCompletion } from '@/lib/influencerProfileCompletion';
import toast from 'react-hot-toast';

type InfluencerProfileResponse = {
    profileComplete?: boolean;
    igUsername?: string;
};

export default function InfluencerPortal() {
    const { user } = useAuth();
    const { data: profile } = useApi<InfluencerProfileResponse>('/profile/influencer/me');
    const [igConnected, setIgConnected] = useState(false);
    const [dashStats, setDashStats] = useState<any>(null);
    const [profileCompletion, setProfileCompletion] = useState<any>(null);
    const instagramConnected = igConnected || !!(profile?.igUsername || user?.instagramConnected || user?.instagramConnectionStatus === 'connected');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            if (p.get('ig_connected') === '1') {
                toast.success('Instagram connected! ✅', { id: 'ig-conn' });
                window.history.replaceState({}, '', window.location.pathname);
            }
            if (p.get('ig_error')) {
                const m: Record<string, string> = { invalid_state: 'Security check failed.', missing_code: 'Instagram connection was cancelled.', sync_failed: 'We could not finish connecting Instagram. Please try again.', token_expired: 'Your Instagram session expired. Please reconnect.' };
                toast.error(m[p.get('ig_error')!] || 'Instagram connection failed.', { id: 'ig-err' });
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
        
        influencerAPI.getDashboard()
            .then(res => {
                setDashStats(res.data.dashboard);
                setIgConnected(!!res.data.dashboard?.instagramConnection?.isConnected);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!profile) return;
        setProfileCompletion(buildInfluencerProfileCompletion(profile as any, {
            instagramConnected,
        }));
    }, [profile, instagramConnected]);

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>


                {/* ── PROFILE COMPLETION BANNER (only shown when incomplete) ── */}
                <ProfileCompletionBanner completion={profileCompletion} />

                {/* ── CONTENT ── */}
                <OverviewPage stats={dashStats} />
                {instagramConnected ? <InstagramAnalytics /> : <ConnectInstagramBanner role="influencer" />}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
