'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Activity,
    ArrowLeft,
    BadgeDollarSign,
    BarChart3,
    Camera,
    ExternalLink,
    Eye,
    Globe2,
    Heart,
    Image as ImageIcon,
    Instagram,
    LineChart as LineChartIcon,
    Loader2,
    MapPin,
    MessageCircle,
    PieChart as PieChartIcon,
    Play,
    Radar,
    Save,
    Share2,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    Radar as RechartsRadar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { analyticsAPI, brandAPI } from '@/lib/api';
import InfluencerProfileMetrics from '@/components/brand/InfluencerProfileMetrics';

type HistoricalSnapshot = {
    capturedAt?: string;
    followersCount?: number;
    engagementRate?: number;
    accountReach?: number;
    accountImpressions?: number;
    influencerScore?: number;
};

type MediaItem = {
    mediaId?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    permalink?: string;
    mediaType?: string;
    caption?: string;
    likeCount?: number;
    commentsCount?: number;
    shareCount?: number;
    saveCount?: number;
    playCount?: number;
    reachCount?: number;
    impressionCount?: number;
    engagementCount?: number;
    viewCount?: number;
    timestamp?: string;
};

type InfluencerProfile = {
    _id: string;
    userId: string;
    fullName?: string;
    displayName?: string;
    username?: string;
    bio?: string;
    instagramBiography?: string;
    niche?: string;
    categories?: string[];
    country?: string;
    city?: string;
    languages?: string[];
    age?: number;
    profilePictureUrl?: string;
    instagramDPURL?: string;
    instagramUsername?: string;
    instagramProfileURL?: string;
    platform?: string;
    followersCount?: number;
    followingCount?: number;
    mediaCount?: number;
    postsCount?: number;
    reelsCount?: number;
    profileViews?: number;
    websiteClicks?: number;
    accountReach?: number;
    accountImpressions?: number;
    onlineFollowers?: Record<string, number> | null;
    engagementRate?: number;
    avgLikes?: number;
    avgComments?: number;
    avgShares?: number;
    avgViews?: number;
    avgReach?: number;
    avgImpressions?: number;
    avgLikesPerPost?: number;
    avgCommentsPerPost?: number;
    avgEngagementPerPost?: number;
    averageEngagement?: number;
    averageReach?: number;
    viewRate?: number;
    likeToCommentRatio?: number;
    postsAnalyzed?: number;
    influencerEfficiencyRate?: number;
    totalReach?: number;
    totalImpressions?: number;
    totalPlays?: number;
    totalShares?: number;
    totalSaved?: number;
    totalEngagements?: number;
    postingFrequency?: number;
    postingFrequency7d?: number;
    postingFrequency30d?: number;
    consistencyRatio?: number;
    consistencyScore?: number;
    costPerView?: number | null;
    costPerEngagement?: number | null;
    authenticityScore?: number;
    engagementQualityScore?: number;
    viralityScore?: number;
    influencerScore?: number;
    topPerformingContentType?: string;
    historicalSnapshots?: HistoricalSnapshot[];
    demographics?: {
        genderDistribution?: Record<string, number>;
        ageDistribution?: Record<string, number>;
        topCountries?: Record<string, number>;
        countries?: Record<string, number>;
        topCities?: Record<string, number>;
        languages?: Record<string, number>;
        audienceType?: string;
        onlineFollowers?: Record<string, number>;
    };
    avgPostPrice?: number;
    avgReelPrice?: number;
    currency?: string;
    profileScore?: number;
    fitScore?: number;
    qualityScore?: number;
    topPostScore?: number;
    topReelScore?: number;
    credibilityScore?: number;
    scoreLabel?: string;
    scoreBreakdown?: Record<string, number>;
    lastSyncAt?: string;
    recentMediaSummary?: MediaItem[];
};

