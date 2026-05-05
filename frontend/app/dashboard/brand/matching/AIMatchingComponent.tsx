'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, UserX, Globe, TrendingUp, BarChart3, Image, Film, Star, ShieldCheck, Instagram, Users, User } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui';

const NICHE_COLORS: Record<string, string> = {
    Fashion: '#C2340A', Fitness: '#4ade80', Tech: '#38bdf8', Food: '#fbbf24',
    Travel: '#facc15', Beauty: '#f472b6', Gaming: '#a855f7', Lifestyle: '#FF6B1A',
    Education: '#38bdf8', Entertainment: '#E8400A', Finance: '#34d399', Business: '#818cf8',
};

const InfluencerProfileModal = dynamic(() => import('../InfluencerProfileModal'));
const CreateRequestModal = dynamic(() => import('../CreateRequestModal'));

export default function AIMatchingComponent() {
    const [aiReply, setAiReply] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [influencers, setInfluencers] = useState<any[]>([]);
    
    // Modal states
    const [selectedInfluencerProfile, setSelectedInfluencerProfile] = useState<any>(null);
    const [selectedForCollaboration, setSelectedForCollaboration] = useState<any>(null);
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

    const handleAnalyze = async () => {
        setLoading(true);
        setInfluencers([]);
        setAiReply('');
        
        try {
            const res = await brandAPI.profileMatching();
            if (res.data.success) {
                setAiReply(res.data.aiReply);
                setInfluencers(res.data.influencers || []);
                if (res.data.influencers?.length === 0) {
                    toast.error('No direct matches found. Try broadening your brand profile preferences.');
                }
            } else {
                toast.error(res.data.message || 'Failed to match influencers');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Could not load recommendations right now');
        } finally {
            setLoading(false);
        }
    };

    const formatNum = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
        return num.toString();
    };

    const handleOpenProfile = async (inf: any) => {
        const uid = inf.userId?._id || inf.userId;
        try {
            const res = await brandAPI.getInfluencerDetail(uid);
            if (res.data?.success) {
                setSelectedInfluencerProfile(res.data);
            } else {
                setSelectedInfluencerProfile(inf);
            }
        } catch {
            toast.error('Could not load detailed profile.');
            setSelectedInfluencerProfile(inf);
        }
    };

    const handleRequestCollaboration = (inf: any) => {
        setSelectedInfluencerProfile(null);
        setSelectedForCollaboration({
            _id:      inf.userId?._id || inf.userId,
            fullName: inf.fullName,
            niche:    inf.niche,
            followers: inf.followersCount || 0,
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{
                borderRadius: '28px',
                border: '1px solid #EDD9BC',
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(12px)',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(26,10,0,0.04)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#C2340A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <Bot size={32} color="#fff" />
                </div>
                <div>
                    <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#1A0A00', letterSpacing: '-0.04em', marginBottom: '8px' }}>
                        Smart AI Matching
                    </h2>
                    <p style={{ fontSize: '15px', color: '#7A5030', maxWidth: '500px', lineHeight: 1.6 }}>
                        Let our AI analyze your brand profile, target audience, and marketing goals to discover perfectly matched creators for your next campaign.
                    </p>
                </div>
                
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{
                        marginTop: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#C2340A',
                        color: '#fff',
                        padding: '16px 32px',
                        borderRadius: '99px',
                        fontSize: '15px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 15px rgba(194,52,10,0.2)'
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E8400A'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#C2340A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <BarChart3 size={20} />}
                    {loading ? 'Analyzing Profile...' : 'Analyze Brand Profile'}
                </button>
            </div>

            {/* AI Reasoning Summary */}
            <AnimatePresence>
                {aiReply && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <GlassCard padding="24px" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#C2340A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Bot size={18} color="#fff" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C2340A', marginBottom: '8px' }}>AI Match Analysis</h4>
                                    <p style={{ fontSize: '15px', color: '#1A0A00', lineHeight: 1.6 }}>{aiReply}</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Grid */}
             {influencers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.01em' }}>Recommended Influencers ({influencers.length})</h3>
                </div>
            )}
            {influencers.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    <AnimatePresence>
                        {influencers.map((inf: any, i: number) => {
                            const nc = NICHE_COLORS[inf.niche || ''] || '#E8400A';
                            const dp = inf.profilePictureUrl || inf.profileImageURL || inf.instagramDPURL || null;
                            const handle = inf.username || null;
                            const initials = (inf.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const followers = inf.followersCount || 0;
                            const engagement = typeof inf.engagementRate === 'number' ? inf.engagementRate.toFixed(2) : '0.00';
                            const igLink = handle ? `https://instagram.com/${handle}` : '#';

                            return (
                                <motion.div key={inf._id || i} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04, duration: 0.35 }}>
                                    <GlassCard padding="0" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <div style={{ padding: '24px', flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
                                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0, overflow: 'hidden', background: nc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#fff' }}>
                                                        {(dp && !brokenImages.has(inf._id)) ? <img src={dp} alt={inf.fullName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setBrokenImages(prev => new Set([...prev, inf._id]))} /> : initials}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <p style={{ fontWeight: 600, color: '#1A0A00', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {inf.fullName || 'Influencer'}
                                                            </p>
                                                            <ShieldCheck size={14} style={{ color: '#C2340A', flexShrink: 0 }} />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            {handle && (
                                                                <a href={igLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#E8400A', textDecoration: 'none', fontWeight: 500 }} onClick={e => e.stopPropagation()}>
                                                                    <Instagram size={11} /> @{handle}
                                                                </a>
                                                            )}
                                                            {inf.country && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Globe size={11} style={{ color: '#C4A882' }} />
                                                                    <p style={{ fontSize: '12px', color: '#7A5030', textTransform: 'capitalize' }}>{inf.country}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                    <p style={{ fontSize: '10px', color: '#C2340A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inf.qualityLabel}</p>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star key={star} size={11} fill={star <= (inf.starRating || 1) ? '#FF6B1A' : 'transparent'} color={star <= (inf.starRating || 1) ? '#FF6B1A' : '#EDD9BC'} />
                                                        ))}
                                                    </div>
                                                    <p style={{ fontSize: '10px', color: '#7A5030', fontWeight: 500 }}>Fit {inf.fitScore || 0}/100</p>
                                                </div>
                                            </div>

                                            <p style={{ fontSize: '13px', color: '#7A5030', lineHeight: 1.65, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '42px' }}>
                                                {inf.bio || 'No biography available.'}
                                            </p>

                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                                {inf.niche && <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(194,52,10,0.1)', border: '1px solid rgba(194,52,10,0.2)', color: '#C2340A', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>{inf.niche}</span>}
                                                <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.60)', border: '1px solid #EDD9BC', color: '#7A5030', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <TrendingUp size={12} /> {formatNum(followers)} Followers
                                                </span>
                                                <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.60)', border: '1px solid #EDD9BC', color: '#7A5030', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <BarChart3 size={12} /> {engagement}% ER
                                                </span>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.60)', border: '1px solid #EDD9BC' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7A5030', marginBottom: '4px' }}>
                                                        <Image size={12} /><span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Post</span>
                                                    </div>
                                                    <p style={{ fontWeight: 600, fontSize: '15px', color: '#1A0A00' }}>{inf.avgPostCostUSD > 0 ? `$${inf.avgPostCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                                </div>
                                                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.60)', border: '1px solid #EDD9BC' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7A5030', marginBottom: '4px' }}>
                                                        <Film size={12} /><span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Reel</span>
                                                    </div>
                                                    <p style={{ fontWeight: 600, fontSize: '15px', color: '#1A0A00' }}>{inf.avgReelCostUSD > 0 ? `$${inf.avgReelCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(255,255,255,0.40)', borderTop: '1px solid #EDD9BC', padding: '16px 24px', display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleOpenProfile(inf)}
                                                style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.80)', border: '1px solid #EDD9BC', color: '#C2340A', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.80)'; }}>
                                                View Profile
                                            </button>
                                            <button onClick={() => handleRequestCollaboration(inf)}
                                                style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#C2340A', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#E8400A'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#C2340A'; }}>
                                                <Send size={14} /> Request
                                            </button>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
            
            {/* Modals */}
            <AnimatePresence>
                {selectedInfluencerProfile && (
                    <InfluencerProfileModal
                        influencer={selectedInfluencerProfile}
                        onClose={() => setSelectedInfluencerProfile(null)}
                        onRequestCollaboration={() => handleRequestCollaboration(selectedInfluencerProfile)}
                    />
                )}
                {selectedForCollaboration && (
                    <CreateRequestModal
                        influencer={selectedForCollaboration}
                        onClose={() => setSelectedForCollaboration(null)}
                        onSuccess={() => {
                            setSelectedForCollaboration(null);
                            toast.success('Collaboration request sent!');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
