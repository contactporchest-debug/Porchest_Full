'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InfluencerFullProfilePage from '../../InfluencerFullProfilePage';

export default function BrandInfluencerFullProfileRoute() {
    const params = useParams();
    const influencerUserId = typeof params?.id === 'string' ? params.id : '';

    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <InfluencerFullProfilePage influencerUserId={influencerUserId} />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
