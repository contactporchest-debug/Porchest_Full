'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CampaignsPage from '../CampaignsPage';

export default function BrandCollaborationsRoute() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '24px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                        Collaborations
                    </h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                        Manage your active campaigns, pending requests, and track influencer posts.
                    </p>
                </div>
                <CampaignsPage hideHeader />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
