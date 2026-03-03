'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
    _id: string;
    role: 'admin' | 'brand' | 'influencer';
    email: string;
    status: string;
    profileImageURL?: string;

    // Influencer fields
    fullName?: string;
    age?: number;
    country?: string;
    contactEmail?: string;
    niche?: string;
    bio?: string;
    instagramUsername?: string;
    instagramProfileURL?: string;
    instagramDPURL?: string;
    accountType?: string;
    followers?: number;
    engagementRate?: number;
    instagramConnected?: boolean;
    avgPostCostUSD?: number;
    avgReelCostUSD?: number;
    avatar?: string;
    termsAccepted?: boolean;

    // Brand fields
    companyName?: string;
    brandGoal?: string;
    brandNiche?: string;
    approxBudgetUSD?: number;
    website?: string;
    industry?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    login: async () => ({ success: false }),
    logout: () => { },
    updateUser: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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

    const login = async (email: string, password: string) => {
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
    };

    const logout = () => {
        localStorage.removeItem('porchest_token');
        localStorage.removeItem('porchest_user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updated = { ...user, ...userData };
            setUser(updated);
            localStorage.setItem('porchest_user', JSON.stringify(updated));
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