type AnalyticsMetrics = {
    followers: number;
    previousFollowers: number;
    totalPosts: number;
    postsAnalyzed?: number;
    totalViews: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    totalEngagements: number;
    engagementRate: number;
    averageViews: number;
    viewRate: number;
    commentRate: number;
    likeToViewRate: number;
    growthRate: number;
    costPerView: number | null;
    costPerEngagement: number | null;
    authenticityScore: number;
    consistencyScore: number;
    costEfficiencyScore: number;
    finalScore: number;
    ratingTier: string;
    estimatedMediaValue: number | null;
    predictedROI: number | null;
    estimatedCostPerPost: number | null;
    estimatedCostPerReel: number | null;
    estimatedCostPerStory: number | null;
};

type AnalyticsDetail = {
    metrics: AnalyticsMetrics;
    charts: {
        followerGrowth?: Array<{ label: string; followers: number }>;
        engagementTrend?: Array<{ label: string; engagementRate: number }>;
        engagementBreakdown?: Array<{ name: string; value: number }>;
        demographics?: {
            gender?: Array<{ name: string; value: number }>;
            age?: Array<{ name: string; value: number }>;
            country?: Array<{ name: string; value: number }>;
        };
        radar?: Array<{ metric: string; value: number }>;
        roi?: {
            predictedROI: number | null;
            estimatedMediaValue: number | null;
            finalScore: number;
            ratingTier: string;
        };
    };
    updatedAt?: string;
};

type FullProfileProps = {
    influencerUserId: string;
};

type DistributionItem = {
    name: string;
    value: number;
};

const COLORS = {
    ink: '#ffffff',
    text: '#f8fafc',
    muted: 'rgba(255,255,255,0.5)',
    slate: 'rgba(255,255,255,0.3)',
    panel: 'rgba(12,12,12,0.95)',
    border: 'rgba(255,255,255,0.08)',
    purple: '#a855f7',
    violet: '#c084fc',
    blue: '#38bdf8',
    sky: '#bae6fd',
    teal: '#2dd4bf',
    green: '#4ade80',
    amber: '#fbbf24',
    rose: '#f87171',
};

const PIE_COLORS = ['#a855f7', '#38bdf8', '#2dd4bf', '#4ade80', '#fbbf24', '#f87171', 'rgba(255,255,255,0.3)'];

const tooltipStyle = {
    background: 'rgba(12,12,12,0.95)',
    border: '1px solid rgba(168,85,247,0.16)',
    borderRadius: '14px',
    color: COLORS.ink,
    fontSize: '12px',
    padding: '10px 14px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
};

const fmtNumber = (value: number | null | undefined, digits = 0) => {
    if (value == null || Number.isNaN(value)) return '—';
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};

const fmtCompact = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return '—';
    const num = Number(value);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
    return num.toLocaleString();
};

const fmtPercent = (value: number | null | undefined, digits = 2) => {
    if (value == null || Number.isNaN(value)) return '—';
    return `${Number(value).toFixed(digits)}%`;
};

const fmtCurrency = (value: number | null | undefined, currency = 'USD') => {
    if (value == null || Number.isNaN(value) || Number(value) <= 0) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value));
};

const formatDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mapObjectEntries = (source?: Record<string, number> | null): DistributionItem[] => {
    if (!source || typeof source !== 'object') return [];
    return Object.entries(source)
        .map(([name, value]) => ({ name, value: Number(value || 0) }))
        .filter((item) => Number.isFinite(item.value) && item.value > 0)
        .sort((a, b) => b.value - a.value);
};

const combineDistributions = (...sources: Array<Record<string, number> | null | undefined>): DistributionItem[] => {
    const merged = sources.reduce<Record<string, number>>((acc, source) => {
        if (!source || typeof source !== 'object') return acc;
        Object.entries(source).forEach(([name, value]) => {
            const numericValue = Number(value || 0);
            if (!Number.isFinite(numericValue) || numericValue <= 0) return;
            acc[name] = Math.max(acc[name] || 0, numericValue);
        });
        return acc;
    }, {});

    return mapObjectEntries(merged);
};

