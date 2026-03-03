'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import EarningsPage from '../EarningsPage';

export default function InfluencerEarningsRoute() {
    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <EarningsPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
