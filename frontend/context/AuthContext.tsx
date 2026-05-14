'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authAPI } from '@/lib/api';
import { UserRole } from '@/lib/accessRoles';

interface User {
    _id: string;
    role: UserRole;
    email: string;
    status: string;
    profileImageURL?: string;
    profileCompletionStatus?: boolean;

    // Influencer fields
    fullName?: string;
    age?: number;
    country?: string;
    city?: string;
    contactEmail?: string;
    niche?: string;
    bio?: string;
    shortBio?: string;
    instagramUsername?: string;
    instagramProfileURL?: string;
    instagramDPURL?: string;
    instagramUserId?: string;
    accountType?: string;
    instagramConnectionStatus?: string;
    followers?: number;
    followsCount?: number;
    mediaCount?: number;
    engagementRate?: number;
    avgLikes?: number;
    avgComments?: number;
    avgLikesPerPost?: number;
    avgCommentsPerPost?: number;
    growthRate?: number;
    lastAnalyticsRefreshAt?: string;
    instagramConnected?: boolean;
    lastSyncedAt?: string;
    avgPostCostUSD?: number;
    avgReelCostUSD?: number;
    avatar?: string;
    termsAccepted?: boolean;

    // Brand fields
    companyName?: string;
    brandName?: string;
    officialEmail?: string;
    contactPersonName?: string;
    brandGoal?: string;
    brandNiche?: string;
    approxBudgetUSD?: number;
    website?: string;
    companyWebsite?: string;
    companyCountry?: string;
    industry?: string;
    brandInstagramHandle?: string;

    // Software client fields
    roleTitle?: string;
    phone?: string;
    preferredContact?: string;
    workingHours?: string;
    companyStage?: string;
    teamSize?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    login: async () => ({ success: false }),
    logout: () => { },
    updateUser: () => { },
    refreshUser: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const verifyTimerRef = useRef<number | null>(null);

    const clearSession = useCallback((redirect = false) => {
        localStorage.removeItem('porchest_token');
        localStorage.removeItem('porchest_user');
        setToken(null);
        setUser(null);
        if (redirect && typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }, []);

    const verifySession = useCallback(async () => {
        const storedToken = localStorage.getItem('porchest_token');
        const storedUser = localStorage.getItem('porchest_user');

        if (!storedToken || !storedUser) return;

        try {
            await authAPI.getMe();
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
                clearSession(true);
            }
        }
    }, [clearSession]);

    useEffect(() => {
        const storedToken = localStorage.getItem('porchest_token');
        const storedUser = localStorage.getItem('porchest_user');
        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('porchest_token');
                localStorage.removeItem('porchest_user');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (loading || !token || !user) return;

        void verifySession();

        const onFocus = () => { void verifySession(); };
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void verifySession();
            }
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        if (verifyTimerRef.current) {
            window.clearInterval(verifyTimerRef.current);
        }
        verifyTimerRef.current = window.setInterval(() => {
            void verifySession();
        }, 30000);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            if (verifyTimerRef.current) {
                window.clearInterval(verifyTimerRef.current);
                verifyTimerRef.current = null;
            }
        };
    }, [loading, token, user, verifySession]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const { data } = await authAPI.login({ email, password });
            if (data.success) {
                localStorage.setItem('porchest_token', data.token);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                return { success: true, role: data.user.role };
            }
            return { success: false };
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            throw new Error(msg);
        }
    }, []);

    const logout = useCallback(() => {
        void authAPI.logout().catch(() => undefined).finally(() => {
            clearSession(true);
        });
    }, [clearSession]);

    const updateUser = useCallback((userData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...userData };
            localStorage.setItem('porchest_user', JSON.stringify(updated));
            return updated;
        });
    }, []);
    
    const refreshUser = useCallback(async () => {
        try {
            const { data } = await authAPI.getMe();
            if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem('porchest_user', JSON.stringify(data.user));
            }
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
