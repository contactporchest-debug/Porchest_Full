'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AnalyticsPage from '../AnalyticsPage';

export default function BrandAnalyticsRoute() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <AnalyticsPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
