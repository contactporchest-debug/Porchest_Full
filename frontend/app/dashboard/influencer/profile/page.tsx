'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InstagramConnect from '@/components/shared/InstagramConnect';
import ProfileForm from '@/components/influencer/ProfileForm';

export default function InfluencerProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div style={{ margin: '0 auto', display: 'flex', width: '100%', maxWidth: '1152px', flexDirection: 'column', gap: '24px' }}>
                    <InstagramConnect role="influencer" />
                    <ProfileForm />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
