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
            className="stat-card"
        >
            <div className="flex items-start justify-between mb-4">
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{title}</p>
                <div className="icon-glow" style={{ width: '38px', height: '38px', fontSize: '18px', flexShrink: 0 }}>{icon}</div>
            </div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '30px', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1' }}>{value}</p>
            {change && (
                <p style={{ fontSize: '12px', marginTop: '8px', color: positive ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            className={`glass-card ${className}`}
            onClick={onClick}
            style={{ padding, cursor: onClick ? 'pointer' : 'default', ...(noHover ? {} : {}), ...style }}
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
    const baseClass = variant === 'primary' ? 'glow-btn' : 'outline-btn';

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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                    <div className="ring-pulse" />
                    <div className="ring-pulse ring-pulse-2" />
                    <div className="spinner" style={{ position: 'absolute', inset: '12px' }} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontFamily: 'Space Grotesk' }}>{text}</p>
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
        completed: 'badge-purple',
        draft: 'badge-yellow',
        cancelled: 'badge-red',
    };
    return (
        <span className={`badge ${classMap[status] || 'badge-purple'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
