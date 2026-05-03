'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InstagramConnect from '@/components/shared/InstagramConnect';
import ProfileForm from '@/components/influencer/ProfileForm';

export default function InfluencerProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Influencer profile</p>
                                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">My Profile</h1>
                                <p className="mt-2 max-w-2xl text-sm text-white/45">
                                    Your profile is shown to brands searching for influencers. Keep your Instagram, bio, rates, and niche details up to date.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                                    100% complete
                                </div>
                                <a
                                    href="#profile-form"
                                    className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08]"
                                >
                                    Edit profile
                                </a>
                            </div>
                        </div>
                    </div>

                    <InstagramConnect role="influencer" />
                    <div id="profile-form">
                        <ProfileForm />
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