const buildGenderDistribution = (profile: any, analytics: any): DistributionItem[] => {
    const profileGender = profile?.demographics?.genderDistribution || profile?.demographics?.gender;
    const analyticsGender = analytics?.charts?.demographics?.gender || [];

    const mappedProfile = profileGender && typeof profileGender === 'object'
        ? mapObjectEntries(
            Object.entries(profileGender).reduce<Record<string, number>>((acc, [key, value]) => {
                if (key === 'M') acc.Male = Number(value || 0);
                else if (key === 'F') acc.Female = Number(value || 0);
                else acc[key] = Number(value || 0);
                return acc;
            }, {})
        )
        : [];

    return mappedProfile.length ? mappedProfile : analyticsGender;
};

const normalizeMediaType = (value?: string) => {
    const mediaType = (value || '').toUpperCase();
    if (mediaType.includes('REEL') || mediaType.includes('VIDEO')) return 'Reels / Video';
    if (mediaType.includes('CAROUSEL')) return 'Carousel';
    if (mediaType.includes('IMAGE')) return 'Image';
    return 'Other';
};

const ratingTone = (tier?: string) => {
    if (tier === 'Elite') return COLORS.green;
    if (tier === 'Strong') return COLORS.blue;
    if (tier === 'Average') return COLORS.amber;
    return COLORS.rose;
};

const cardStyle = {
    padding: '22px',
    borderRadius: '28px',
    background: '#0c0c0c',
    border: `1px solid ${COLORS.border}`,
    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
};

function SectionCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                <div>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 18, color: COLORS.ink, letterSpacing: '-0.03em' }}>{title}</h2>
                    {subtitle && <p style={{ marginTop: 5, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>{subtitle}</p>}
                </div>
                {icon && <div style={{ color: COLORS.slate }}>{icon}</div>}
            </div>
            {children}
        </motion.section>
    );
}

function MetricTile({ label, value, tone = COLORS.ink, note, icon }: { label: string; value: string; tone?: string; note?: string; icon?: React.ReactNode }) {
    return (
        <div style={{ padding: '18px', borderRadius: 22, background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: COLORS.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {icon}
                <span>{label}</span>
            </div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 28, color: tone, letterSpacing: '-0.05em' }}>{value}</p>
            {note && <p style={{ marginTop: 8, fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>{note}</p>}
        </div>
    );
}

function EmptyChart({ copy }: { copy: string }) {
    return (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20, border: `1px dashed ${COLORS.border}`, background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ maxWidth: 360, textAlign: 'center', color: COLORS.muted, fontSize: 13, lineHeight: 1.7 }}>{copy}</p>
        </div>
    );
}

