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
            style={{
                background: 'rgba(255, 255, 255, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 2px 16px rgba(26,10,0,0.06)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</p>
                <div style={{ display: 'flex', width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'rgba(194,52,10,0.10)', color: '#C2340A' }}>{icon}</div>
            </div>
            <p style={{ marginBottom: '4px', fontSize: '28px', fontWeight: 700, color: '#1A0A00', letterSpacing: '-0.02em' }}>{value}</p>
            {change && (
                <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: positive ? '#C2340A' : '#7A5030', fontWeight: 500 }}>
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
            className={className}
            onClick={onClick}
            style={{
                background: 'rgba(255, 255, 255, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '14px',
                padding,
                cursor: onClick ? 'pointer' : 'default',
                boxShadow: '0 2px 16px rgba(26,10,0,0.06)',
                transition: 'all 0.2s',
                ...style
            }}
            onMouseEnter={e => {
                if (onClick && !noHover) {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(26,10,0,0.10)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.55)';
                }
            }}
            onMouseLeave={e => {
                if (onClick && !noHover) {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(26,10,0,0.06)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.35)';
                }
            }}
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
    const sizeMap = { sm: '10px 20px', md: '11px 26px', lg: '13px 32px' };
    
    let bg = '#C2340A';
    let text = '#fff';
    let border = 'none';
    let hoverBg = '#E8400A';

    if (variant === 'outline') {
        bg = 'transparent';
        text = '#C2340A';
        border = '1.5px solid #C2340A';
        hoverBg = 'rgba(194,52,10,0.08)';
    } else if (variant === 'danger') {
        bg = 'transparent';
        text = '#C2340A';
        border = '1.5px solid rgba(194,52,10,0.3)';
        hoverBg = 'rgba(194,52,10,0.10)';
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: bg,
                color: text,
                border: border,
                borderRadius: '8px',
                padding: sizeMap[size],
                fontSize: size === 'sm' ? '13px' : size === 'lg' ? '15px' : '14px',
                fontWeight: 500,
                letterSpacing: '0.01em',
                width: fullWidth ? '100%' : undefined,
                opacity: disabled || loading ? 0.6 : 1,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
                ...style,
            }}
            onMouseEnter={e => {
                if (!disabled && !loading) {
                    (e.currentTarget as HTMLElement).style.background = hoverBg;
                    (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
                }
            }}
            onMouseLeave={e => {
                if (!disabled && !loading) {
                    (e.currentTarget as HTMLElement).style.background = bg;
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }
            }}
        >
            {loading && <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: variant === 'primary' ? 'rgba(255,255,255,0.3)' : 'rgba(194,52,10,0.3)', borderTopColor: variant === 'primary' ? '#fff' : '#C2340A' }} />}
            {children}
        </button>
    );
}

// ── LoadingSpinner ───────────────────────────────── //
export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF6EE' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                    <div className="ring-pulse" style={{ borderColor: 'rgba(194,52,10,0.2)' }} />
                    <div className="ring-pulse ring-pulse-2" style={{ borderColor: 'rgba(194,52,10,0.2)' }} />
                    <div className="spinner" style={{ position: 'absolute', inset: '12px', borderColor: 'rgba(194,52,10,0.2)', borderTopColor: '#C2340A' }} />
                </div>
                <p style={{ color: '#7A5030', fontSize: '14px', fontFamily: 'inherit', fontWeight: 500 }}>{text}</p>
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
        completed: 'badge-orange',
        draft: 'badge-yellow',
        cancelled: 'badge-red',
    };
    return (
        <span className={`badge ${classMap[status.toLowerCase()] || 'badge-orange'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
