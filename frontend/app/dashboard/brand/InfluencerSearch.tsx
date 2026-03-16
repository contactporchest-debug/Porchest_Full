'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, TrendingUp, BarChart3, Send, Loader2, UserX, DollarSign, MessageCircle, Heart, Film, Star, ExternalLink, Image, Instagram } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import CreateRequestModal from './CreateRequestModal';
import InfluencerProfileModal from './InfluencerProfileModal';
import toast from 'react-hot-toast';

const NICHES = ['All', 'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance', 'Business', 'Other'];
const FOLLOWER_RANGES = ['Any', '1K–10K', '10K–100K', '100K–500K', '500K+'];
const COUNTRIES = ['Any', 'Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Saudi Arabia', 'Germany', 'France'];
const ENGAGEMENT_RANGES = ['Any', '> 1%', '> 3%', '> 5%', '> 10%'];
const COST_RANGES = ['Any', '< $50', '< $100', '< $500', '< $1000'];

const NICHE_COLORS: Record<string, string> = {
    Fashion: '#A855F7', Fitness: '#4ade80', Tech: '#60d5f8', Food: '#fb923c',
    Travel: '#facc15', Beauty: '#f472b6', Gaming: '#7B3FF2', Lifestyle: '#e879f9',
    Education: '#38bdf8', Entertainment: '#f97316', Finance: '#34d399', Business: '#818cf8',
};

