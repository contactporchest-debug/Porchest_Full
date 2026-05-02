'use client';

import { motion } from 'framer-motion';

export default function MetricCard({ label, value, sub, accent = false, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            className={[
                'rounded-[16px] p-5 flex flex-col gap-1.5 border transition-all hover:-translate-y-0.5',
                accent
                    ? 'bg-purple-500/[0.08] border-purple-500/[0.15] shadow-[0_0_24px_rgba(123,63,242,0.08)]'
                    : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.05]',
            ].join(' ')}
        >
            <span className={`text-[10px] font-bold uppercase tracking-widest ${accent ? 'text-purple-400/70' : 'text-white/30'}`}>
                {label}
            </span>
            <span className={`text-2xl font-bold ${accent ? 'text-purple-300' : 'text-white'}`}>
                {value}
            </span>
            {sub ? <span className="text-[10px] font-bold uppercase tracking-wide text-white/25 mt-0.5">{sub}</span> : null}
        </motion.div>
    );
}
