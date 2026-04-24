'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle, CheckCircle2, Camera, User, FileText,
    Tag, Globe, Users, BarChart3, DollarSign, Instagram, ArrowRight,
} from 'lucide-react';

interface CheckItem {
    key: string;
    label: string;
    done: boolean;
}

interface ProfileCompletionData {
    percentage: number;
    isComplete: boolean;
    checklist: CheckItem[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
    profilePhoto: <Camera size={14} />,
    displayName: <User size={14} />,
    bio: <FileText size={14} />,
    niche: <Tag size={14} />,
    country: <Globe size={14} />,
    followers: <Users size={14} />,
    engagement: <BarChart3 size={14} />,
    postPrice: <DollarSign size={14} />,
    reelPrice: <DollarSign size={14} />,
    instagram: <Instagram size={14} />,
};

const SURFACE = '#ffffff';
const SURFACE_ALT = '#f8fafc';
const BORDER = 'rgba(148, 163, 184, 0.22)';
const TEXT = '#0f172a';
const MUTED = '#64748b';

export default function ProfileCompletionBanner({ completion }: { completion: ProfileCompletionData | null }) {
    const router = useRouter();

    if (!completion || completion.isComplete) return null;

    const { percentage, checklist } = completion;
    const pending = checklist.filter(c => !c.done);
    const done = checklist.filter(c => c.done);

    // Progress ring
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = (percentage / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            style={{
                position: 'relative',
                marginBottom: '24px',
                padding: '28px 32px',
                borderRadius: '28px',
                background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 42%, #f5f3ff 100%)',
                border: '1px solid rgba(251,191,36,0.18)',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(15,23,42,0.06)',
            }}
        >
            {/* Subtle glow */}
            <div style={{
                position: 'absolute', top: '-30px', right: '10%', width: '300px', height: '160px',
                borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(251,191,36,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Progress Ring */}
                <div style={{ flexShrink: 0, position: 'relative', width: '96px', height: '96px' }}>
                    <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="6" />
                        <motion.circle
                            cx="48" cy="48" r={radius} fill="none"
                            stroke={percentage >= 80 ? '#4ade80' : percentage >= 50 ? '#fbbf24' : '#f87171'}
                            strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: circumference - strokeDash }}
                            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{
                            fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px',
                            color: TEXT, lineHeight: '1',
                        }}>
                            {percentage}%
                        </span>
                        <span style={{ fontSize: '10px', color: MUTED, marginTop: '2px' }}>
                            complete
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
                        <h3 style={{
                            fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '16px',
                            color: TEXT, letterSpacing: '-0.02em',
                        }}>
                            Complete Your Profile to Get Discovered
                        </h3>
                    </div>
                    <p style={{ fontSize: '13px', color: MUTED, lineHeight: '1.6', marginBottom: '18px' }}>
                        Your profile will only appear in the Brand Portal after all required information is completed.
                        Add your profile photo, bio, pricing, and connect your Instagram to start receiving brand requests.
                    </p>

                    {/* Checklist */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                        gap: '6px', marginBottom: '18px',
                    }}>
                        {/* Pending items first */}
                        {pending.map(item => (
                            <div key={item.key} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 12px', borderRadius: '10px',
                                background: 'rgba(251,191,36,0.06)',
                                border: '1px solid rgba(251,191,36,0.12)',
                            }}>
                                <div style={{
                                    width: '22px', height: '22px', borderRadius: '6px',
                                    background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fbbf24', flexShrink: 0,
                                }}>
                                    {ICON_MAP[item.key] || <AlertTriangle size={12} />}
                                </div>
                                <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '600' }}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                        {/* Done items */}
                        {done.map(item => (
                            <div key={item.key} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 12px', borderRadius: '10px',
                                background: SURFACE_ALT,
                                border: `1px solid ${BORDER}`,
                            }}>
                                <div style={{
                                    width: '22px', height: '22px', borderRadius: '6px',
                                    background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#4ade80', flexShrink: 0,
                                }}>
                                    <CheckCircle2 size={12} />
                                </div>
                                <span style={{
                                    fontSize: '12px', color: MUTED, fontWeight: '500',
                                    textDecoration: 'line-through',
                                }}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => router.push('/dashboard/influencer/profile')}
                        style={{
                            padding: '12px 28px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #7B3FF2, #A855F7)',
                            border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 20px rgba(123,63,242,0.35)',
                            transition: 'all 200ms ease', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(123,63,242,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(123,63,242,0.35)'; }}
                    >
                        Complete Profile <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
