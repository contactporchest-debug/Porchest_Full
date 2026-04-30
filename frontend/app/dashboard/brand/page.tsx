'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import OverviewPage from './OverviewPage';
import InfluencerSearch from './InfluencerSearch';
import ConnectInstagramBanner from '@/components/shared/ConnectInstagramBanner';
import { motion } from 'framer-motion';

export default function BrandPortalOverview() {
    const { user } = useAuth();
    const displayName = user?.companyName || user?.email?.split('@')[0] || 'Brand';
    const instagramConnected = !!(user?.instagramConnected || user?.instagramConnectionStatus === 'connected');

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>


                <OverviewPage />
                {!instagramConnected && <ConnectInstagramBanner role="brand" />}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
