'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import MyProfilePage from '../MyProfilePage';

export default function InfluencerProfileRoute() {
    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <MyProfilePage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
