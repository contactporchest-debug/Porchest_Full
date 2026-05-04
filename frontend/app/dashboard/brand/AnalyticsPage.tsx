'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Activity,
    BarChart3,
    Info,
    LineChart as LineChartIcon,
    Loader2,
    PieChart as PieChartIcon,
    RefreshCw,
    Search,
    ShieldCheck,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { analyticsAPI } from '@/lib/api';

type AnalyticsSummary = {
    influencerId: string;
    userId: string;
    fullName: string;
    username: string | null;
    niche: string | null;
    country: string | null;
    followers: number;
    profilePictureUrl: string | null;
    metrics: Metrics;
    updatedAt: string;
};

type Metrics = {
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
};

type AnalyticsDetail = {
    metrics: Metrics;
    charts: {
        followerGrowth: Array<{ label: string; followers: number }>;
        engagementTrend: Array<{ label: string; engagementRate: number }>;
        engagementBreakdown: Array<{ name: string; value: number }>;
        demographics: {
            gender: Array<{ name: string; value: number }>;
            age: Array<{ name: string; value: number }>;
            country: Array<{ name: string; value: number }>;
        };
        radar: Array<{ metric: string; value: number }>;
        roi: {
            predictedROI: number | null;
            estimatedMediaValue: number | null;
            finalScore: number;
            ratingTier: string;
        };
    };
    updatedAt: string;
};

const COLORS = {
    purple: '#7A5030', // Re-mapped to match warm cream tokens where appropriate
    violet: '#C4A882',
    blue: '#0284c7',
    teal: '#0d9488',
    green: '#166534',
    amber: '#b45309',
    red: '#b91c1c',
    slate: '#C4A882',
    ink: '#1A0A00',
    muted: '#7A5030',
};

const PIE_COLORS = ['#C2340A', '#E8400A', '#FF6B1A', '#C4A882', '#EDD9BC', 'rgba(26,10,0,0.1)'];

const tooltipStyle = {
    background: 'rgba(255,255,255,0.98)',
    border: '1px solid #EDD9BC',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#1A0A00',
    padding: '10px 14px',
    boxShadow: '0 12px 26px rgba(26,10,0,0.1)',
};

const hasChartData = (data?: Array<{ value?: number } | { followers?: number } | { engagementRate?: number }>) =>
    Array.isArray(data) && data.some((item: any) => Object.values(item || {}).some((value) => typeof value === 'number' && value > 0));

const fmtNumber = (value: number | null | undefined, digits = 0) => {
    if (value == null || Number.isNaN(value)) return '—';
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};

const fmtPercent = (value: number | null | undefined, digits = 2) => {
    if (value == null || Number.isNaN(value)) return '—';
    return `${Number(value).toFixed(digits)}%`;
};

const fmtCurrency = (value: number | null | undefined, digits = 2) => {
    if (value == null || Number.isNaN(value)) return '—';
    return `$${Number(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`;
};

const ratingColor = (tier: string) => {
    if (tier === 'Elite') return COLORS.green;
    if (tier === 'Strong') return COLORS.blue;
    if (tier === 'Average') return COLORS.amber;
    return COLORS.red;
};

