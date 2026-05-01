'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CollaborationsFlow from '@/components/brand/CollaborationsFlow';

export default function BrandCollaborationsRoute() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '24px', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                        Collaborations
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>
                        Manage your active campaigns, pending requests, and track influencer posts.
                    </p>
                </div>
                <CollaborationsFlow />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
