'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CollaborationsPage from '../CollaborationsPage';

export default function InfluencerCollaborationsRoute() {
    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <CollaborationsPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
