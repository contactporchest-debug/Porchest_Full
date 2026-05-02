'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InstagramConnect from '@/components/shared/InstagramConnect';
import BrandProfileForm from '@/components/brand/BrandProfileForm';

export default function BrandProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Brand settings</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">Profile setup</h1>
                        <p className="mt-2 max-w-2xl text-sm text-white/45">
                            Connect Instagram first, then complete your business, audience, and campaign preferences so Porchest can match you with the right creators.
                        </p>
                    </div>

                    <InstagramConnect role="brand" />
                    <BrandProfileForm />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
