'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InstagramConnect from '@/components/shared/InstagramConnect';
import ProfileForm from '@/components/influencer/ProfileForm';

export default function InfluencerProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Influencer settings</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">Profile setup</h1>
                        <p className="mt-2 max-w-2xl text-sm text-white/45">
                            Connect your Instagram and keep your profile fields current so brands can see the right audience, style, and pricing details.
                        </p>
                    </div>

                    <InstagramConnect role="influencer" />
                    <ProfileForm />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
