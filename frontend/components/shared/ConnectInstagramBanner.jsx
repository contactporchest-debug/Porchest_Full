'use client';

import { motion } from 'framer-motion';

export default function ConnectInstagramBanner({ role = 'influencer' }) {
    function handleConnect() {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/meta/connect`;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 rounded-2xl border border-purple-500/30 bg-purple-900/20 p-5 md:flex-row md:items-center md:justify-between"
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
                className="shrink-0 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500"
            >
                Connect Instagram
            </button>
        </motion.div>
    );
}
