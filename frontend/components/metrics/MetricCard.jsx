'use client';

import { motion } from 'framer-motion';

export default function MetricCard({ label, value, sub, accent = false, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            className={[
                'rounded-xl p-5 flex flex-col gap-1 border backdrop-blur-md',
                accent
                    ? 'bg-purple-900/40 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.08)]'
                    : 'bg-white/5 border-white/10',
            ].join(' ')}
        >
            <span className="text-xs uppercase tracking-[0.18em] text-gray-400">{label}</span>
            <span className="text-2xl font-semibold text-white">{value}</span>
            {sub ? <span className="text-xs text-gray-500">{sub}</span> : null}
        </motion.div>
    );
}
