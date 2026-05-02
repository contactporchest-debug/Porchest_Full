'use client';
import dynamic from 'next/dynamic';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

const AnalyticsPage = dynamic(() => import('../AnalyticsPage'), {
    loading: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'rgba(255,255,255,0.5)' }}>
            Loading analytics...
        </div>
    ),
});

export default function BrandAnalyticsRoute() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <AnalyticsPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
