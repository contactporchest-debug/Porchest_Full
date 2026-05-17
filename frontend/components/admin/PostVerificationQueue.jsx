'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Link2, ShieldAlert } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PostVerificationQueue() {
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState(null);
    const [collabs, setCollabs] = useState([]);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getCollaborations({ status: 'posted' });
            setCollabs(data?.collaborations || []);
        } catch (error) {
            toast.error('Failed to load post verification queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const verify = async (id) => {
        setVerifyingId(id);
        try {
            await adminAPI.verifyCollaboration(id);
            toast.success('Post verified');
            await load();
        } catch (error) {
            toast.error('Verification failed');
        } finally {
            setVerifyingId(null);
        }
    };

    return (
        <div style={{ borderRadius: '16px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.58)', padding: '18px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A0A00' }}>Post verification queue</h2>
                    <p style={{ marginTop: '6px', color: '#7A5030', fontSize: '13px', lineHeight: 1.6 }}>
                        Review live post links, confirm the content, and release payout once approved.
                    </p>
                </div>
                <ShieldAlert size={18} color="#C2340A" />
            </div>

            {loading ? (
                <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#7A5030' }}>
                    <Loader2 size={16} className="animate-spin" />
                    Loading queue...
                </div>
            ) : collabs.length === 0 ? (
                <p style={{ marginTop: 16, color: '#7A5030', fontSize: 14 }}>No posts awaiting verification.</p>
            ) : (
                <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                    {collabs.map((c) => (
                        <div key={c._id} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.38)', padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                <div>
                                    <p style={{ color: '#1A0A00', fontWeight: 700, fontSize: 15 }}>{c.campaignTitle || c.brief?.campaignObjective || 'Collaboration'}</p>
                                    <p style={{ fontSize: 13, color: '#7A5030', marginTop: 4 }}>
                                        Brand: {c.brandName || c.brandProfile?.businessName || '—'} | Influencer: @{c.influencerUsername || c.influencerProfile?.igUsername || '—'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#7A5030', fontWeight: 700 }}>Agreed fee</p>
                                    <p style={{ color: '#C2340A', fontWeight: 800, fontSize: 16, marginTop: 4 }}>
                                        ${Number(c.pricing?.agreedFee || c.agreedPrice || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {c.content?.postLink && (
                                <a
                                    href={c.content.postLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#C2340A', fontSize: 14, textDecoration: 'underline', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10 }}
                                >
                                    <Link2 size={14} />
                                    Open post
                                </a>
                            )}
                            <button
                                onClick={() => verify(c._id)}
                                disabled={verifyingId === c._id}
                                style={{
                                    width: '100%',
                                    marginTop: 12,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: '#C2340A',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: verifyingId === c._id ? 'not-allowed' : 'pointer',
                                    opacity: verifyingId === c._id ? 0.5 : 1,
                                }}
                            >
                                {verifyingId === c._id ? 'Verifying...' : 'Verify and release payment'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <style jsx>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
