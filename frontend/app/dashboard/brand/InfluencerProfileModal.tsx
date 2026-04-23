'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Instagram, ExternalLink, TrendingUp, BarChart3, Heart, MessageCircle, DollarSign, Film, Star, Calendar, PieChart as PieChartIcon, Users, Play, Zap, Shield, Target, TrendingDown, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

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
    followerGrowthRate?: number;
    audienceDemographics?: {
        countries?: { name: string; percentage: number }[];
        ageRanges?: { range: string; percentage: number }[];
        gender?: { male: number; female: number };
    };
}

interface Media {
    id: string;
    mediaUrl: string;
    permalink: string;
    mediaType: string;
    caption: string;
    likeCount: number;
    commentsCount: number;
    playCount?: number;
    timestamp: string;
}

interface ProfileModalProps {
    influencer: any;
    onClose: () => void;
    onRequestCollaboration: () => void;
}

const formatNum = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
    return num.toString();
};

const formatDateShort = (isoString: string) => {
    try {
        const d = new Date(isoString);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
        return '';
    }
};

const COLORS = ['#7B3FF2', '#A855F7', '#f472b6', '#38bdf8', '#34d399', '#facc15'];

// ── Gauge Component for Cost Efficiency ──
function GaugeChart({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
    const radius = 60;
    const circumference = Math.PI * radius;
    const pct = Math.min(value / max, 1);
    const strokeDash = pct * circumference;

    return (
        <div style={{ textAlign: 'center' }}>
            <svg width="140" height="80" viewBox="0 0 140 80">
                <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: '#fff', marginTop: '-20px' }}>
                {value > 0 ? `$${value.toFixed(2)}` : '—'}
            </p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{label}</p>
        </div>
    );
}