export default function InfluencerSearch() {
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [niche, setNiche] = useState('All');
    const [followerRange, setFollowerRange] = useState('Any');
    const [country, setCountry] = useState('Any');
    const [engagementRange, setEngagementRange] = useState('Any');
    const [costRange, setCostRange] = useState('Any');
    
    // UI state for models
    const [selectedInfluencerProfile, setSelectedInfluencerProfile] = useState<any>(null); // Details Modal
    const [selectedForCollaboration, setSelectedForCollaboration] = useState<any>(null);   // Request Flow

    // Fetch influencers wrapper
    const fetchInfluencers = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {};
            if (niche !== 'All') params.niche = niche;
            
            if (followerRange === '1K–10K') { params.minFollowers = 1000; params.maxFollowers = 10000; }
            if (followerRange === '10K–100K') { params.minFollowers = 10000; params.maxFollowers = 100000; }
            if (followerRange === '100K–500K') { params.minFollowers = 100000; params.maxFollowers = 500000; }
            if (followerRange === '500K+') { params.minFollowers = 500000; }

            if (country !== 'Any') params.country = country === 'UAE' ? 'United Arab Emirates' : country;

            if (engagementRange === '> 1%') params.minEngagement = 1;
            if (engagementRange === '> 3%') params.minEngagement = 3;
            if (engagementRange === '> 5%') params.minEngagement = 5;
            if (engagementRange === '> 10%') params.minEngagement = 10;

            if (costRange === '< $50') params.maxPostCost = 50;
            if (costRange === '< $100') params.maxPostCost = 100;
            if (costRange === '< $500') params.maxPostCost = 500;
            if (costRange === '< $1000') params.maxPostCost = 1000;

            const res = await brandAPI.getInfluencers(params);
            setInfluencers(res.data.influencers || []);
        } catch {
            toast.error('Failed to load influencers');
        } finally {
            setLoading(false);
        }
    }, [niche, followerRange, country, engagementRange, costRange]);

    useEffect(() => { fetchInfluencers(); }, [fetchInfluencers]);

    // Local client-side filter
    const filtered = influencers.filter(inf => {
        const fullName = inf.profile?.fullName?.toLowerCase() || '';
        const infNiche = inf.profile?.niche?.toLowerCase() || '';
        const handle = inf.instagram?.username?.toLowerCase() || inf.profile?.instagramUsername?.toLowerCase() || '';
        const bio = inf.instagram?.biography?.toLowerCase() || inf.profile?.shortBio?.toLowerCase() || '';
        const search = query.toLowerCase();
        
        return !query || 
               fullName.includes(search) || 
               infNiche.includes(search) || 
               handle.includes(search) || 
               bio.includes(search);
    });

    const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
        <button onClick={onClick} style={{
            padding: '6px 14px', borderRadius: '99px',
            border: `1px solid ${active ? 'rgba(123,63,242,0.6)' : 'rgba(255,255,255,0.08)'}`,
            background: active ? 'rgba(123,63,242,0.18)' : 'rgba(255,255,255,0.03)',
            color: active ? '#c084fc' : 'rgba(255,255,255,0.4)',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 180ms ease',
            boxShadow: active ? '0 0 16px rgba(123,63,242,0.25)' : 'none',
            whiteSpace: 'nowrap'
        }}>{label}</button>
    );

    const formatNum = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
        return num.toString();
    };

    const handleOpenProfile = async (inf: any) => {
        try {
            // Fetch detailed view data
            const res = await brandAPI.getInfluencerDetail(inf.profile.userId?._id);
            if (res.data?.success) {
                setSelectedInfluencerProfile(res.data);
            } else {
                setSelectedInfluencerProfile(inf);
            }
        } catch (err) {
            toast.error('Could not load detailed profile.');
            setSelectedInfluencerProfile(inf);
        }
    };

    const handleRequestCollaboration = (inf: any) => {
        setSelectedInfluencerProfile(null);
        setSelectedForCollaboration({
            _id: inf.profile?.userId?._id,
            fullName: inf.profile?.fullName,
            niche: inf.profile?.niche,
            followers: inf.profile?.followersCount || inf.instagram?.followersCount || 0,
        });
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '24px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    Discover Influencers
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                    {loading ? 'Analyzing influencer network…' : `Showing ${filtered.length} curated matches`}
                </p>
            </div>

            {/* Search Top Bar */}
            <div style={{ position: 'relative', marginBottom: '18px' }}>
                <Search size={15} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                <input value={query} onChange={e => setQuery(e.target.value)} type="text"
                    placeholder="Search by influencer name, niche, or keywords…"
                    className="input-dark" style={{ paddingLeft: '46px', height: '50px', fontSize: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>

            {/* Filters Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700' }}>Niche</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {NICHES.map(n => <Pill key={n} label={n} active={niche === n} onClick={() => setNiche(n)} />)}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700' }}>Followers</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {FOLLOWER_RANGES.map(f => <Pill key={f} label={f} active={followerRange === f} onClick={() => setFollowerRange(f)} />)}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700' }}>Engagement</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ENGAGEMENT_RANGES.map(f => <Pill key={f} label={f} active={engagementRange === f} onClick={() => setEngagementRange(f)} />)}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700' }}>Country</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {COUNTRIES.map(f => <Pill key={f} label={f} active={country === f} onClick={() => setCountry(f)} />)}
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>
                    <Loader2 size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                    <p style={{ fontSize: '14px' }}>AI Matchmaker is analyzing profiles…</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div className="glass-card" style={{ padding: '60px', borderRadius: '28px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <UserX size={44} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '8px' }}>
                        No Matches Found
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', maxWidth: '380px', margin: '0 auto', lineHeight: '1.6' }}>
                        The network couldn't find an exact match. Try broading your criteria or searching another niche.
                    </p>
                </div>
            )}

            {/* Results Grid */}
            {!loading && filtered.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    <AnimatePresence>
                        {filtered.map((inf, i) => {
                            const p = inf.profile || {};
                            const ig = inf.instagram || {};
                            const nc = NICHE_COLORS[p.niche] || '#a78bfa';
                            
                            // Safe fallbacks for display
                            const dp = p.profileImageURL || ig.profilePictureURL;
                            const handle = ig.username || p.instagramUsername;
                            const initials = (p.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const followers = p.followersCount || ig.followersCount || 0;
                            const engagement = p.engagementRate || 0;
                            const igLink = handle ? `https://instagram.com/${handle}` : '#';

                            return (
                                <motion.div key={p._id || i} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04, duration: 0.35 }}
                                    className="glass-card flex-col" style={{ borderRadius: '26px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.06)', background: `linear-gradient(180deg, rgba(20,18,34,0.7) 0%, rgba(14,12,26,0.95) 100%)`, overflow: 'hidden' }}>

                                    <div style={{ padding: '24px 24px 16px', flex: 1 }}>
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                {/* DP */}
                                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg, #7B3FF2, ${nc})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#fff', boxShadow: `0 0 20px ${nc}40` }}>
                                                    {dp ? <img src={dp} alt={p.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', color: '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                                                        {p.fullName || 'Influencer'}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        {handle && (
                                                            <a href={igLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#d8b4fe', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                                                                <Instagram size={10} /> @{handle}
                                                            </a>
                                                        )}
                                                        {p.country && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Globe size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{p.country}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Quality Stars */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inf.qualityLabel}</p>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} size={11} fill={star <= (inf.starRating || 3) ? '#facc15' : 'transparent'} color={star <= (inf.starRating || 3) ? '#facc15' : 'rgba(255,255,255,0.2)'} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* BioSnippet */}
                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '42px' }}>
                                            {ig.biography || p.shortBio || 'No biography available.'}
                                        </p>

                                        {/* Tags */}
                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                            {p.niche && <span style={{ padding: '4px 12px', borderRadius: '99px', background: `${nc}12`, border: `1px solid ${nc}25`, color: nc, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{p.niche}</span>}
                                            <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <TrendingUp size={10} /> {formatNum(followers)} Subs
                                            </span>
                                            <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <BarChart3 size={10} /> {engagement}% ER
                                            </span>
                                        </div>

                                        {/* Rates */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.15)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c084fc', marginBottom: '4px' }}>
                                                    <Image size={11} /><span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Post</span>
                                                </div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#e9d5ff' }}>{p.avgPostCostUSD > 0 ? `$${p.avgPostCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                            </div>
                                            <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(123,63,242,0.06)', border: '1px solid rgba(123,63,242,0.15)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c084fc', marginBottom: '4px' }}>
                                                    <Film size={11} /><span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Reel</span>
                                                </div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#e9d5ff' }}>{p.avgReelCostUSD > 0 ? `$${p.avgReelCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div style={{ background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '16px 24px', display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleOpenProfile(inf)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease', }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                                            View Profile
                                        </button>
                                        <button onClick={() => handleRequestCollaboration(inf)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(123,63,242,0.2)' }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(123,63,242,0.3)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,63,242,0.2)'; }}>
                                            <Send size={13} /> Request
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Profile Detail View Modal */}
            {selectedInfluencerProfile && (
                <InfluencerProfileModal
                    influencer={selectedInfluencerProfile}
                    onClose={() => setSelectedInfluencerProfile(null)}
                    onRequestCollaboration={() => handleRequestCollaboration(selectedInfluencerProfile)}
                />
            )}

            {/* Create Campaign Request Form Flow */}
            {selectedForCollaboration && (
                <CreateRequestModal
                    influencer={selectedForCollaboration}
                    onClose={() => setSelectedForCollaboration(null)}
                    onSuccess={() => {
                        setSelectedForCollaboration(null);
                        // User can optionally be pushed to /dashboard/brand/collaborations
                    }}
                />
            )}
        </div>
    );
}
