'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InfluencerSearch from '../InfluencerSearch';

export default function BrandInfluencersRoute() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <InfluencerSearch />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
