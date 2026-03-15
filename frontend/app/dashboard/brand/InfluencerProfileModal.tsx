'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Instagram, ExternalLink, TrendingUp, BarChart3, Heart, MessageCircle, DollarSign, Film, Star } from 'lucide-react';
import { brandAPI } from '@/lib/api';

interface QualityScore {
    qualityScore: number;
    starRating: number;
    qualityLabel: string;
}

interface Analytics {
    engagementRate?: number;
    avgLikesPerPost?: number;
    avgCommentsPerPost?: number;
    avgViewsPerPost?: number;
}

interface Media {
    id: string;
    mediaUrl: string;
    permalink: string;
    mediaType: string;
    caption: string;
    likeCount: number;
    commentsCount: number;
    timestamp: string;
}

interface ProfileModalProps {
    influencer: any; // { profile, instagram, qualityScore, analytics, recentPosts }
    onClose: () => void;
    onRequestCollaboration: () => void;
}

const formatNum = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
    return num.toString();
};

export default function InfluencerProfileModal({ influencer, onClose, onRequestCollaboration }: ProfileModalProps) {
    if (!influencer) return null;

    const { profile, instagram, qualityScore, starRating, qualityLabel, analytics, recentPosts } = influencer;
    
    // Fallbacks
    const dp = profile?.profileImageURL || instagram?.profilePictureURL;
    const handle = instagram?.username || profile?.instagramUsername;
    const initials = (profile?.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const followers = profile?.followersCount || instagram?.followersCount || 0;
    const engagement = profile?.engagementRate || analytics?.engagementRate || 0;
    const igLink = handle ? `https://instagram.com/${handle}` : '#';
    const bio = instagram?.biography || profile?.shortBio || 'No biography available.';

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)', overflowY: 'auto', padding: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className="glass-card" style={{ maxWidth: '850px', margin: '0 auto', background: 'rgba(10,9,20,0.97)', border: '1px solid rgba(123,63,242,0.25)', borderRadius: '36px', boxShadow: '0 0 100px rgba(123,63,242,0.2)', overflow: 'hidden', paddingBottom: '30px' }}>

                    {/* Gradient Header Banner */}
                    <div style={{ position: 'relative', height: '140px', background: 'linear-gradient(135deg, rgba(123,63,242,0.4) 0%, rgba(168,85,247,0.1) 100%)', display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
                        <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms ease' }}>
                            <X size={16} />
                        </button>
                        <div style={{ position: 'absolute', bottom: '-45px', left: '36px', width: '110px', height: '110px', borderRadius: '50%', border: '4px solid #0A0914', background: dp ? '#000' : 'linear-gradient(135deg, #7B3FF2, #A855F7)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                            {dp ? <img src={dp} alt={profile?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                        </div>
                    </div>

                    <div style={{ padding: '60px 36px 0', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                        
                        {/* Left Column (Info) */}
                        <div style={{ flex: '1 1 300px' }}>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '26px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                                {profile?.fullName || 'Influencer Profile'}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                {handle && (
                                    <a href={igLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c084fc', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                                        <Instagram size={14} /> @{handle}
                                    </a>
                                )}
                                {profile?.niche && (
                                    <span style={{ padding: '3px 10px', borderRadius: '99px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#d8b4fe', fontSize: '11px', fontWeight: '700' }}>{profile.niche}</span>
                                )}
                                {profile?.country && (
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        📍 {profile.city ? `${profile.city}, ` : ''}{profile.country}
                                    </span>
                                )}
                            </div>

                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '24px' }}>
                                {bio}
                            </p>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button onClick={onRequestCollaboration} style={{ flex: 1, padding: '14px 20px', borderRadius: '16px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(123,63,242,0.3)', transition: 'transform 200ms ease' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                                    <Send size={15} /> Send Collaboration Request
                                </button>
                                {handle && (
                                    <a href={igLink} target="_blank" rel="noopener noreferrer" style={{ padding: '14px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 200ms ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                                        <ExternalLink size={15} /> Instagram
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Right Column (Stats) */}
                        <div style={{ flex: '1 1 300px' }}>
                            {/* Quality Score Badge */}
                            <div style={{ padding: '18px', borderRadius: '20px', background: 'linear-gradient(145deg, rgba(20,18,34,0.9), rgba(123,63,242,0.08))', border: '1px solid rgba(123,63,242,0.2)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(123,63,242,0.15)', border: '1px solid rgba(123,63,242,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#c084fc' }}>
                                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', lineHeight: '1' }}>{qualityScore}</span>
                                </div>
                                <div>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>AI Quality Assessment</p>
                                    <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '4px' }}>{qualityLabel}</h3>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={13} fill={star <= starRating ? '#facc15' : 'transparent'} color={star <= starRating ? '#facc15' : 'rgba(255,255,255,0.2)'} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Core Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                                        <TrendingUp size={13} /><span style={{ fontSize: '12px', fontWeight: '600' }}>Followers</span>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff' }}>{formatNum(followers)}</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                                        <BarChart3 size={13} /><span style={{ fontSize: '12px', fontWeight: '600' }}>Engagement</span>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff' }}>{engagement > 0 ? `${engagement}%` : '—'}</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                                        <Heart size={13} /><span style={{ fontSize: '12px', fontWeight: '600' }}>Avg Likes</span>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff' }}>{formatNum(profile?.avgLikes || analytics?.avgLikesPerPost || 0)}</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', marginBottom: '8px' }}>
                                        <DollarSign size={13} /><span style={{ fontSize: '12px', fontWeight: '600' }}>Avg Post Cost</span>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#e9d5ff' }}>
                                        {profile?.avgPostCostUSD > 0 ? `$${profile.avgPostCostUSD.toLocaleString()}` : 'Negotiable'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Posts Grid */}
                    {recentPosts && recentPosts.length > 0 && (
                        <div style={{ padding: '36px 36px 0' }}>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Instagram size={14} /> Recent Instagram Content
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                {recentPosts.map((post: Media) => (
                                    <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', aspectRatio: '1' }}>
                                        <img src={post.mediaUrl} alt="Instagram Media" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'transform 300ms ease, opacity 300ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.8'; }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '24px 12px 12px', pointerEvents: 'none' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '12px', fontWeight: '600' }}><Heart size={12} fill="#fff" /> {formatNum(post.likeCount)}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '12px', fontWeight: '600' }}><MessageCircle size={12} fill="#fff" /> {formatNum(post.commentsCount)}</span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