// ── Insight Chip Component ──
function InsightChip({ icon, label, value, color, description }: { icon: React.ReactNode; label: string; value: string; color: string; description?: string }) {
    return (
        <div style={{
            padding: '16px', borderRadius: '16px', background: `${color}08`,
            border: `1px solid ${color}20`, flex: '1 1 200px', minWidth: '200px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ color, flexShrink: 0 }}>{icon}</div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>{label}</span>
            </div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '16px', color: '#fff', marginBottom: description ? '6px' : 0 }}>{value}</p>
            {description && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.5' }}>{description}</p>}
        </div>
    );
}

export default function InfluencerProfileModal({ influencer, onClose, onRequestCollaboration }: ProfileModalProps) {
    const [timeRange, setTimeRange] = useState<7 | 15 | 30 | 90>(30);
    const [dpError, setDpError] = useState(false);

    if (!influencer) return null;

    const { profile, instagram, fitScore, starRating, qualityLabel, analytics, recentPosts } = influencer;
    
    // Priority: backend profilePictureUrl (from Instagram API) > manual instagramDPURL > fallback
    const dp       = profile?.profilePictureUrl || profile?.instagramDPURL   || profile?.profileImageURL  || instagram?.profilePictureURL;
    const handle   = profile?.instagramUsername || instagram?.username;
    const initials = (profile?.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const followers = profile?.followersCount  || instagram?.followersCount || 0;
    const baseEngagement = profile?.engagementRate || analytics?.engagementRate || 0;
    const igLink   = handle ? `https://instagram.com/${handle}` : '#';
    const bio      = profile?.instagramBiography || profile?.shortBio || instagram?.biography || 'No biography available.';
    const country  = profile?.countryOfResidence || null;
    const city     = profile?.city || null;

    // Pricing — read flat card fields first, fall back to nested profile
    const postCost = profile?.avgPostCostUSD || profile?.avgPostPrice || 0;
    const reelCost = profile?.avgReelCostUSD || profile?.avgReelPrice || 0;

    // Avatar: try DP URL with an img error fallback via state
    const safeRecentPosts: Media[] = Array.isArray(recentPosts) ? recentPosts : [];

    const filteredPosts = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - timeRange);
        return safeRecentPosts.filter(p => new Date(p.timestamp) >= cutoff).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [safeRecentPosts, timeRange]);

    const derived = useMemo(() => {
        if (filteredPosts.length === 0) {
            return { postsCount: 0, avgLikes: 0, avgComments: 0, engagementRate: 0, chartData: [], reelCount: 0, imageCount: 0, totalEngagement: 0 };
        }
        let tk = 0, tc = 0, reelCount = 0, imageCount = 0;
        const pts: any[] = [];
        filteredPosts.forEach(p => {
            tk += p.likeCount || 0;
            tc += p.commentsCount || 0;
            if (p.mediaType === 'VIDEO' || p.mediaType === 'REELS') reelCount++; else imageCount++;
            const totalEng = (p.likeCount || 0) + (p.commentsCount || 0);
            const er = followers > 0 ? (totalEng / followers) * 100 : 0;
            pts.push({
                date: formatDateShort(p.timestamp),
                title: p.caption ? p.caption.substring(0, 15) + '...' : 'Post',
                likes: p.likeCount || 0,
                comments: p.commentsCount || 0,
                engagementRate: parseFloat(er.toFixed(2)),
                totalEng,
                isReel: p.mediaType === 'VIDEO' || p.mediaType === 'REELS'
            });
        });
        const postsCount = filteredPosts.length;
        const avgLikes = Math.round(tk / postsCount);
        const avgComments = Math.round(tc / postsCount);
        const windowER = followers > 0 ? (((tk + tc) / postsCount) / followers) * 100 : 0;
        return { postsCount, avgLikes, avgComments, engagementRate: parseFloat(windowER.toFixed(2)), chartData: pts, reelCount, imageCount, totalEngagement: tk + tc };
    }, [filteredPosts, followers]);

    const displayEngagement  = derived.postsCount > 0 ? derived.engagementRate  : baseEngagement;
    const displayAvgLikes    = derived.postsCount > 0 ? derived.avgLikes    : (profile?.avgLikes    || analytics?.avgLikesPerPost    || 0);
    const displayAvgComments = derived.postsCount > 0 ? derived.avgComments : (profile?.avgComments || analytics?.avgCommentsPerPost || 0);

    // ─ Commercial Metrics (corrected formulas) ──────────────────────────────
    // Engagement defined as: likes + comments per post (consistent across all screens)
    const avgEngPerPost = derived.postsCount > 0
        ? derived.totalEngagement / derived.postsCount
        : (displayAvgLikes + displayAvgComments);

    // Cost Per Engagement: use post cost; fall back to reel cost if post cost missing
    const activeCost = postCost > 0 ? postCost : reelCost;
    const costPerEngagement = activeCost > 0 && avgEngPerPost > 0
        ? activeCost / avgEngPerPost : 0;
    // >$500 CPE is unrealistic — flag as out-of-range
    const cpeIsValid = costPerEngagement > 0 && costPerEngagement < 500;

    // CPM: Cost Per 1,000 estimated organic impressions.
    // Instagram organic reach is ~15–30% of followers. Use 20% as conservative floor.
    // This prevents near-zero engagement rates from inflating CPM to $15,000+.
    const ORGANIC_REACH_RATE = 0.20;
    const estimatedImpressions = Math.max(
        followers * ORGANIC_REACH_RATE,
        followers * (displayEngagement / 100) * 5
    );
    const rawCPM = activeCost > 0 && estimatedImpressions > 0
        ? (activeCost / estimatedImpressions) * 1000 : 0;
    const cpmIsValid = rawCPM > 0 && rawCPM <= 200;
    const cpm = cpmIsValid ? rawCPM : 0;
    const cpmLabel = rawCPM > 200 ? 'Insufficient reach data' : null;

    // ─ AI Insights ───────────────────────────────────────────────────────────
    const bestFormat = derived.reelCount > derived.imageCount ? 'Reels / Video' : derived.imageCount > derived.reelCount ? 'Static Posts' : 'Mixed';
    const engagementHealth = displayEngagement >= 5 ? 'Excellent' : displayEngagement >= 3 ? 'Strong' : displayEngagement >= 1.5 ? 'Average' : displayEngagement > 0 ? 'Below Average' : 'Unknown';
    const engagementHealthColor = displayEngagement >= 5 ? '#4ade80' : displayEngagement >= 3 ? '#60d5f8' : displayEngagement >= 1.5 ? '#fbbf24' : '#f87171';
    const audienceQuality = followers >= 50000 && displayEngagement >= 2 ? 'High' : followers >= 10000 && displayEngagement >= 1.5 ? 'Medium' : 'Standard';
    // Recommendation mirrors backend strict thresholds (35 / 50 / 65 / 80)
    const currentFitScore = fitScore || 0;
    const recommendationScore =
        currentFitScore >= 80 ? 'Strongly Recommended' :
        currentFitScore >= 65 ? 'Recommended' :
        currentFitScore >= 50 ? 'Moderate Fit' :
        currentFitScore >= 35 ? 'Worth Considering' : 'Low Fit';
    const recommendationColor =
        currentFitScore >= 80 ? '#4ade80' :
        currentFitScore >= 65 ? '#60d5f8' :
        currentFitScore >= 50 ? '#fbbf24' :
        currentFitScore >= 35 ? '#f87171' : 'rgba(255,255,255,0.3)';
    // Scoring reasons surfaced from backend card object
    const scoringReasons: string[] = (influencer as any)?.scoringReasons || [];

    const TimeButton = ({ days, label }: { days: any, label: string }) => (
        <button onClick={() => setTimeRange(days)} style={{
            padding: '6px 14px', borderRadius: '99px',
            border: `1px solid ${timeRange === days ? 'rgba(123,63,242,0.6)' : 'rgba(255,255,255,0.08)'}`,
            background: timeRange === days ? 'rgba(123,63,242,0.18)' : 'rgba(255,255,255,0.03)',
            color: timeRange === days ? '#c084fc' : 'rgba(255,255,255,0.4)',
            fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 180ms ease', whiteSpace: 'nowrap',
        }}>{label}</button>
    );

    const EmptyChartState = ({ message }: { message: string }) => (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', maxWidth: '80%' }}>{message}</p>
        </div>
    );

    const customTooltipStyle = {
        backgroundColor: 'rgba(20,18,34,0.95)',
        border: '1px solid rgba(123,63,242,0.2)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '12px',
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)', overflowY: 'auto', padding: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', background: 'rgba(10,9,20,0.97)', border: '1px solid rgba(123,63,242,0.25)', borderRadius: '36px', boxShadow: '0 0 100px rgba(123,63,242,0.2)', overflow: 'hidden', paddingBottom: '30px' }}>

                    {/* Gradient Header Banner */}
                    <div style={{ position: 'relative', height: '140px', background: 'linear-gradient(135deg, rgba(123,63,242,0.4) 0%, rgba(168,85,247,0.1) 100%)', display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
                        <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms ease' }}>
                            <X size={16} />
                        </button>
                        <div style={{ position: 'absolute', bottom: '-45px', left: '36px', width: '110px', height: '110px', borderRadius: '50%', border: '4px solid #0A0914', background: (dp && !dpError) ? '#000' : 'linear-gradient(135deg, #7B3FF2, #A855F7)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                            {(dp && !dpError) ? <img src={dp} alt={profile?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setDpError(true)} /> : initials}
                        </div>
                    </div>

                    <div style={{ padding: '60px 36px 0', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                        {/* Left Column */}
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
                                {country && (
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        📍 {city ? `${city}, ` : ''}{country}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '24px' }}>{bio}</p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button onClick={onRequestCollaboration} style={{ flex: 1, padding: '14px 20px', borderRadius: '16px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(123,63,242,0.3)', transition: 'transform 200ms ease', fontFamily: 'inherit' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                                    <Send size={15} /> Send Request
                                </button>
                                {handle && (
                                    <a href={igLink} target="_blank" rel="noopener noreferrer" style={{ padding: '14px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 200ms ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                                        <ExternalLink size={15} /> IG
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={{ flex: '1 1 300px' }}>
                            <div style={{ padding: '18px', borderRadius: '20px', background: 'linear-gradient(145deg, rgba(20,18,34,0.9), rgba(123,63,242,0.08))', border: '1px solid rgba(123,63,242,0.2)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(123,63,242,0.15)', border: '1px solid rgba(123,63,242,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#c084fc' }}>
                                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', lineHeight: '1' }}>{fitScore ?? 0}</span>
                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '2px' }}>/100</span>
                                </div>
                                <div>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Brand Fit Score</p>
                                    <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '4px' }}>{qualityLabel || 'Low Fit'}</h3>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={13} fill={star <= (starRating || 1) ? '#facc15' : 'transparent'} color={star <= (starRating || 1) ? '#facc15' : 'rgba(255,255,255,0.2)'} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                                        <TrendingUp size={13} /><span style={{ fontSize: '12px', fontWeight: '600' }}>Subscribers</span>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff' }}>{formatNum(followers)}</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', marginBottom: '8px' }}>
                                        <DollarSign size={13} /><span style={{ fontSize: '12px', fontWeight: '600' }}>Avg Cost</span>
                                    </div>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#e9d5ff' }}>
                                        {postCost > 0 ? `$${postCost.toLocaleString()}` : 'Negotiable'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Header with Time Selector */}
                    <div style={{ padding: '36px 36px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>Performance Analytics</h2>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Visualized metrics based on real historical data.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Calendar size={14} style={{ color: 'rgba(255,255,255,0.3)', marginRight: '4px' }} />
                            <TimeButton days={7} label="7 Days" />
                            <TimeButton days={15} label="15 Days" />
                            <TimeButton days={30} label="30 Days" />
                            <TimeButton days={90} label="90 Days" />
                        </div>
                    </div>

                    {/* Dynamic Analytics Overview */}
                    <div style={{ padding: '0 36px', marginBottom: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart3 size={13}/> Est. Engagement Rate</p>
                                <p style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: '800', color: '#fff' }}>{displayEngagement > 0 ? `${displayEngagement}%` : '—'}</p>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={13}/> Average Likes</p>
                                <p style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: '800', color: '#fff' }}>{formatNum(displayAvgLikes)}</p>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={13}/> Average Comments</p>
                                <p style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: '800', color: '#fff' }}>{formatNum(displayAvgComments)}</p>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={13}/> Posting Frequency</p>
                                <p style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: '800', color: '#fff' }}>{derived.postsCount} <span style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)', fontWeight:'500'}}>posts</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Chart Visualizations */}
                    <div style={{ padding: '0 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Engagement Trend */}
                        <div style={{ background: 'rgba(20,18,34,0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <BarChart3 size={16} color="#c084fc" />
                                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Engagement & Reach Trend</h3>
                            </div>
                            {derived.chartData.length > 1 ? (
                                <div style={{ height: '240px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={derived.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorTk" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                                            <RechartsTooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#fff' }} formatter={(val: number) => val.toLocaleString()} />
                                            <Area type="monotone" dataKey="totalEng" name="Total Engagement" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#colorEng)" />
                                            <Area type="monotone" dataKey="likes" name="Likes" stroke="#f472b6" strokeWidth={2} fillOpacity={1} fill="url(#colorTk)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyChartState message={`Not enough post activity within the last ${timeRange} days to plot an engagement trend.`} />
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                            {/* Likes vs Comments */}
                            <div style={{ background: 'rgba(20,18,34,0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <MessageCircle size={16} color="#38bdf8" />
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Post Performance Composition</h3>
                                </div>
                                {derived.chartData.length > 0 ? (
                                    <div style={{ height: '220px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={derived.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                                                <RechartsTooltip contentStyle={customTooltipStyle} cursor={{fill: 'rgba(255,255,255,0.04)'}} formatter={(val: number) => val.toLocaleString()} />
                                                <Bar dataKey="likes" name="Likes" stackId="a" fill="#7B3FF2" radius={[0, 0, 4, 4]} />
                                                <Bar dataKey="comments" name="Comments" stackId="a" fill="#60d5f8" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyChartState message="No post data available for the selected period." />
                                )}
                            </div>

                            {/* Content Type */}
                            <div style={{ background: 'rgba(20,18,34,0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <Film size={16} color="#4ade80" />
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Best Performing Content Type</h3>
                                </div>
                                {derived.chartData.length > 0 ? (() => {
                                    const byType = { reels: 0, posts: 0 };
                                    derived.chartData.forEach(d => d.isReel ? byType.reels += d.totalEng : byType.posts += d.totalEng);
                                    const pieData = [
                                        { name: 'Reels / Video', value: byType.reels },
                                        { name: 'Static Posts', value: byType.posts }
                                    ].filter(d => d.value > 0);
                                    if (pieData.length === 0) return <EmptyChartState message="Insufficient data to calculate content type performance." />;
                                    return (
                                        <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center' }}>
                                            <ResponsiveContainer width="60%" height="100%">
                                                <PieChart>
                                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={customTooltipStyle} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div style={{ flex: '1' }}>
                                                {pieData.map((d, i) => (
                                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLORS[i % COLORS.length] }}></div>
                                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{d.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <EmptyChartState message="No post data available for the selected period." />
                                )}
                            </div>

                            {/* Audience Demographics */}
                            <div style={{ background: 'rgba(20,18,34,0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <Users size={16} color="#facc15" />
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Audience Demographics</h3>
                                </div>
                                {analytics?.audienceDemographics?.countries ? (() => {
                                    const c = analytics.audienceDemographics.countries;
                                    const cKeys = Object.keys(c).sort((a: string, b: string) => (c as any)[b] - (c as any)[a]).slice(0, 5);
                                    let total = 0;
                                    cKeys.forEach((k: string) => total += (c as any)[k]);
                                    const demoData = cKeys.map((k: string) => ({ name: k, value: total > 0 ? ((c as any)[k] / total) * 100 : 0 }));
                                    if (demoData.length === 0) return <EmptyChartState message="Insufficient demographic data." />;
                                    return (
                                        <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center' }}>
                                            <ResponsiveContainer width="60%" height="100%">
                                                <PieChart>
                                                    <Pie data={demoData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                                                        {demoData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <RechartsTooltip formatter={(val: number) => val.toFixed(1) + '%'} contentStyle={customTooltipStyle} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {demoData.map((d, i) => (
                                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '10px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }}></div>
                                                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{d.name.split(',')[0]}</p>
                                                        </div>
                                                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{d.value.toFixed(1)}%</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <EmptyChartState message="Demographic data not yet synced. Re-connect Instagram to load demographics." />
                                )}
                            </div>
                        </div>

                            {/* ── COMMERCIAL INTELLIGENCE ── */}
                        <div style={{ background: 'rgba(20,18,34,0.4)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(74,222,128,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                <DollarSign size={16} color="#4ade80" />
                                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Commercial Intelligence</h3>
                                <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '99px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', fontSize: '10px', color: '#4ade80', fontWeight: '700' }}>ROI Metrics</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)' }}>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Post Price</p>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: '#4ade80' }}>{postCost > 0 ? `$${postCost.toLocaleString()}` : <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Pricing not published</span>}</p>
                                </div>
                                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(96,213,248,0.06)', border: '1px solid rgba(96,213,248,0.12)' }}>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reel Price</p>
                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: '#60d5f8' }}>{reelCost > 0 ? `$${reelCost.toLocaleString()}` : <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Pricing not published</span>}</p>
                                </div>
                                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost Per Engagement</p>
                                    {cpeIsValid
                                        ? <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: '#a78bfa' }}>${costPerEngagement.toFixed(2)}</p>
                                        : <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>Not enough engagement data</p>
                                    }
                                    {cpeIsValid && <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>Post cost ÷ avg engagement (likes+comments)</p>}
                                </div>
                                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)' }}>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. CPM (by Reach)</p>
                                    {cpm > 0
                                        ? <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: '#fbbf24' }}>${cpm.toFixed(2)}</p>
                                        : <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>{cpmLabel || 'Insufficient delivery data'}</p>
                                    }
                                    {cpm > 0 && <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>Cost per 1,000 estimated impressions (20% reach baseline)</p>}
                                </div>
                            </div>
                            {/* CPE Gauge — only show when valid data exists */}
                            {cpeIsValid ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                                    <GaugeChart
                                        value={costPerEngagement}
                                        max={5}
                                        label="Cost per Engagement — lower is better"
                                        color={costPerEngagement < 0.5 ? '#4ade80' : costPerEngagement < 1.5 ? '#fbbf24' : '#f87171'}
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>Cost efficiency visualization requires both pricing and engagement data.</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Recent Posts Grid */}
                    {safeRecentPosts.length > 0 && (
                        <div style={{ padding: '36px 36px 0', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            <p style={{ fontSize: '15px', color: '#fff', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Instagram size={16} /> Recent Content Feed
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                                {safeRecentPosts.slice(0, 3).map((post: Media) => (
                                    <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', borderRadius: '20px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', aspectRatio: '4/5' }}>
                                        <img src={post.mediaUrl} alt="Instagram Media" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, transition: 'transform 400ms ease, opacity 400ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.9'; }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)', padding: '30px 16px 16px', pointerEvents: 'none' }}>
                                            {(post.mediaType === 'VIDEO' || post.mediaType === 'REELS') && (
                                                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: '6px', borderRadius: '50%' }}>
                                                    <Play size={14} color="#fff" fill="#fff" />
                                                </div>
                                            )}
                                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', display: 'block' }}>{formatDateShort(post.timestamp)}</p>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff', fontSize: '13px', fontWeight: '700' }}><Heart size={14} fill="#f472b6" color="#f472b6" /> {formatNum(post.likeCount)}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff', fontSize: '13px', fontWeight: '700' }}><MessageCircle size={14} fill="#60d5f8" color="#60d5f8" /> {formatNum(post.commentsCount)}</span>
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
