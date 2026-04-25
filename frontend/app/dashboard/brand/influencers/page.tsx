'use client';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

const InfluencerSearch = dynamic(() => import('../InfluencerSearch'), {
    loading: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#64748b' }}>
            Loading influencer discovery...
        </div>
    ),
});

export default function BrandInfluencersRoute() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <InfluencerSearch />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
