'use client';
import { useState, useEffect, useCallback, useDeferredValue, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, TrendingUp, BarChart3, Send, Loader2, UserX, DollarSign, MessageCircle, Heart, Film, Star, ExternalLink, Image, Instagram, Users, ShieldCheck } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const NICHES = ['All', 'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance', 'Business', 'Other'];
const FOLLOWER_RANGES = ['Any', '1K–10K', '10K–100K', '100K–500K', '500K+'];
const COUNTRIES = ['Any', 'Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Saudi Arabia', 'Germany', 'France'];
const ENGAGEMENT_RANGES = ['Any', '> 1%', '> 3%', '> 5%', '> 10%'];
const COST_RANGES = ['Any', '< $50', '< $100', '< $500', '< $1000'];

const NICHE_COLORS: Record<string, string> = {
    Fashion: '#C2340A', Fitness: '#059669', Tech: '#0284c7', Food: '#d97706',
    Travel: '#b45309', Beauty: '#be185d', Gaming: '#C2340A', Lifestyle: '#be185d',
    Education: '#0369a1', Entertainment: '#c2410c', Finance: '#047857', Business: '#4338ca',
};

const InfluencerProfileModal = dynamic(() => import('./InfluencerProfileModal'));
const CreateRequestModal = dynamic(() => import('./CreateRequestModal'));

