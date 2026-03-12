'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, TrendingUp, BarChart3, Send, Loader2, UserX, DollarSign, MessageCircle, Heart, Film } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import CreateRequestModal from './CreateRequestModal';
import toast from 'react-hot-toast';

const NICHES = ['All', 'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance', 'Business', 'Other'];
const FOLLOWER_RANGES = ['Any', '1K–10K', '10K–100K', '100K–500K', '500K+'];
const COUNTRIES = ['Any', 'Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Saudi Arabia', 'Germany', 'France'];
const ENGAGEMENT_RANGES = ['Any', '> 1%', '> 3%', '> 5%', '> 10%'];
const COST_RANGES = ['Any', '< $50', '< $100', '< $500', '< $1000'];

const NICHE_COLORS: Record<string, string> = {
    Fashion: '#A855F7', Fitness: '#4ade80', Tech: '#60d5f8', Food: '#fb923c',
    Travel: '#facc15', Beauty: '#f472b6', Gaming: '#7B3FF2', Lifestyle: '#e879f9',
    Education: '#38bdf8', Entertainment: '#f97316', Finance: '#34d399', Business: '#818cf8'
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
    const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);

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

    const filtered = influencers.filter(inf =>
        !query || inf.fullName?.toLowerCase().includes(query.toLowerCase()) ||
        inf.niche?.toLowerCase().includes(query.toLowerCase())
    );

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

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    AI Matching & Discovery
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                    {loading ? 'Analyzing influencer network…' : `${filtered.length} matched influencer${filtered.length !== 1 ? 's' : ''} found`}
                </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '18px' }}>
                <Search size={15} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                <input value={query} onChange={e => setQuery(e.target.value)} type="text"
                    placeholder="Search by name, niche, or keywords…"
                    className="input-dark" style={{ paddingLeft: '46px', height: '50px', fontSize: '14px', borderRadius: '16px' }} />
            </div>

            {/* Filters */}
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
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700' }}>Engagement Rate</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ENGAGEMENT_RANGES.map(f => <Pill key={f} label={f} active={engagementRange === f} onClick={() => setEngagementRange(f)} />)}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700' }}>Max Post Cost (USD)</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {COST_RANGES.map(f => <Pill key={f} label={f} active={costRange === f} onClick={() => setCostRange(f)} />)}
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
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
                    <Loader2 size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#7B3FF2' }} />
                    <p style={{ fontSize: '14px' }}>AI is fetching and ranking influencers…</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div className="glass-card" style={{ padding: '60px', borderRadius: '28px', textAlign: 'center' }}>
                    <UserX size={44} style={{ color: 'rgba(123,63,242,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '8px' }}>
                        No Matches Found
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', maxWidth: '380px', margin: '0 auto', lineHeight: '1.6' }}>
                        Try adjusting your filters or search term to discover more influencers.
                    </p>
                </div>
            )}

            {/* Results grid */}
            {!loading && filtered.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                    <AnimatePresence>
                        {filtered.map((inf, i) => {
                            const nc = NICHE_COLORS[inf.niche] || '#a78bfa';
                            const initials = (inf.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const hasDP = inf.instagramDPURL && inf.instagramDPURL.startsWith('http');
                            
                            return (
                                <motion.div key={inf._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04, duration: 0.35 }}
                                    className="glass-card flex-col" style={{ padding: '24px', borderRadius: '26px', display: 'flex', gap: '18px', border: '1px solid rgba(255,255,255,0.05)', background: `linear-gradient(180deg, rgba(20,18,34,0.7) 0%, rgba(14,12,26,0.95) 100%)` }}>

                                    {/* Header: DP + Name + Niche */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg, #7B3FF2, ${nc})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#fff', boxShadow: `0 0 20px ${nc}40` }}>
                                            {hasDP ? <img src={inf.instagramDPURL} alt={inf.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', color: '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{inf.fullName || 'Influencer'}</p>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                {inf.instagramUsername && (
                                                    <a href={`https://instagram.com/${inf.instagramUsername}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#a78bfa', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                                                        @{inf.instagramUsername}
                                                    </a>
                                                )}
                                                {inf.country && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Globe size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{inf.country}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {inf.niche && <span style={{ padding: '4px 12px', borderRadius: '99px', background: `${nc}15`, border: `1px solid ${nc}30`, color: nc, fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}>{inf.niche}</span>}
                                    </div>

                                    {/* Detailed Stats grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                                                <TrendingUp size={12} /><span style={{ fontSize: '11px', fontWeight: '600' }}>Followers</span>
                                            </div>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#fff' }}>{formatNum(inf.followers)}</p>
                                        </div>
                                        <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                                                <BarChart3 size={12} /><span style={{ fontSize: '11px', fontWeight: '600' }}>Engagement</span>
                                            </div>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#fff' }}>{inf.engagementRate > 0 ? `${inf.engagementRate}%` : '—'}</p>
                                        </div>
                                        
                                        <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                                                <Heart size={12} /><span style={{ fontSize: '11px', fontWeight: '600' }}>Avg Likes</span>
                                            </div>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#fff' }}>{formatNum(inf.avgLikes)}</p>
                                        </div>
                                        <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                                                <MessageCircle size={12} /><span style={{ fontSize: '11px', fontWeight: '600' }}>Avg Comments</span>
                                            </div>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#fff' }}>{formatNum(inf.avgComments)}</p>
                                        </div>

                                        <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.2)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c084fc', marginBottom: '4px' }}>
                                                <DollarSign size={12} /><span style={{ fontSize: '11px', fontWeight: '600' }}>Post Rate</span>
                                            </div>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#e9d5ff' }}>{inf.avgPostCostUSD > 0 ? `$${inf.avgPostCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                        </div>
                                        <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(123,63,242,0.08)', border: '1px solid rgba(123,63,242,0.2)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c084fc', marginBottom: '4px' }}>
                                                <Film size={12} /><span style={{ fontSize: '11px', fontWeight: '600' }}>Reel Rate</span>
                                            </div>
                                            <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#e9d5ff' }}>{inf.avgReelCostUSD > 0 ? `$${inf.avgReelCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                        </div>
                                    </div>

                                    {/* Connection Badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '10px', background: inf.instagramConnected ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.03)' }}>
                                        {inf.instagramConnected ? (
                                            <><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} /><span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '600' }}>Live API Data Verified</span></>
                                        ) : (
                                            <><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} /><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>User Reported Data</span></>
                                        )}
                                    </div>

                                    {/* CTA */}
                                    <button onClick={() => setSelectedInfluencer(inf)}
                                        style={{ width: '100%', padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg,#7B3FF2,#A855F7)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(123,63,242,0.25)' }}
                                        onMouseEnter={e => { (e.currentTarget).style.boxShadow = '0 6px 28px rgba(123,63,242,0.4)'; (e.currentTarget).style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { (e.currentTarget).style.boxShadow = '0 4px 20px rgba(123,63,242,0.25)'; (e.currentTarget).style.transform = ''; }}>
                                        <Send size={14} /> Send Campaign Request
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Request Modal */}
            {selectedInfluencer && (
                <CreateRequestModal
                    influencer={selectedInfluencer}
                    onClose={() => setSelectedInfluencer(null)}
                    onSuccess={() => setSelectedInfluencer(null)}
                />
            )}
        </div>
    );
}
