'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import BrandProfileForm from '@/components/brand/BrandProfileForm';

export default function BrandProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['brand']}>
            <DashboardLayout>
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Brand profile</p>
                                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Profile Setup</h1>
                                <p className="mt-2 max-w-2xl text-sm text-white/45">
                                    Complete your business, audience, and campaign preferences so Porchest can match you with the right creators.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                                    Profile ready
                                </div>
                                <a
                                    href="#brand-profile-form"
                                    className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08]"
                                >
                                    Edit profile
                                </a>
                            </div>
                        </div>
                    </div>

                    <div id="brand-profile-form">
                        <BrandProfileForm />
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
