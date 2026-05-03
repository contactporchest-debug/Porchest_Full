'use client';

import { motion } from 'framer-motion';

export default function MetricCard({ label, value, sub, accent = false, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', display: 'flex', flexDirection: 'column', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
        >
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7A5030' }}>
                {label}
            </span>
            <span style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700, color: '#1A0A00', lineHeight: 1.2 }}>
                {value}
            </span>
            {sub ? <span style={{ marginTop: '4px', fontSize: '12px', fontWeight: 500, color: accent ? '#166534' : '#C4A882' }}>{sub}</span> : null}
        </motion.div>
    );
}
