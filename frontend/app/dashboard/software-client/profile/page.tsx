'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { softwareClientAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Mail, Phone, MapPin, Globe, Clock, Users, Building, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface ClientProfile {
    fullName: string;
    companyName: string;
    roleTitle: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    avatarUrl: string;
    clientSince: string;
    preferredContact: string;
    workingHours: string;
    companyWebsite: string;
    companyStage: string;
    industry: string;
    teamSize: string;
}

export default function SoftwareClientProfilePage() {
    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await softwareClientAPI.getProfile();
            setProfile(response.data.profile);
        } catch (error) {
            toast.error('Failed to load profile data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['software-client']}>
                <DashboardLayout>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (!profile) return null;

    const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(168,85,247,0.08)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 14, color: '#ffffff', fontWeight: 500, lineHeight: 1.4 }}>{value}</p>
            </div>
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={['software-client']}>
            <DashboardLayout>
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
                            Client Profile
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontSize: '14px' }}>
                            Your contact and organization details registered with us.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
                        {/* Left Column: Personal Info Card */}
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24, marginBottom: 24 }}>
                                <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 16px rgba(0,0,0,0.3)', marginBottom: 16 }}>
                                    <Image src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=a855f7&color=fff`} alt={profile.fullName} width={96} height={96} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>{profile.fullName}</h2>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 12 }}>{profile.roleTitle}</p>
                                <span style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(168,85,247,0.1)', color: '#c084fc', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Software Client
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <InfoItem icon={<Mail size={16} />} label="Email Address" value={profile.email} />
                                <InfoItem icon={<Phone size={16} />} label="Phone Number" value={profile.phone} />
                                <InfoItem icon={<MapPin size={16} />} label="Location" value={`${profile.city}, ${profile.country}`} />
                                <InfoItem icon={<Clock size={16} />} label="Working Hours" value={profile.workingHours} />
                                <InfoItem icon={<AlertCircle size={16} />} label="Preferred Contact" value={profile.preferredContact} />
                            </div>
                        </motion.div>

                        {/* Right Column: Company Details Card */}
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Building size={18} style={{ color: '#a855f7' }} /> Organization Details
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Company Name</p>
                                    <p style={{ fontSize: 16, color: '#ffffff', fontWeight: 600 }}>{profile.companyName}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Industry</p>
                                    <p style={{ fontSize: 16, color: '#ffffff', fontWeight: 600 }}>{profile.industry}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Company Stage</p>
                                    <p style={{ fontSize: 16, color: '#ffffff', fontWeight: 600 }}>{profile.companyStage}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Team Size</p>
                                    <p style={{ fontSize: 16, color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Users size={16} style={{ color: 'rgba(255,255,255,0.5)' }} /> {profile.teamSize}
                                    </p>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Website</p>
                                    <a href={profile.companyWebsite} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, color: '#a855f7', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                                        <Globe size={16} /> {profile.companyWebsite}
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
