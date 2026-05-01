'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CampaignsFlow from '@/components/influencer/CampaignsFlow';

export default function InfluencerCollaborationsRoute() {
    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <CampaignsFlow />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
