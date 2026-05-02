'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, UserX, Globe, TrendingUp, BarChart3, Image, Film, Star, ShieldCheck, Instagram, Users, User } from 'lucide-react';
import { brandAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const NICHE_COLORS: Record<string, string> = {
    Fashion: '#a855f7', Fitness: '#4ade80', Tech: '#38bdf8', Food: '#fbbf24',
    Travel: '#facc15', Beauty: '#f472b6', Gaming: '#9333ea', Lifestyle: '#e879f9',
    Education: '#38bdf8', Entertainment: '#f97316', Finance: '#34d399', Business: '#818cf8',
};

const InfluencerProfileModal = dynamic(() => import('../InfluencerProfileModal'));
const CreateRequestModal = dynamic(() => import('../CreateRequestModal'));

export default function AIMatchingComponent() {
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
        { role: 'ai', text: "Hi! Tell me what kind of creators you're looking for. For example: 'tech creators in Pakistan with engagement above 5% and reel rates under $500'." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [influencers, setInfluencers] = useState<any[]>([]);
    
    // Modal states
    const [selectedInfluencerProfile, setSelectedInfluencerProfile] = useState<any>(null);
    const [selectedForCollaboration, setSelectedForCollaboration] = useState<any>(null);
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userQuery = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
        setInput('');
        setLoading(true);
        
        try {
            const res = await brandAPI.aiMatching(userQuery);
            if (res.data.success) {
                setMessages(prev => [...prev, { role: 'ai', text: res.data.aiReply }]);
                setInfluencers(res.data.influencers || []);
            } else {
                toast.error(res.data.message || 'Failed to match influencers');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Could not load recommendations right now');
            setMessages(prev => [...prev, { role: 'ai', text: "I couldn’t complete that search just now. Please try again or simplify the request." }]);
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
            <div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '24px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    Smart Matching
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                        Describe your ideal creator in plain language to get tailored recommendations.
                    </p>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', background: `linear-gradient(180deg, rgba(20,18,34,0.7) 0%, rgba(14,12,26,0.95) 100%)`, overflow: 'hidden' }}>
                <div style={{ padding: '24px', flex: 1, maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{ display: 'flex', gap: '12px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                {msg.role === 'ai' && (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 15px rgba(168,85,247,0.3)' }}>
                                        <Bot size={16} color="#fff" />
                                    </div>
                                )}
                                <div style={{ padding: '14px 18px', borderRadius: '16px', background: msg.role === 'user' ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' : 'rgba(168,85,247,0.1)', border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(168,85,247,0.2)', color: msg.role === 'user' ? '#fff' : '#e9d5ff', fontSize: '14px', lineHeight: '1.6', borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px', borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px' }}>
                                    {msg.text}
                                </div>
                                {msg.role === 'user' && (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <User size={16} color="#fff" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Bot size={16} color="#fff" />
                                </div>
                                <div style={{ padding: '12px 18px', borderRadius: '16px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.1)' }}>
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#a855f7' }} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your requirements..."
                            style={{ width: '100%', padding: '14px 20px', paddingRight: '50px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '14px', outline: 'none', transition: 'border 0.2s' }}
                            onFocus={(e) => e.target.style.border = '1px solid rgba(168,85,247,0.5)'}
                            onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '8px', borderRadius: '10px', background: loading || !input.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #a855f7, #c084fc)', border: 'none', color: loading || !input.trim() ? 'rgba(255,255,255,0.2)' : '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Grid - matches UI exactly with Discover pages */}
             {influencers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff' }}>Recommended Influencers ({influencers.length})</h3>
                </div>
            )}
            {influencers.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    <AnimatePresence>
                        {influencers.map((inf: any, i: number) => {
                            const nc = NICHE_COLORS[inf.niche || ''] || '#a855f7';
                            const dp = inf.profilePictureUrl || inf.profileImageURL || inf.instagramDPURL || null;
                            const handle = inf.username || null;
                            const initials = (inf.fullName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                            const followers = inf.followersCount || 0;
                            const engagement = typeof inf.engagementRate === 'number' ? inf.engagementRate.toFixed(2) : '0.00';
                            const igLink = handle ? `https://instagram.com/${handle}` : '#';

                            const demos = inf.audienceDemographics;
                            let topCountry = '';
                            let genderSplit = '';
                            let topAge = '';

                            if (demos) {
                                if (demos.countries && Object.keys(demos.countries).length > 0) {
                                    topCountry = Object.keys(demos.countries).reduce((a, b) => demos.countries[a] > demos.countries[b] ? a : b).split(',')[0];
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
                                    className="glass-card flex-col" style={{ borderRadius: '26px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.06)', background: `linear-gradient(180deg, rgba(20,18,34,0.7) 0%, rgba(14,12,26,0.95) 100%)`, overflow: 'hidden' }}>

                                    <div style={{ padding: '24px 24px 16px', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg, #a855f7, ${nc})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#fff', boxShadow: `0 0 20px ${nc}40` }}>
                                                    {(dp && !brokenImages.has(inf._id)) ? <img src={dp} alt={inf.fullName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setBrokenImages(prev => new Set([...prev, inf._id]))} /> : initials}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', color: '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {inf.fullName || 'Influencer'}
                                                        </p>
                                                        <ShieldCheck size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        {handle && (
                                                            <a href={igLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#d8b4fe', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                                                                <Instagram size={10} /> @{handle}
                                                            </a>
                                                        )}
                                                        {inf.country && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Globe size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{inf.country}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inf.qualityLabel}</p>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} size={11} fill={star <= (inf.starRating || 1) ? '#facc15' : 'transparent'} color={star <= (inf.starRating || 1) ? '#facc15' : 'rgba(255,255,255,0.2)'} />
                                                    ))}
                                                </div>
                                                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>Fit {inf.fitScore || 0}/100</p>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '42px' }}>
                                            {inf.bio || 'No biography available.'}
                                        </p>

                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                            {inf.niche && <span style={{ padding: '4px 12px', borderRadius: '99px', background: `${nc}12`, border: `1px solid ${nc}25`, color: nc, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{inf.niche}</span>}
                                            <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <TrendingUp size={10} /> {formatNum(followers)} Followers
                                            </span>
                                            <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <BarChart3 size={10} /> {engagement}% ER
                                            </span>
                                        </div>

                                        {(topCountry || genderSplit) && (
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {topCountry && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={11} color="#a855f7" /> {topCountry}</div>}
                                                {topCountry && genderSplit && <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>}
                                                {genderSplit && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={11} color="#f472b6" /> {genderSplit}</div>}
                                                {topAge && <><div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{topAge} yrs</div></>}
                                            </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c084fc', marginBottom: '4px' }}>
                                                    <Image size={11} /><span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Post</span>
                                                </div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#e9d5ff' }}>{inf.avgPostCostUSD > 0 ? `$${inf.avgPostCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                            </div>
                                            <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c084fc', marginBottom: '4px' }}>
                                                    <Film size={11} /><span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Reel</span>
                                                </div>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '15px', color: '#e9d5ff' }}>{inf.avgReelCostUSD > 0 ? `$${inf.avgReelCostUSD.toLocaleString()}` : 'Negotiable'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '16px 24px', display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleOpenProfile(inf)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                                            View Profile
                                        </button>
                                        <button onClick={() => handleRequestCollaboration(inf)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg,#a855f7,#c084fc)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(168,85,247,0.2)' }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(168,85,247,0.3)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(168,85,247,0.2)'; }}>
                                            <Send size={13} /> Request
                                        </button>
                                    </div>
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
