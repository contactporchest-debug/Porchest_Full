'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InfluencerDiscovery from '@/components/brand/InfluencerDiscovery';

export default function BrandInfluencersRoute() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <InfluencerDiscovery />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
