'use client';

import { motion } from 'framer-motion';
import { brandAPI, influencerAPI } from '@/lib/api';

export default function ConnectInstagramBanner({ role = 'influencer' }) {
    async function handleConnect() {
        try {
            const res = role === 'brand'
                ? await brandAPI.getInstagramConnectURL()
                : await influencerAPI.getInstagramConnectURL();
            if (res?.data?.authURL) window.location.href = res.data.authURL;
        } catch {
            // Keep the banner simple; the surrounding page handles broader error feedback.
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 rounded-2xl border border-stone-500/10 bg-stone-900/20 p-5 md:flex-row md:items-center md:justify-between"
        >
            <div>
                <p className="font-medium text-white">Connect your Instagram account</p>
                <p className="mt-1 text-sm text-gray-400">
                    {role === 'influencer'
                        ? 'Connect to show your analytics, engagement rate, and audience data to brands.'
                        : 'Connect to track follower growth and post performance for your campaigns.'}
                </p>
            </div>
            <button
                onClick={handleConnect}
                className="shrink-0 rounded-lg bg-stone-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-500"
            >
                Connect Instagram
            </button>
        </motion.div>
    );
}
