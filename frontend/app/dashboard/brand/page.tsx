'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import OverviewPage from './OverviewPage';
import InfluencerSearch from './InfluencerSearch';
import { motion } from 'framer-motion';

export default function BrandPortalOverview() {
    const { user } = useAuth();
    const displayName = user?.companyName || user?.email?.split('@')[0] || 'Brand';

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>


                <OverviewPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