export default function InfluencerFullProfilePage({ influencerUserId }: FullProfileProps) {
    const [profile, setProfile] = useState<InfluencerProfile | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const profileResponse = await brandAPI.getInfluencerDetail(influencerUserId);
            const nextProfile = profileResponse.data?.profile || null;
            setProfile(nextProfile);

            if (nextProfile?._id) {
                try {
                    const analyticsResponse = await analyticsAPI.getInfluencer(nextProfile._id);
                    setAnalytics(analyticsResponse.data?.analytics || null);
                } catch (analyticsError: any) {
                    setAnalytics(null);
                    toast.error(analyticsError?.response?.data?.message || 'Full analytics could not be loaded.');
                }
            } else {
                setAnalytics(null);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load influencer profile.');
        } finally {
            setLoading(false);
        }
    }, [influencerUserId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const displayName = profile?.fullName || profile?.displayName || profile?.instagramUsername || 'Influencer';
    const handle = profile?.instagramUsername || profile?.username || null;
    const bio = profile?.instagramBiography || profile?.bio || 'No profile bio is available yet.';
    const avatar = profile?.profilePictureUrl || profile?.instagramDPURL || null;
    const currency = profile?.currency || 'USD';
    const analyticsMetrics = analytics?.metrics || null;

    const snapshotTrend = useMemo(() => {
        const snapshots = Array.isArray(profile?.historicalSnapshots) ? [...profile.historicalSnapshots] : [];
        return snapshots
            .filter((item) => item?.capturedAt)
            .sort((a, b) => new Date(a.capturedAt || '').getTime() - new Date(b.capturedAt || '').getTime())
            .map((item) => ({
                label: formatDate(item.capturedAt),
                followers: Number(item.followersCount || 0),
                engagementRate: Number(item.engagementRate || 0),
                reach: Number(item.accountReach || 0),
                impressions: Number(item.accountImpressions || 0),
                score: Number(item.influencerScore || 0),
            }));
    }, [profile?.historicalSnapshots]);

    const recentMedia = useMemo(() => {
        const media = Array.isArray(profile?.recentMediaSummary) ? [...profile.recentMediaSummary] : [];
        return media
            .filter((item) => item?.timestamp)
            .sort((a, b) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime())
            .slice(-12)
            .map((item, index) => {
                const likes = Number(item.likeCount || 0);
                const comments = Number(item.commentsCount || 0);
                const shares = Number(item.shareCount || 0);
                const saves = Number(item.saveCount || 0);
                const engagements = Number(item.engagementCount || likes + comments + shares + saves);
                return {
                    id: item.mediaId || String(index),
                    label: formatDate(item.timestamp),
                    shortLabel: new Date(item.timestamp || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    likes,
                    comments,
                    shares,
                    saves,
                    views: Number(item.viewCount || item.playCount || 0),
                    reach: Number(item.reachCount || 0),
                    impressions: Number(item.impressionCount || 0),
                    engagements,
                    mediaType: normalizeMediaType(item.mediaType),
                };
            });
    }, [profile?.recentMediaSummary]);

    const mediaMix = useMemo(() => {
        const buckets = recentMedia.reduce<Record<string, number>>((acc, item) => {
            acc[item.mediaType] = (acc[item.mediaType] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(buckets).map(([name, value]) => ({ name, value }));
    }, [recentMedia]);

    const topCountries = useMemo(
        () => combineDistributions(profile?.demographics?.topCountries, profile?.demographics?.countries).slice(0, 6),
        [profile?.demographics?.countries, profile?.demographics?.topCountries]
    );
    const ageDistribution = useMemo(
        () => {
            const fromProfile = mapObjectEntries(profile?.demographics?.ageDistribution);
            return fromProfile.length ? fromProfile : (analytics?.charts?.demographics?.age || []);
        },
        [analytics?.charts?.demographics?.age, profile?.demographics?.ageDistribution]
    );
    const genderDistribution = useMemo(
        () => buildGenderDistribution(profile, analytics),
        [analytics, profile]
    );
    const languageDistribution = useMemo(() => mapObjectEntries(profile?.demographics?.languages).slice(0, 6), [profile?.demographics?.languages]);
    const onlineFollowerHeatmap = useMemo(() => mapObjectEntries(profile?.demographics?.onlineFollowers || profile?.onlineFollowers), [profile?.demographics?.onlineFollowers, profile?.onlineFollowers]);

    const engagementBreakdown = analytics?.charts?.engagementBreakdown || [
        { name: 'Likes', value: Number(profile?.avgLikes || 0) },
        { name: 'Comments', value: Number(profile?.avgComments || 0) },
        { name: 'Shares', value: Number(profile?.avgShares || 0) },
        { name: 'Saves', value: Number(profile?.totalSaved || 0) },
    ];

    const radarData = analytics?.charts?.radar || [
        { metric: 'Authenticity', value: Number(profile?.authenticityScore || 0) },
        { metric: 'Consistency', value: Number(profile?.consistencyScore || 0) },
        { metric: 'Quality', value: Number(profile?.qualityScore || 0) },
        { metric: 'Credibility', value: Number(profile?.credibilityScore || 0) },
        { metric: 'Virality', value: Number(profile?.viralityScore || 0) },
        { metric: 'Fit', value: Number(profile?.fitScore || 0) },
    ];

    const scoreBreakdown = useMemo(() => mapObjectEntries(profile?.scoreBreakdown), [profile?.scoreBreakdown]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: COLORS.muted }}>
                <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <SectionCard title="Profile Unavailable" subtitle={error || 'This influencer profile could not be loaded right now.'} icon={<ShieldCheck size={16} />}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a href="/dashboard/brand/influencers" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 14, background: COLORS.ink, color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
                        <ArrowLeft size={15} /> Back to Search
                    </a>
                </div>
            </SectionCard>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    ...cardStyle,
                    padding: 0,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(18,25,45,0.98) 0%, rgba(51,37,99,0.98) 45%, rgba(14,165,233,0.92) 100%)',
                    color: '#fff',
                }}
            >
                <div style={{ padding: '28px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <a href="/dashboard/brand/influencers" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#dbeafe', textDecoration: 'none', fontWeight: 700 }}>
                        <ArrowLeft size={15} /> Influencer Search
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {handle && (
                            <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                                <Instagram size={14} /> @{handle}
                            </a>
                        )}
                        {profile?.instagramProfileURL && (
                            <a href={profile.instagramProfileURL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                                <ExternalLink size={14} /> Open Instagram
                            </a>
                        )}
                    </div>
                </div>

                <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(320px,0.8fr)', gap: 24 }}>
                    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ width: 96, height: 96, borderRadius: 30, overflow: 'hidden', background: 'rgba(255,255,255,0.14)', border: '2px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 28 }}>
                            {avatar ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                                <span style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{profile?.platform || 'Instagram'}</span>
                                {profile?.niche && <span style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(168,85,247,0.22)', fontSize: 12, fontWeight: 800 }}>{profile.niche}</span>}
                                {analyticsMetrics?.ratingTier && <span style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(34,197,94,0.16)', fontSize: 12, fontWeight: 800 }}>{analyticsMetrics.ratingTier}</span>}
                            </div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.05em', marginBottom: 10 }}>{displayName}</h1>
                            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
                                {(profile?.city || profile?.country) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> {profile?.city ? `${profile.city}, ` : ''}{profile?.country}</span>}
                                {!!profile?.languages?.length && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Globe2 size={14} /> {profile.languages.join(', ')}</span>}
                                {profile?.age ? <span>Age {profile.age}</span> : null}
                            </div>
                            <p style={{ maxWidth: 720, fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.84)' }}>{bio}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                        <MetricTile label="Followers" value={fmtCompact(profile.followersCount)} tone="#fff" icon={<Users size={14} />} />
                        <MetricTile label="Final Score" value={fmtNumber(analyticsMetrics?.finalScore ?? profile.influencerScore ?? profile.fitScore)} tone="#fef08a" icon={<Sparkles size={14} />} />
                        <MetricTile label="Engagement" value={fmtPercent(analyticsMetrics?.engagementRate ?? profile.engagementRate)} tone="#bfdbfe" icon={<Heart size={14} />} />
                        <MetricTile label="Avg Post Rate" value={fmtCurrency(analyticsMetrics?.estimatedCostPerPost ?? profile.avgPostPrice, currency)} tone="#bbf7d0" icon={<BadgeDollarSign size={14} />} />
                    </div>
                </div>
            </motion.section>

            <div style={{ padding: '0 30px 24px' }}>
                <InfluencerProfileMetrics influencerId={profile?._id || influencerUserId} />
            </div>

            <SectionCard title="Complete KPI Snapshot" subtitle="Stored profile facts plus Porchest-calculated benchmark metrics." icon={<Target size={16} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
                    <MetricTile label="Followers" value={fmtCompact(profile.followersCount)} icon={<Users size={14} />} />
                    <MetricTile label="Following" value={fmtCompact(profile.followingCount)} icon={<Users size={14} />} />
                    <MetricTile label="Media Posted" value={fmtNumber(profile.mediaCount)} icon={<Camera size={14} />} />
                    <MetricTile label="Posts" value={fmtNumber(profile.postsCount)} icon={<ImageIcon size={14} />} />
                    <MetricTile label="Reels" value={fmtNumber(profile.reelsCount)} icon={<Play size={14} />} />
                    <MetricTile label="Posts Analyzed" value={fmtNumber(analyticsMetrics?.postsAnalyzed ?? profile.postsAnalyzed)} icon={<BarChart3 size={14} />} />
                    <MetricTile label="Engagement Rate" value={fmtPercent(analyticsMetrics?.engagementRate ?? profile.engagementRate)} tone={COLORS.blue} icon={<Activity size={14} />} />
                    <MetricTile label="View Rate" value={fmtPercent(analyticsMetrics?.viewRate ?? profile.viewRate)} tone={COLORS.teal} icon={<Eye size={14} />} />
                    <MetricTile label="Growth Rate" value={fmtPercent(analyticsMetrics?.growthRate)} tone={(analyticsMetrics?.growthRate || 0) >= 0 ? COLORS.green : COLORS.rose} icon={<TrendingUp size={14} />} />
                    <MetricTile label="Avg Likes" value={fmtCompact(profile.avgLikes || analyticsMetrics?.likes)} icon={<Heart size={14} />} />
                    <MetricTile label="Avg Comments" value={fmtCompact(profile.avgComments || analyticsMetrics?.comments)} icon={<MessageCircle size={14} />} />
                    <MetricTile label="Avg Views" value={fmtCompact(profile.avgViews || analyticsMetrics?.averageViews)} icon={<Eye size={14} />} />
                    <MetricTile label="Avg Reach" value={fmtCompact(profile.avgReach || profile.averageReach)} icon={<Users size={14} />} />
                    <MetricTile label="Avg Impressions" value={fmtCompact(profile.avgImpressions)} icon={<Eye size={14} />} />
                    <MetricTile label="Total Reach" value={fmtCompact(profile.totalReach || profile.accountReach)} icon={<Users size={14} />} />
                    <MetricTile label="Total Impressions" value={fmtCompact(profile.totalImpressions || profile.accountImpressions)} icon={<Eye size={14} />} />
                    <MetricTile label="Total Plays" value={fmtCompact(profile.totalPlays)} icon={<Play size={14} />} />
                    <MetricTile label="Total Engagements" value={fmtCompact(profile.totalEngagements || analyticsMetrics?.totalEngagements)} icon={<Heart size={14} />} />
                    <MetricTile label="Like / Comment Ratio" value={profile.likeToCommentRatio ? profile.likeToCommentRatio.toFixed(2) : '—'} icon={<MessageCircle size={14} />} />
                    <MetricTile label="Comment Rate" value={fmtPercent((analyticsMetrics?.commentRate || 0) * 100, 2)} icon={<MessageCircle size={14} />} />
                    <MetricTile label="Like to View Rate" value={fmtPercent((analyticsMetrics?.likeToViewRate || 0) * 100, 2)} icon={<Heart size={14} />} />
                    <MetricTile label="Posting Freq 7d" value={fmtNumber(profile.postingFrequency7d || profile.postingFrequency)} icon={<BarChart3 size={14} />} />
                    <MetricTile label="Posting Freq 30d" value={fmtNumber(profile.postingFrequency30d)} icon={<BarChart3 size={14} />} />
                    <MetricTile label="Profile Views" value={fmtCompact(profile.profileViews)} icon={<Eye size={14} />} />
                    <MetricTile label="Website Clicks" value={fmtCompact(profile.websiteClicks)} icon={<ExternalLink size={14} />} />
                </div>
            </SectionCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 18 }}>
                <SectionCard title="Audience & Score Trends" subtitle="Follower growth, engagement change, reach, impressions, and score across historical performance points." icon={<LineChartIcon size={16} />}>
                    {snapshotTrend.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart data={snapshotTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="followers" stroke={COLORS.blue} fill={COLORS.sky} fillOpacity={0.18} />
                                <Line yAxisId="right" type="monotone" dataKey="engagementRate" stroke={COLORS.green} strokeWidth={3} dot={{ r: 3 }} />
                                <Line yAxisId="right" type="monotone" dataKey="score" stroke={COLORS.purple} strokeWidth={3} dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : analytics?.charts?.followerGrowth?.length || analytics?.charts?.engagementTrend?.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart
                                data={(analytics?.charts?.followerGrowth || []).map((item, index) => ({
                                    label: item.label,
                                    followers: item.followers,
                                    engagementRate: analytics?.charts?.engagementTrend?.[index]?.engagementRate || 0,
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="followers" stroke={COLORS.blue} fill={COLORS.sky} fillOpacity={0.18} />
                                <Line yAxisId="right" type="monotone" dataKey="engagementRate" stroke={COLORS.green} strokeWidth={3} dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart copy="Trend charts will appear here as more historical performance data becomes available." />
                    )}
                </SectionCard>

                <SectionCard title="Reach vs Impressions" subtitle="Distribution of visibility signals across the available performance history." icon={<TrendingUp size={16} />}>
                    {snapshotTrend.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={snapshotTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Area type="monotone" dataKey="reach" stroke={COLORS.teal} fill={COLORS.teal} fillOpacity={0.16} />
                                <Area type="monotone" dataKey="impressions" stroke={COLORS.amber} fill={COLORS.amber} fillOpacity={0.16} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart copy="Reach and impression trends will appear once more historical performance data is available." />
                    )}
                </SectionCard>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 18 }}>
                <SectionCard title="Recent Content Performance" subtitle="Latest posts and reels with engagement and view depth across the recent media history." icon={<BarChart3 size={16} />}>
                    {recentMedia.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={recentMedia}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                                <XAxis dataKey="shortLabel" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Bar dataKey="engagements" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
                                <Bar dataKey="views" fill={COLORS.sky} radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart copy="Recent post-level charts need `recentMediaSummary` entries on the influencer profile." />
                    )}
                </SectionCard>

                <SectionCard title="Content Format Mix" subtitle="How recent output is split across reels, static posts, carousels, and other content." icon={<PieChartIcon size={16} />}>
                    {mediaMix.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie data={mediaMix} dataKey="value" nameKey="name" innerRadius={70} outerRadius={108} paddingAngle={4}>
                                    {mediaMix.map((entry, index) => (
                                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart copy="Content-mix visualization appears once recent media items are available." />
                    )}
                </SectionCard>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 18 }}>
                <SectionCard title="Scoring Radar" subtitle="Multi-factor performance profile using Porchest scoring signals." icon={<Radar size={16} />}>
                    {radarData.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.muted, fontSize: 11 }} />
                                <RechartsRadar dataKey="value" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.25} />
                                <Tooltip contentStyle={tooltipStyle} />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart copy="Score radar will show as soon as score signals are available on the profile or analytics document." />
                    )}
                </SectionCard>

                <SectionCard title="Engagement Composition" subtitle="Current interaction split across likes, comments, shares, and saves." icon={<Heart size={16} />}>
                    {engagementBreakdown.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={engagementBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {engagementBreakdown.map((entry, index) => (
                                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart copy="Interaction mix is unavailable for this profile right now." />
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Commercial Intelligence" subtitle="Pricing, cost efficiency, media value, and commercial decision-making signals." icon={<BadgeDollarSign size={16} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                    <MetricTile label="Avg Post Price" value={fmtCurrency(profile.avgPostPrice || analyticsMetrics?.estimatedCostPerPost, currency)} tone={COLORS.green} icon={<BadgeDollarSign size={14} />} />
                    <MetricTile label="Avg Reel Price" value={fmtCurrency(profile.avgReelPrice || analyticsMetrics?.estimatedCostPerReel, currency)} tone={COLORS.green} icon={<BadgeDollarSign size={14} />} />
                    <MetricTile label="Cost Per View" value={fmtCurrency(analyticsMetrics?.costPerView, currency)} tone={COLORS.amber} icon={<Eye size={14} />} />
                    <MetricTile label="Cost Per Engagement" value={fmtCurrency(analyticsMetrics?.costPerEngagement, currency)} tone={COLORS.amber} icon={<Heart size={14} />} />
                    <MetricTile label="Estimated Media Value" value={fmtCurrency(analyticsMetrics?.estimatedMediaValue, currency)} tone={COLORS.blue} icon={<Sparkles size={14} />} />
                    <MetricTile label="Predicted ROI" value={fmtPercent(analyticsMetrics?.predictedROI)} tone={(analyticsMetrics?.predictedROI || 0) >= 0 ? COLORS.green : COLORS.rose} icon={<TrendingUp size={14} />} />
                    <MetricTile label="Efficiency Rate" value={fmtPercent(profile.influencerEfficiencyRate)} tone={COLORS.teal} icon={<Target size={14} />} />
                    <MetricTile label="Top Content Type" value={profile.topPerformingContentType || '—'} tone={COLORS.purple} icon={<Play size={14} />} />
                </div>
            </SectionCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 18 }}>
                <SectionCard title="Audience Demographics" subtitle="Country, age, and gender distributions from the stored audience analytics." icon={<Users size={16} />}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
                        <div>
                            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, marginBottom: 10 }}>Top Countries</p>
                            {topCountries.length ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={topCountries} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="name" type="category" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={78} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Bar dataKey="value" fill={COLORS.blue} radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart copy="Country distribution is not stored for this profile yet." />
                            )}
                        </div>
                        <div>
                            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, marginBottom: 10 }}>Age Split</p>
                            {ageDistribution.length ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={ageDistribution} dataKey="value" nameKey="name" outerRadius={84} innerRadius={48}>
                                            {ageDistribution.map((entry, index) => (
                                                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart copy="Age-band data is unavailable for this creator right now." />
                            )}
                        </div>
                        <div>
                            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, marginBottom: 10 }}>Gender Split</p>
                            {genderDistribution.length ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={genderDistribution} dataKey="value" nameKey="name" outerRadius={84} innerRadius={48}>
                                            {genderDistribution.map((entry, index) => (
                                                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart copy="Gender data is unavailable for this creator right now." />
                            )}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Audience Behavior" subtitle="Best times, language mix, and score-breakdown details where stored." icon={<Globe2 size={16} />}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14, marginBottom: 14 }}>
                        <MetricTile label="Audience Type" value={profile.demographics?.audienceType || '—'} icon={<Users size={14} />} />
                        <MetricTile label="Last Synced" value={formatDate(profile.lastSyncAt)} icon={<ShieldCheck size={14} />} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
                        <div>
                            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, marginBottom: 10 }}>Top Languages</p>
                            {languageDistribution.length ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={languageDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Bar dataKey="value" fill={COLORS.teal} radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart copy="Language splits are not stored for this profile." />
                            )}
                        </div>
                        <div>
                            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, marginBottom: 10 }}>Online Followers Pattern</p>
                            {onlineFollowerHeatmap.length ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={onlineFollowerHeatmap}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Bar dataKey="value" fill={COLORS.violet} radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart copy="Hourly or daily audience-presence data is not available yet." />
                            )}
                        </div>
                    </div>
                    {!!scoreBreakdown.length && (
                        <div style={{ marginTop: 14 }}>
                            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, marginBottom: 10 }}>Stored Score Breakdown</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
                                {scoreBreakdown.map((item) => (
                                    <MetricTile key={item.name} label={item.name} value={fmtNumber(item.value)} icon={<Sparkles size={14} />} />
                                ))}
                            </div>
                        </div>
                    )}
                </SectionCard>
            </div>

            {!!recentMedia.length && (
                <SectionCard title="Recent Media Facts" subtitle="The latest stored posts and reels summarized for quick review." icon={<ImageIcon size={16} />}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                        {recentMedia.slice().reverse().slice(0, 6).map((item) => (
                            <div key={item.id} style={{ padding: 16, borderRadius: 22, background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                                    <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(168,85,247,0.08)', color: COLORS.purple, fontSize: 11, fontWeight: 800 }}>{item.mediaType}</span>
                                    <span style={{ fontSize: 11, color: COLORS.muted }}>{item.label}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                                    <MetricTile label="Likes" value={fmtCompact(item.likes)} icon={<Heart size={14} />} />
                                    <MetricTile label="Comments" value={fmtCompact(item.comments)} icon={<MessageCircle size={14} />} />
                                    <MetricTile label="Shares" value={fmtCompact(item.shares)} icon={<Share2 size={14} />} />
                                    <MetricTile label="Saves" value={fmtCompact(item.saves)} icon={<Save size={14} />} />
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