export default function InfluencerSearch() {
    const { user, token, loading: authLoading } = useAuth();
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);
    const [query, setQuery] = useState('');
    const [niche, setNiche] = useState('All');
    const [followerRange, setFollowerRange] = useState('Any');
    const [country, setCountry] = useState('Any');
    const [engagementRange, setEngagementRange] = useState('Any');
    const [costRange, setCostRange] = useState('Any');
    
    const [selectedInfluencerProfile, setSelectedInfluencerProfile] = useState<any>(null); // Details Modal
    const [selectedForCollaboration, setSelectedForCollaboration] = useState<any>(null);   // Request Flow
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set()); // Track broken image IDs
    const deferredQuery = useDeferredValue(query);
    const normalizedCountry = country === 'UAE' ? 'United Arab Emirates' : country;
    const cacheKey = useMemo(() => JSON.stringify({
        niche,
        followerRange,
        country: normalizedCountry,
        engagementRange,
        costRange,
    }), [costRange, engagementRange, followerRange, niche, normalizedCountry]);

    // Fetch influencers wrapper
    const fetchInfluencers = useCallback(async (options?: { retryAttempt?: number }) => {
        if (authLoading || user?.role !== 'brand' || !token) return;

        const retryAttempt = options?.retryAttempt ?? 0;

        setLoading(true);
        try {
            const params: Record<string, unknown> = {};
            if (niche !== 'All') params.niche = niche;
            
            if (followerRange === '1K–10K') { params.minFollowers = 1000; params.maxFollowers = 10000; }
            if (followerRange === '10K–100K') { params.minFollowers = 10000; params.maxFollowers = 100000; }
            if (followerRange === '100K–500K') { params.minFollowers = 100000; params.maxFollowers = 500000; }
            if (followerRange === '500K+') { params.minFollowers = 500000; }

            if (country !== 'Any') params.country = normalizedCountry;

            if (engagementRange === '> 1%') params.minEngagement = 1;
            if (engagementRange === '> 3%') params.minEngagement = 3;
            if (engagementRange === '> 5%') params.minEngagement = 5;
            if (engagementRange === '> 10%') params.minEngagement = 10;

            if (costRange === '< $50') params.maxPostCost = 50;
            if (costRange === '< $100') params.maxPostCost = 100;
            if (costRange === '< $500') params.maxPostCost = 500;
            if (costRange === '< $1000') params.maxPostCost = 1000;

            const res = await brandAPI.getInfluencers(params);
            const nextInfluencers = res.data.influencers || [];
            setInfluencers(nextInfluencers);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(`brand_influencers_${cacheKey}`, JSON.stringify({
                    influencers: nextInfluencers,
                    savedAt: Date.now(),
                }));
            }
        } catch {
            if (retryAttempt < 1) {
                await new Promise((resolve) => window.setTimeout(resolve, 500));
                await fetchInfluencers({ retryAttempt: retryAttempt + 1 });
                return;
            }
            toast.error('Failed to load influencers');
        } finally {
            setLoading(false);
        }
    }, [authLoading, cacheKey, costRange, country, engagementRange, followerRange, niche, normalizedCountry, token, user?.role]);

    useEffect(() => {
        if (authLoading || user?.role !== 'brand' || !token) return;

        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem(`brand_influencers_${cacheKey}`);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed?.influencers)) {
                        setInfluencers(parsed.influencers);
                    }
                } catch {
                    sessionStorage.removeItem(`brand_influencers_${cacheKey}`);
                }
            }
        }

        setHasAttemptedInitialLoad(true);
        fetchInfluencers();
    }, [authLoading, cacheKey, fetchInfluencers, token, user?.role]);

    // Local client-side filter — works on flat card fields
    const filtered = useMemo(() => influencers.filter((inf: any) => {
        const fullName = inf.fullName?.toLowerCase() || '';
        const infNiche = inf.niche?.toLowerCase() || '';
        const handle   = inf.username?.toLowerCase()  || '';
        const bio      = inf.bio?.toLowerCase()        || '';
        const search   = deferredQuery.toLowerCase();
        return !deferredQuery ||
               fullName.includes(search) ||
               infNiche.includes(search) ||
               handle.includes(search)   ||
               bio.includes(search);
    }), [deferredQuery, influencers]);

    const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
        <button onClick={onClick} style={{
            padding: '8px 16px', borderRadius: '99px',
            border: `1px solid ${active ? '#C2340A' : '#EDD9BC'}`,
            background: active ? '#C2340A' : 'rgba(255,255,255,0.6)',
            color: active ? '#fff' : '#7A5030',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit'
        }}>{label}</button>
    );

    const formatNum = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
        return num.toString();
    };

    const handleOpenProfile = async (inf: any) => {
        // inf.userId comes from the flat card object (buildInfluencerCard sets it as ObjectId ref)
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
        <div>
            <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontWeight: 800, fontSize: '24px', color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    Discover Influencers
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <p style={{ fontSize: '14px', color: '#7A5030', fontWeight: 500 }}>
                        {authLoading || !hasAttemptedInitialLoad || loading ? 'Loading creator profiles…' : `Showing ${filtered.length} curated matches`}
                    </p>
                    <div style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={12} style={{ color: '#059669' }} />
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Profiles</span>
                    </div>
                </div>
            </div>


            {/* Search Top Bar */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#C4A882', pointerEvents: 'none' }} />
                <input value={query} onChange={e => setQuery(e.target.value)} type="text"
                    placeholder="Search by influencer name, niche, or keywords…"
                    style={{ paddingLeft: '52px', height: '56px', fontSize: '15px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', width: '100%', color: '#1A0A00', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#C2340A'} onBlur={e => e.target.style.borderColor = '#EDD9BC'}
                />
            </div>

            {/* Filters Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div>
                    <p style={{ fontSize: '11px', color: '#7A5030', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Niche</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {NICHES.map(n => <Pill key={n} label={n} active={niche === n} onClick={() => setNiche(n)} />)}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: '#7A5030', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Followers</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {FOLLOWER_RANGES.map(f => <Pill key={f} label={f} active={followerRange === f} onClick={() => setFollowerRange(f)} />)}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: '#7A5030', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Engagement</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {ENGAGEMENT_RANGES.map(f => <Pill key={f} label={f} active={engagementRange === f} onClick={() => setEngagementRange(f)} />)}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: '#7A5030', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Country</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {COUNTRIES.map(f => <Pill key={f} label={f} active={country === f} onClick={() => setCountry(f)} />)}
                    </div>
                </div>
            </div>

            {/* Loading */}
            {(authLoading || !hasAttemptedInitialLoad || loading) && (
                <div style={{ textAlign: 'center', padding: '80px', color: '#C4A882' }}>
                    <Loader2 size={32} style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite', color: '#C2340A' }} />
                    <p style={{ fontSize: '15px', fontWeight: 500, color: '#7A5030' }}>Finding matching profiles…</p>
                </div>
            )}

            {/* Empty state */}
            {!authLoading && hasAttemptedInitialLoad && !loading && filtered.length === 0 && (
                <div style={{ padding: '64px 20px', borderRadius: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', border: '1px dashed #EDD9BC' }}>
                    <UserX size={48} style={{ color: '#C4A882', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 800, fontSize: '20px', color: '#1A0A00', marginBottom: '8px' }}>
                        No Matches Found
                    </p>
                    <p style={{ color: '#7A5030', fontSize: '15px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                        We could not find an exact match yet. Try broadening your criteria or exploring another niche.
                    </p>
                </div>
            )}

            {/* Results Grid */}
            {!authLoading && hasAttemptedInitialLoad && !loading && filtered.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                    <AnimatePresence>
                        {filtered.map((inf: any, i: number) => {
                            // All fields are flat on the card object (built by brandController.buildInfluencerCard)
                            const nc = NICHE_COLORS[inf.niche || ''] || '#C2340A';

                            // DP priority: profilePictureUrl (API) > profileImageURL (flat) > instagramDPURL > fallback to initials
                            const dp       = inf.profilePictureUrl || inf.profileImageURL || inf.instagramDPURL || null;
                            const handle   = inf.username || null;
                            const initials = (inf.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const followers = inf.followersCount || 0;
                            const engagement = typeof inf.engagementRate === 'number' ? inf.engagementRate.toFixed(2) : '0.00';
                            const igLink = handle ? `https://instagram.com/${handle}` : '#';

                            // Demographics — already structured on card (no JSON.parse)
                            const demos = inf.audienceDemographics;
                            let topCountry = '';
                            let genderSplit = '';
                            let topAge = '';

                            if (demos) {
                                if (demos.countries && Object.keys(demos.countries).length > 0) {
                                    topCountry = Object.keys(demos.countries)
                                        .reduce((a, b) => demos.countries[a] > demos.countries[b] ? a : b)
                                        .split(',')[0];
                                }
                                if (demos.genderAge && Object.keys(demos.genderAge).length > 0) {
                                    let f = 0, m = 0;
                                    const ages: Record<string, number> = {};
                                    Object.entries(demos.genderAge).forEach(([key, val]: [string, any]) => {
                                        if (key.startsWith('F.')) f += val;
                                        if (key.startsWith('M.')) m += val;
                                        const ageGroup = key.split('.')[1];
                                        if (ageGroup) ages[ageGroup] = (ages[ageGroup] || 0) + val;
                                    });
                                    const totalGender = f + m;
                                    if (totalGender > 0) genderSplit = `${Math.round((f / totalGender) * 100)}% F / ${Math.round((m / totalGender) * 100)}% M`;
                                    if (Object.keys(ages).length > 0) topAge = Object.keys(ages).reduce((a, b) => ages[a] > ages[b] ? a : b);
                                }
                            }

                            return (
                                <motion.div key={inf._id || i} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04, duration: 0.35 }}
                                    style={{ borderRadius: '24px', display: 'flex', flexDirection: 'column', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,10,0,0.02)', transition: 'border-color 0.2s', position: 'relative' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(194,52,10,0.3)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#EDD9BC'}
                                >
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, #C2340A, ${nc})`, opacity: 0.8 }} />
                                    <div style={{ padding: '28px 24px 20px', flex: 1 }}>
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                {/* DP */}
                                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0, overflow: 'hidden', background: '#C2340A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', color: '#fff', border: '1px solid #EDD9BC' }}>
                                                    {(dp && !brokenImages.has(inf._id)) ? <img src={dp} alt={inf.fullName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setBrokenImages(prev => new Set([...prev, inf._id]))} /> : initials}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                        <p style={{ fontWeight: 800, color: '#1A0A00', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>
                                                            {inf.fullName || 'Influencer'}
                                                        </p>
                                                        <ShieldCheck size={16} style={{ color: '#059669', flexShrink: 0 }} />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        {handle && (
                                                            <a href={igLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#C2340A', textDecoration: 'none', fontWeight: 500 }} onClick={e => e.stopPropagation()}>
                                                                <Instagram size={12} /> @{handle}
                                                            </a>
                                                        )}
                                                        {inf.country && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Globe size={12} style={{ color: '#C4A882' }} />
                                                                <p style={{ fontSize: '12px', color: '#7A5030', textTransform: 'capitalize', fontWeight: 500 }}>{inf.country}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Fit Score Stars */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                                <p style={{ fontSize: '10px', color: '#C4A882', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inf.qualityLabel}</p>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} size={14} fill={star <= (inf.starRating || 1) ? '#d97706' : 'transparent'} color={star <= (inf.starRating || 1) ? '#d97706' : '#EDD9BC'} />
                                                    ))}
                                                </div>
                                                <p style={{ fontSize: '11px', color: '#7A5030', fontWeight: 700 }}>Fit {inf.fitScore || 0}/100</p>
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        <p style={{ fontSize: '14px', color: '#1A0A00', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '44px' }}>
                                            {inf.bio || 'No biography available.'}
                                        </p>

                                        {/* Tags: Niche + Followers + ER */}
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                            {inf.niche && <span style={{ padding: '6px 14px', borderRadius: '99px', background: 'rgba(194,52,10,0.1)', border: '1px solid rgba(194,52,10,0.2)', color: '#C2340A', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inf.niche}</span>}
                                            <span style={{ padding: '6px 14px', borderRadius: '99px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', color: '#7A5030', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <TrendingUp size={12} /> {formatNum(followers)} Followers
                                            </span>
                                            <span style={{ padding: '6px 14px', borderRadius: '99px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', color: '#7A5030', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <BarChart3 size={12} /> {engagement}% ER
                                            </span>
                                        </div>

                                        {/* Demographics Row — only shown when data exists */}
                                        {(topCountry || genderSplit) && (
                                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid #EDD9BC', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {topCountry && <div style={{ fontSize: '12px', color: '#1A0A00', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><Globe size={14} color="#C2340A" /> {topCountry}</div>}
                                                {topCountry && genderSplit && <div style={{ width: '1px', height: '16px', background: '#EDD9BC' }}></div>}
                                                {genderSplit && <div style={{ fontSize: '12px', color: '#1A0A00', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}><Users size={14} color="#C2340A" /> {genderSplit}</div>}
                                                {topAge && <><div style={{ width: '1px', height: '16px', background: '#EDD9BC' }}></div><div style={{ fontSize: '12px', color: '#1A0A00', fontWeight: 500 }}>{topAge} yrs</div></>}
                                            </div>
                                        )}

                                        {/* Rates */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7A5030', marginBottom: '8px' }}>
                                                    <Image size={14} /><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Post</span>
                                                </div>
                                                <p style={{ fontWeight: 800, fontSize: '18px', color: '#1A0A00' }}>{inf.avgPostCostUSD > 0 ? `$${inf.avgPostCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                            </div>
                                            <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7A5030', marginBottom: '8px' }}>
                                                    <Film size={14} /><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Reel</span>
                                                </div>
                                                <p style={{ fontWeight: 800, fontSize: '18px', color: '#1A0A00' }}>{inf.avgReelCostUSD > 0 ? `$${inf.avgReelCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div style={{ background: 'rgba(255,255,255,0.6)', borderTop: '1px solid #EDD9BC', padding: '20px 24px', display: 'flex', gap: '12px' }}>
                                        <button onClick={() => handleOpenProfile(inf)}
                                            style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', color: '#1A0A00', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#C4A882'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = '#EDD9BC'}>
                                            View Profile
                                        </button>
                                        <button onClick={() => handleRequestCollaboration(inf)}
                                            style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#C2340A', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(194,52,10,0.2)', fontFamily: 'inherit' }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(194,52,10,0.3)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(194,52,10,0.2)'; }}>
                                            <Send size={16} /> Request
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
