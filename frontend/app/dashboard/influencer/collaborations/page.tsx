'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CampaignsFlow from '@/components/influencer/CampaignsFlow';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { buildInfluencerProfileCompletion } from '@/lib/influencerProfileCompletion';
import Link from 'next/link';
import { motion } from 'framer-motion';

type InfluencerProfileResponse = {
    profileComplete?: boolean;
    profileCompletionStatus?: boolean;
    profileCompletion?: {
        isComplete?: boolean;
    };
    influencerProfile?: {
        fullName?: string;
        contactEmail?: string;
        bio?: string;
        igBio?: string;
        country?: string;
        countryOfResidence?: string;
        city?: string;
        niche?: string[] | string;
        languages?: string[] | string;
        contentStyleTags?: string[] | string;
        rates?: {
            reelPrice?: number | string;
            postPrice?: number | string;
        };
        avgReelPrice?: number | string;
        avgPostPrice?: number | string;
    };
    fullName?: string;
    contactEmail?: string;
    bio?: string;
    igBio?: string;
    country?: string;
    countryOfResidence?: string;
    city?: string;
    niche?: string[] | string;
    languages?: string[] | string;
    contentStyleTags?: string[] | string;
    rates?: {
        reelPrice?: number | string;
        postPrice?: number | string;
    };
    avgReelPrice?: number | string;
    avgPostPrice?: number | string;
};

export default function InfluencerCollaborationsRoute() {
    const { user } = useAuth();
    const { data: profile, loading } = useApi<InfluencerProfileResponse>('/profile/influencer/me');
    const profileCompletion = buildInfluencerProfileCompletion(profile as any, {
        instagramConnected: user?.instagramConnected,
        instagramConnectionStatus: user?.instagramConnectionStatus,
    });

    return (
        <ProtectedRoute allowedRoles={['influencer']}>
            <DashboardLayout>
                {loading ? (
                    <div className="rounded-[14px] border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.38)] p-6 text-sm text-[#7A5030] backdrop-blur-[12px]">
                        Loading profile status...
                    </div>
                ) : (
                    <>
                        {!profileCompletion.isComplete && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 rounded-[14px] border border-[#EDD9BC] bg-[rgba(255,255,255,0.45)] p-6 backdrop-blur-[12px]"
                            >
                                <p className="text-[11px] uppercase tracking-[0.18em] text-[#C2340A]">Profile incomplete</p>
                                <h1 className="mt-2 text-2xl font-semibold text-[#1A0A00]">You can still review and respond to requests</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7A5030]">
                                    Your profile is not fully complete yet, but you can accept or decline collaboration requests while you finish setup.
                                </p>
                                <Link
                                    href="/dashboard/influencer/profile"
                                    className="mt-6 inline-flex items-center rounded-full bg-[#C2340A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E8400A]"
                                >
                                    Finish profile
                                </Link>
                            </motion.div>
                        )}
                        <CampaignsFlow />
                    </>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