const FormulaLabel = ({ label, formula }: { label: string; formula: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {label}
        <span title={formula} style={{ display: 'inline-flex', color: COLORS.slate }}>
            <Info size={13} />
        </span>
    </span>
);

const SectionCard = ({ title, subtitle, children, icon }: { title: string; subtitle?: string; children: React.ReactNode; icon?: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.4)', border: '1px solid #EDD9BC', backdropFilter: 'blur(12px)' }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
            <div>
                <p style={{ fontWeight: 700, fontSize: 16, color: COLORS.ink }}>{title}</p>
                {subtitle && <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>{subtitle}</p>}
            </div>
            {icon && <div style={{ color: COLORS.slate }}>{icon}</div>}
        </div>
        {children}
    </motion.div>
);

const MetricCard = ({ label, value, tone, formula }: { label: string; value: string; tone: string; formula: string }) => (
    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC' }}>
        <p style={{ fontWeight: 800, fontSize: '24px', color: tone, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <FormulaLabel label={label} formula={formula} />
        </p>
    </div>
);

const EmptyState = ({ title, copy }: { title: string; copy: string }) => (
    <div style={{ padding: '48px 24px', borderRadius: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', border: '1px dashed #EDD9BC' }}>
        <BarChart3 size={38} style={{ color: COLORS.slate, margin: '0 auto 14px' }} />
        <p style={{ fontWeight: 700, fontSize: 18, color: COLORS.ink, marginBottom: 6 }}>{title}</p>
        <p style={{ fontSize: 14, color: COLORS.muted, maxWidth: 420, margin: '0 auto' }}>{copy}</p>
    </div>
);

export default function AnalyticsPage() {
    const [influencers, setInfluencers] = useState<AnalyticsSummary[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [detail, setDetail] = useState<AnalyticsDetail | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState('');
    const [recalculating, setRecalculating] = useState(false);

    const loadInfluencers = useCallback(async (nextSearch = '') => {
        setLoadingList(true);
        setError('');

        try {
            const response = await analyticsAPI.getInfluencers(nextSearch ? { search: nextSearch } : undefined);
            const nextInfluencers = response.data.influencers || [];
            setInfluencers(nextInfluencers);

            if (!nextInfluencers.length) {
                setSelectedId('');
                setDetail(null);
                return;
            }

            setSelectedId((current) => {
                if (current && nextInfluencers.some((item: AnalyticsSummary) => item.influencerId === current)) return current;
                return nextInfluencers[0].influencerId;
            });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load influencer analytics.');
        } finally {
            setLoadingList(false);
        }
    }, []);

    const loadDetail = useCallback(async (id: string) => {
        if (!id) return;
        setLoadingDetail(true);
        setError('');

        try {
            const response = await analyticsAPI.getInfluencer(id);
            setDetail(response.data.analytics || null);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load influencer analytics details.');
            setDetail(null);
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    useEffect(() => {
        loadInfluencers();
    }, [loadInfluencers]);

    useEffect(() => {
        if (selectedId) loadDetail(selectedId);
    }, [selectedId, loadDetail]);

    const selectedInfluencer = useMemo(
        () => influencers.find((item) => item.influencerId === selectedId) || null,
        [influencers, selectedId]
    );

    const metrics = detail?.metrics || selectedInfluencer?.metrics || null;
    const radarData = detail?.charts?.radar || [];
    const followerGrowth = detail?.charts?.followerGrowth || [];
    const engagementTrend = detail?.charts?.engagementTrend || [];
    const engagementBreakdown = detail?.charts?.engagementBreakdown || [];
    const demographics = detail?.charts?.demographics || { gender: [], age: [], country: [] };
    const roi = detail?.charts?.roi || null;

    const demographicsData = demographics.country.length ? demographics.country : demographics.gender.length ? demographics.gender : demographics.age;
    const demographicsLabel = demographics.country.length ? 'Top Countries' : demographics.gender.length ? 'Gender Split' : demographics.age.length ? 'Age Range' : '';

    const summaryCards = metrics ? [
        {
            label: 'Final Score',
            value: fmtNumber(metrics.finalScore),
            tone: COLORS.ink,
            formula: 'Weighted score = Engagement 30% + View Rate 20% + Authenticity 20% + Growth 10% + Cost Efficiency 10% + Consistency 10%',
        },
        {
            label: 'Rating Tier',
            value: metrics.ratingTier,
            tone: ratingColor(metrics.ratingTier),
            formula: '85–100 Elite, 70–84 Strong, 50–69 Average, below 50 Poor',
        },
        {
            label: 'Engagement Rate',
            value: fmtPercent(metrics.engagementRate),
            tone: COLORS.blue,
            formula: '((likes + comments + shares) / followers) × 100',
        },
        {
            label: 'Average Views',
            value: fmtNumber(metrics.averageViews),
            tone: COLORS.teal,
            formula: 'totalViews / totalPosts',
        },
        {
            label: 'Posts Analyzed (60d)',
            value: fmtNumber(metrics.postsAnalyzed ?? metrics.totalPosts),
            tone: COLORS.ink,
            formula: 'Every available post within the last 60 days is included in the analytics calculation.',
        },
        {
            label: 'View Rate',
            value: fmtPercent(metrics.viewRate),
            tone: COLORS.green,
            formula: '(averageViews / followers) × 100',
        },
        {
            label: 'Growth Rate',
            value: fmtPercent(metrics.growthRate),
            tone: metrics.growthRate >= 0 ? COLORS.green : COLORS.red,
            formula: '((currentFollowers - previousFollowers) / previousFollowers) × 100',
        },
        {
            label: 'Cost Per View',
            value: fmtCurrency(metrics.costPerView, 4),
            tone: COLORS.amber,
            formula: 'postRate / averageViews',
        },
        {
            label: 'Cost Per Engagement',
            value: fmtCurrency(metrics.costPerEngagement, 4),
            tone: COLORS.amber,
            formula: 'postRate / totalEngagements',
        },
    ] : [];

    const handleRecalculate = async () => {
        if (!selectedId) return;
        setRecalculating(true);

        try {
            await analyticsAPI.recalculateInfluencer(selectedId);
            await Promise.all([loadInfluencers(search), loadDetail(selectedId)]);
            toast.success('Influencer analytics recalculated.');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to recalculate analytics.');
        } finally {
            setRecalculating(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: 24, color: COLORS.ink, letterSpacing: '-0.02em', marginBottom: 4 }}>
                        Analytics
                    </h1>
                    <p style={{ fontSize: 14, color: COLORS.muted }}>
                        Evaluate influencer performance using engagement, authenticity, growth, and cost efficiency signals.
                    </p>
                </div>
                <button
                    onClick={handleRecalculate}
                    disabled={!selectedId || recalculating || loadingDetail}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: '1px solid #EDD9BC',
                        background: 'rgba(255,255,255,0.6)',
                        color: '#C2340A',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: !selectedId || recalculating ? 'not-allowed' : 'pointer',
                        opacity: !selectedId || recalculating ? 0.7 : 1,
                        fontFamily: 'inherit',
                        transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { if (!(!selectedId || recalculating)) e.currentTarget.style.background = '#fff' }}
                    onMouseLeave={e => { if (!(!selectedId || recalculating)) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
                >
                    {recalculating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                    Recalculate
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
                <SectionCard title="Influencer Selector" subtitle="Choose a creator to inspect the latest analytics snapshot." icon={<Users size={16} />}>
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.slate }} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') loadInfluencers(search);
                            }}
                            placeholder="Search influencer"
                            style={{
                                width: '100%',
                                padding: '12px 14px 12px 40px',
                                borderRadius: 12,
                                border: '1px solid #EDD9BC',
                                background: 'rgba(255,255,255,0.6)',
                                fontSize: 14,
                                color: COLORS.ink,
                                outline: 'none',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.15s'
                            }}
                            onFocus={e => e.target.style.borderColor = '#C2340A'}
                            onBlur={e => e.target.style.borderColor = '#EDD9BC'}
                        />
                    </div>
                    {loadingList ? (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <Loader2 size={26} style={{ color: '#C2340A', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                        </div>
                    ) : influencers.length === 0 ? (
                        <EmptyState title="No influencers found" copy="Profiles will appear here once influencer data is available in the platform." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 680, overflowY: 'auto', paddingRight: 4 }}>
                            {influencers.map((item) => {
                                const active = item.influencerId === selectedId;
                                return (
                                    <button
                                        key={item.influencerId}
                                        onClick={() => setSelectedId(item.influencerId)}
                                        style={{
                                            textAlign: 'left',
                                            padding: '16px',
                                            borderRadius: 16,
                                            border: active ? '1px solid #C2340A' : '1px solid #EDD9BC',
                                            background: active ? 'rgba(194,52,10,0.05)' : 'rgba(255,255,255,0.6)',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#fff' }}
                                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{item.fullName}</p>
                                                <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
                                                    {item.username ? `@${item.username}` : 'No username'} {item.niche ? `• ${item.niche}` : ''}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 800, fontSize: 20, color: COLORS.ink }}>{fmtNumber(item.metrics.finalScore)}</p>
                                                <p style={{ fontSize: 10, color: ratingColor(item.metrics.ratingTier), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.metrics.ratingTier}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: COLORS.muted, fontWeight: 500 }}>
                                            <span>{fmtNumber(item.followers)} followers</span>
                                            <span>{fmtPercent(item.metrics.engagementRate)}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </SectionCard>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {error ? (
                        <EmptyState title="Analytics unavailable" copy={error} />
                    ) : loadingDetail && !detail ? (
                        <SectionCard title="Loading Analytics" subtitle="Pulling the latest influencer metrics." icon={<Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}>
                            <div style={{ textAlign: 'center', padding: '56px 0', color: COLORS.muted, fontSize: 14, fontWeight: 500 }}>Loading influencer analytics...</div>
                        </SectionCard>
                    ) : !selectedInfluencer || !metrics ? (
                        <EmptyState title="Select an influencer" copy="Choose a creator from the list to review their analytics profile, scoring, and cost efficiency." />
                    ) : (
                        <>
                            <SectionCard
                                title={selectedInfluencer.fullName}
                                subtitle={`${selectedInfluencer.username ? `@${selectedInfluencer.username}` : 'No username'}${selectedInfluencer.country ? ` • ${selectedInfluencer.country}` : ''}`}
                                icon={<ShieldCheck size={18} />}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                                    {summaryCards.map((card) => (
                                        <MetricCard key={card.label} label={card.label} value={card.value} tone={card.tone} formula={card.formula} />
                                    ))}
                                </div>
                            </SectionCard>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 24 }}>
                                <SectionCard title="Influencer Score Radar" subtitle="Normalized 0–100 scoring breakdown." icon={<Target size={16} />}>
                                    {hasChartData(radarData) ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <RadarChart data={radarData}>
                                                <PolarGrid stroke="#EDD9BC" />
                                                <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.muted, fontSize: 11, fontWeight: 600 }} />
                                                <Radar dataKey="value" stroke="#C2340A" fill="#C2340A" fillOpacity={0.2} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="Score data unavailable" copy="Radar metrics will appear once the selected influencer has enough analytics signals." />
                                    )}
                                </SectionCard>

                                <SectionCard title="ROI / EMV" subtitle="Predicted return based on estimated media value and current pricing." icon={<TrendingUp size={16} />}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
                                        <MetricCard label="Predicted ROI" value={fmtPercent(roi?.predictedROI)} tone={COLORS.green} formula='((estimatedMediaValue - postRate) / postRate) × 100' />
                                        <MetricCard label="Estimated Media Value" value={fmtCurrency(roi?.estimatedMediaValue)} tone={COLORS.blue} formula="Weighted estimate from views, engagements, followers, and final score." />
                                        <MetricCard label="Final Score" value={fmtNumber(roi?.finalScore)} tone={COLORS.ink} formula="Weighted intelligence score." />
                                        <MetricCard label="Rating Tier" value={roi?.ratingTier || '—'} tone={ratingColor(roi?.ratingTier || '')} formula="Elite / Strong / Average / Poor" />
                                    </div>
                                </SectionCard>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 24 }}>
                                <SectionCard title="Follower Growth" subtitle="Historical snapshot trend from stored analytics recalculations." icon={<LineChartIcon size={16} />}>
                                    {hasChartData(followerGrowth) ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <LineChart data={followerGrowth}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#EDD9BC" vertical={false} />
                                                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: COLORS.slate, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Line type="monotone" dataKey="followers" stroke="#C2340A" strokeWidth={3} dot={{ r: 4, fill: '#C2340A', strokeWidth: 0 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No follower trend yet" copy="This chart will fill in as more historical performance data becomes available." />
                                    )}
                                </SectionCard>

                                <SectionCard title="Engagement Trend" subtitle="Stored engagement-rate history over time." icon={<Activity size={16} />}>
                                    {hasChartData(engagementTrend) ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <LineChart data={engagementTrend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#EDD9BC" vertical={false} />
                                                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: COLORS.slate, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Line type="monotone" dataKey="engagementRate" stroke={COLORS.green} strokeWidth={3} dot={{ r: 4, fill: COLORS.green, strokeWidth: 0 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No engagement trend yet" copy="Trend history will appear as performance data builds over time." />
                                    )}
                                </SectionCard>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 24 }}>
                                <SectionCard title="Engagement Breakdown" subtitle="Current likes, comments, shares, and saves totals." icon={<BarChart3 size={16} />}>
                                    {hasChartData(engagementBreakdown) ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={engagementBreakdown}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#EDD9BC" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: COLORS.slate, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                    {engagementBreakdown.map((entry, index) => (
                                                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No engagement mix yet" copy="This visualization will appear when likes, comments, shares, and saves are available." />
                                    )}
                                </SectionCard>

                                <SectionCard title="Audience Demographics" subtitle={demographicsLabel || 'No audience demographic data is currently stored.'} icon={<PieChartIcon size={16} />}>
                                    {demographicsData.length ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={demographicsData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={3}>
                                                    {demographicsData.map((entry, index) => (
                                                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: COLORS.ink }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState title="No demographics yet" copy="Audience splits will appear here when gender, age, or country analytics are available." />
                                    )}
                                </SectionCard>
                            </div>

                            <SectionCard title="Cost Efficiency" subtitle="Estimated creator pricing and unit economics." icon={<TrendingUp size={16} />}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                                    <MetricCard label="Cost Per View" value={fmtCurrency(metrics.costPerView, 4)} tone={COLORS.amber} formula="postRate / averageViews" />
                                    <MetricCard label="Cost Per Engagement" value={fmtCurrency(metrics.costPerEngagement, 4)} tone={COLORS.amber} formula="postRate / totalEngagements" />
                                    <MetricCard label="Estimated Cost Per Post" value={fmtCurrency(metrics.estimatedCostPerPost)} tone={COLORS.blue} formula="Profile post rate with campaign pricing fallback." />
                                    <MetricCard label="Estimated Cost Per Reel" value={fmtCurrency(metrics.estimatedCostPerReel)} tone={COLORS.teal} formula="Profile reel rate with campaign pricing fallback." />
                                </div>
                            </SectionCard>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
