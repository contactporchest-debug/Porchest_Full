'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import dynamic from 'next/dynamic';

const InfluencersPage = dynamic(() => import('../AnalyticsPage'), {
    loading: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'rgba(122,80,48,0.8)' }}>
            Loading influencers...
        </div>
    ),
});

export default function BrandInfluencersRoute() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <InfluencersPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
