'use client';

import { motion } from 'framer-motion';
import { ReactNode, CSSProperties } from 'react';

// ── StatCard ────────────────────────────────────── //
interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    change?: string;
    positive?: boolean;
    delay?: number;
}

export function StatCard({ title, value, icon, change, positive = true, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="bg-[#1A1A1E] border border-[#2A2A30] rounded-xl p-6"
        >
            <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A30] bg-[#202025] text-gray-300">{icon}</div>
            </div>
            <p className="mb-1 text-3xl font-bold text-white">{value}</p>
            {change && (
                <p className={`mt-2 flex items-center gap-1 text-xs ${positive ? 'text-green-400' : 'text-red-400'}`}>
                    <span>{positive ? '↑' : '↓'}</span> {change}
                </p>
            )}
        </motion.div>
    );
}

// ── GlassCard ───────────────────────────────────── //
interface GlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    style?: CSSProperties;
    padding?: string;
    noHover?: boolean;
}

export function GlassCard({ children, className = '', onClick, style, padding = '28px', noHover = false }: GlassCardProps) {
    return (
        <div
            className={`bg-[#1A1A1E] border border-[#2A2A30] rounded-xl ${className}`}
            onClick={onClick}
            style={{ padding, cursor: onClick ? 'pointer' : 'default', ...style }}
        >
            {children}
        </div>
    );
}

// ── GlowButton ──────────────────────────────────── //
interface GlowButtonProps {
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
    loading?: boolean;
    style?: CSSProperties;
}

export function GlowButton({
    children, onClick, type = 'button', variant = 'primary',
    size = 'md', disabled = false, className = '', fullWidth = false, loading = false, style,
}: GlowButtonProps) {
    const sizeMap = { sm: '10px 20px', md: '12px 26px', lg: '15px 36px' };
    const baseClass = variant === 'primary' ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-500' : 'bg-[#202025] text-gray-300 border border-[#2A2A30] hover:bg-[#2A2A30] hover:text-white';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClass} ${className}`}
            style={{
                padding: sizeMap[size],
                fontSize: size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px',
                width: fullWidth ? '100%' : undefined,
                opacity: disabled || loading ? 0.55 : 1,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                ...style,
            }}
        >
            {loading && <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />}
            {children}
        </button>
    );
}

// ── LoadingSpinner ───────────────────────────────── //
export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0B' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                    <div className="ring-pulse" />
                    <div className="ring-pulse ring-pulse-2" />
                    <div className="spinner" style={{ position: 'absolute', inset: '12px' }} />
                </div>
                <p style={{ color: '#9CA3AF', fontSize: '14px', fontFamily: 'inherit' }}>{text}</p>
            </div>
        </div>
    );
}

// ── BadgeStatus ─────────────────────────────────── //
export function BadgeStatus({ status }: { status: string }) {
    const classMap: Record<string, string> = {
        active: 'badge-green',
        pending: 'badge-yellow',
        suspended: 'badge-red',
        accepted: 'badge-green',
        rejected: 'badge-red',
        completed: 'badge-blue',
        draft: 'badge-yellow',
        cancelled: 'badge-red',
    };
    return (
        <span className={`badge ${classMap[status] || 'badge-blue'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
