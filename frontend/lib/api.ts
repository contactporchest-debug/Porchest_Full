import axios from 'axios';

/**
 * API base URL resolution:
 *
 *  - On Vercel (production/preview):
 *      NEXT_PUBLIC_API_URL should be set to "/api" in Vercel dashboard.
 *      This makes all requests go to the same domain, hitting our
 *      serverless function at api/index.js (no CORS issues).
 *
 *  - Locally:
 *      NEXT_PUBLIC_API_URL in frontend/.env.local → "http://localhost:5001/api"
 *
 *  Fallback: "/api" (works correctly on Vercel even without env var set).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false, // Using JWT in Authorization header, not cookies
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('porchest_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('porchest_token');
            localStorage.removeItem('porchest_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// ─── Auth ────────────────────────────────────────────
export const authAPI = {
    login: (data: { email: string; password: string }) => api.post('/auth/login', data),
    register: (data: Record<string, unknown>) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    verifyOTP: (data: { email: string; otp: string }) => api.post('/auth/verify-otp', data),
    resendOTP: (data: { email: string }) => api.post('/auth/resend-otp', data),
};

// ─── Admin ───────────────────────────────────────────
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
    updateUserStatus: (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status }),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
    // Campaign requests overview
    getRequests: (params?: Record<string, unknown>) => api.get('/admin/requests', { params }),
    // Verification queue
    getVerificationQueue: (status = 'pending') => api.get('/admin/verifications', { params: { status } }),
    reviewVerification: (id: string, status: string, adminNote?: string) =>
        api.patch(`/admin/verifications/${id}`, { status, adminNote }),
};

// ─── Brand ───────────────────────────────────────────
export const brandAPI = {
    getDashboard: () => api.get('/brand/dashboard'),
    // Profile
    getProfile: () => api.get('/brand/profile'),
    updateProfile: (data: Record<string, unknown>) => api.put('/brand/profile', data),
    // Influencer discovery
    getInfluencers: (params?: Record<string, unknown>) => api.get('/brand/influencers', { params }),
    getInfluencerDetail: (id: string) => api.get(`/brand/influencers/${id}/details`),
    // Structured Campaign Request Documents
    createRequest: (data: Record<string, unknown>) => api.post('/brand/requests', data),
    getRequests: (params?: Record<string, unknown>) => api.get('/brand/requests', { params }),
    getRequest: (id: string) => api.get(`/brand/requests/${id}`),
    // Verified post data
    getBrandVerifications: () => api.get('/brand/verifications'),
};

// ─── Influencer ──────────────────────────────────────
export const influencerAPI = {
    getDashboard: () => api.get('/influencer/dashboard'),
    // Profile
    getProfile: () => api.get('/influencer/profile'),
    updateProfile: (data: Record<string, unknown>) => api.put('/influencer/profile', data),
    // Instagram OAuth
    getInstagramConnectURL: () => api.get('/influencer/instagram/connect'),
    disconnectInstagram: () => api.post('/influencer/instagram/disconnect'),
    refreshInstagramSync: () => api.post('/influencer/instagram/refresh'),
    // Instagram Data
    getInstagramProfile: () => api.get('/influencer/instagram/profile'),
    getInstagramAnalytics: () => api.get('/influencer/instagram/analytics'),
    getInstagramMedia: () => api.get('/influencer/instagram/media'),
    // Incoming campaign requests
    getRequests: (params?: Record<string, unknown>) => api.get('/influencer/requests', { params }),
    respondToRequest: (id: string, status: 'accepted' | 'rejected', rejectionReason?: string) =>
        api.patch(`/influencer/requests/${id}`, { status, rejectionReason }),
    // Content verification
    submitVerification: (data: { campaignRequestId: string; postUrl: string }) =>
        api.post('/influencer/verify', data),
    getVerifications: () => api.get('/influencer/verifications'),
    // Earnings & Cashouts
    getEarnings: () => api.get('/influencer/earnings'),
    cashout: (amount: number) => api.post('/influencer/cashout', { amount }),
    getCashouts: () => api.get('/influencer/cashouts'),
};
