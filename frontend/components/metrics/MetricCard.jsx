'use client';

import { motion } from 'framer-motion';

export default function MetricCard({ label, value, sub, accent = false, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6 transition-all hover:bg-[#202025] hover:-translate-y-0.5"
        >
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {label}
            </span>
            <span className="mt-2 text-3xl font-bold text-white">
                {value}
            </span>
            {sub ? <span className={`mt-1 text-xs font-medium ${accent ? 'text-green-400' : 'text-gray-500'}`}>{sub}</span> : null}
        </motion.div>
    );
}
