import { Suspense } from 'react';
import PerformancePageClient from './PerformancePageClient';

type PageProps = {
    searchParams?: {
        campaign?: string | string[];
    };
};

export default function InfluencerPerformancePage({ searchParams }: PageProps) {
    const campaignId = Array.isArray(searchParams?.campaign)
        ? searchParams?.campaign[0] || null
        : searchParams?.campaign || null;

    return (
        <Suspense fallback={null}>
            <PerformancePageClient campaignIdParam={campaignId} />
        </Suspense>
    );
}
