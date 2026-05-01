'use client';

import { motion } from 'framer-motion';

export default function MetricCard({ label, value, sub, accent = false, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            className={[
                'rounded-[20px] p-5 flex flex-col gap-1.5 border transition-all hover:-translate-y-0.5',
                accent
                    ? 'bg-[#f5f3ff] border-stone-200 shadow-[0_8px_24px_rgba(168,85,247,0.12)]'
                    : 'bg-[rgba(255,255,255,0.95)] border-[rgba(148,163,184,0.18)] shadow-[0_8px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)]',
            ].join(' ')}
        >
            <span className={`text-[10px] font-bold uppercase tracking-widest ${accent ? 'text-stone-500' : 'text-slate-400'}`}>
                {label}
            </span>
            <span className={`text-2xl font-bold ${accent ? 'text-stone-900' : 'text-[#172033]'}`}>
                {value}
            </span>
            {sub ? <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">{sub}</span> : null}
        </motion.div>
    );
}
