import axios from 'axios';

/**
 * API base URL resolution:
 *
 *  - On Vercel with a separate backend domain:
 *      NEXT_PUBLIC_API_URL should point to the backend API root,
 *      for example "https://api.porchest.com/api".
 *
 *  - Locally:
 *      NEXT_PUBLIC_API_URL in frontend/.env.local → "http://localhost:5001/api"
 *
 *  Fallback: "/api" for same-origin development/proxy setups.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false, // Using JWT in Authorization header, not cookies
});

function clearAuthAndRedirect() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('porchest_token');
    localStorage.removeItem('porchest_user');
    window.location.href = '/login';
}

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
        const status = error.response?.status;
        if (status === 401 && typeof window !== 'undefined') {
            clearAuthAndRedirect();
        }
        return Promise.reject(error);
    }
);

export default api;

// ─── Auth ────────────────────────────────────────────
export const authAPI = {
    login: (data: { email: string; password: string }) => api.post('/auth/login', data),
    register: (data: Record<string, unknown>) => api.post('/auth/register', data),
    googleAuth: (data: { idToken: string; role: 'brand' | 'influencer' | null }) => api.post('/auth/google', data),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
    verifyOTP: (data: { email: string; otp: string }) => api.post('/auth/verify-otp', data),
    resendOTP: (data: { email: string }) => api.post('/auth/resend-otp', data),
};

// ─── Admin ───────────────────────────────────────────
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
    updateUserStatus: (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status }),
    updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
    getCampaigns: (params?: Record<string, unknown>) => api.get('/admin/campaigns', { params }),
    getCampaignById: (id: string) => api.get(`/admin/campaigns/${id}`),
    updateCampaignStatus: (id: string, status: string) => api.patch(`/admin/campaigns/${id}/status`, { status }),
    getCollaborations: (params?: Record<string, unknown>) => api.get('/collaborations', { params }),
    getCollaboration: (id: string) => api.get(`/collaborations/${id}`),
    stopCollaboration: (id: string, reason?: string) => api.patch(`/collaborations/${id}/stop`, { reason }),
    verifyCollaboration: (id: string) => api.patch(`/collaborations/${id}/verify-admin`),
    getRequests: (params?: Record<string, unknown>) => api.get('/admin/requests', { params }),
    getVerificationQueue: (status = 'pending') => api.get('/admin/verifications', { params: { status } }),
    reviewVerification: (id: string, status: string, adminNote?: string) => api.patch(`/admin/verifications/${id}`, { status, adminNote }),
    getPayments: (params?: Record<string, unknown>) => api.get('/admin/payments', { params }),
    verifyPayment: (id: string) => api.patch(`/admin/payments/${id}/verify`),
    rejectPayment: (id: string, message?: string) => api.patch(`/admin/payments/${id}/reject`, { message }),
    getFraudDetection: (params?: Record<string, unknown>) => api.get('/admin/fraud-detection', { params }),
    analyzeFraudDetection: (data?: Record<string, unknown>) => api.post('/admin/fraud-detection/analyze', data || {}),
    requestFraudVerification: (data: { influencerIds: string[]; message?: string }) => api.post('/admin/fraud-detection/request-verification', data),
    flagFraudInfluencers: (data: { influencerIds: string[]; reason?: string }) => api.post('/admin/fraud-detection/flag', data),
    hardDeleteFraudInfluencers: (data: { influencerIds: string[] }) => api.delete('/admin/fraud-detection/delete', { data }),
    getCashouts: (params?: Record<string, unknown>) => api.get('/admin/cashouts', { params }),
    reviewCashout: (id: string, status: 'approved' | 'rejected', data?: { transactionId?: string; rejectionReason?: string }) =>
        api.patch(`/admin/cashouts/${id}`, { status, ...data }),
};

export const analyticsAPI = {
    getInfluencers: (params?: Record<string, unknown>) => api.get('/analytics/influencers', { params }),
    getInfluencer: (id: string) => api.get(`/analytics/influencers/${id}`),
    recalculateInfluencer: (id: string) => api.post(`/analytics/influencers/${id}/recalculate`),
};


// ─── Brand ───────────────────────────────────────────
export const brandAPI = {
    getDashboard: () => api.get('/brand/dashboard'),
    // Profile
    getProfile: () => api.get('/brand/profile'),
    updateProfile: (data: Record<string, unknown>) => api.put('/brand/profile', data),
    getCollaborations: (params?: Record<string, unknown>) => api.get('/collaborations', { params }),
    getCollaboration: (id: string) => api.get(`/collaborations/${id}`),
    getCollaborationAnalytics: (id: string) => api.get(`/collaborations/${id}/analytics`),
    downloadCollaborationPdf: (id: string) => api.get(`/collaborations/${id}/pdf`, { responseType: 'blob' }),
    getCampaignTrackingLink: (id: string) => api.get(`/campaigns/${id}/tracking-link`),
    getCampaignTrackingStatus: (id: string) => api.get(`/campaigns/${id}/tracking/status`),
    enableCampaignTracking: (id: string, data: { enable: boolean; platform?: string }) => api.post(`/campaigns/${id}/tracking/enable`, data),
    getCampaignPerformance: () => api.get('/campaigns/performance'),
    getInfluencerAnalytics: (id: string, period: 10 | 30 | 60 = 60) => api.get(`/influencers/${id}/analytics`, { params: { period } }),
    getInfluencer60DayAnalytics: (id: string) => api.get(`/influencers/${id}/analytics`, { params: { period: 60 } }),
    updateCollaborationRequirements: (id: string, data: Record<string, unknown>) => api.patch(`/collaborations/${id}/requirements`, data),
    verifyCollaborationContent: (id: string) => api.patch(`/collaborations/${id}/verify-content`),
    requestCollaborationRevision: (id: string, message: string) => api.post(`/collaborations/${id}/feedback`, { message, requestRevision: true }),
    stopCollaboration: (id: string, reason?: string) => api.patch(`/collaborations/${id}/stop`, { reason }),
    // Influencer discovery
    getInfluencers: (params?: Record<string, unknown>) => api.get('/brand/influencers', { params }),
    getInfluencerDetail: (id: string) => api.get(`/brand/influencers/${id}/details`),
    aiMatching: (message: string) => api.post('/brand/influencers/matching', { message }),
    profileMatching: () => api.post('/brand/influencers/profile-matching'),
    // Campaign Requests
    createRequest: (data: Record<string, unknown>) => api.post('/brand/requests', data),
    getRequests: (params?: Record<string, unknown>) => api.get('/brand/requests', { params }),
    getRequest: (id: string) => api.get(`/brand/requests/${id}`),
    updateRequest: (id: string, data: { status: string; rejectionReason?: string; agreedPrice?: number; brandMessage?: string }) =>
        api.patch(`/brand/requests/${id}`, data),
    completeCampaignPayment: (
        id: string,
        data: { payment_amount: number; proof_file?: string; proof_url?: string; payment_method?: string }
    ) => api.patch(`/collaborations/${id}/complete-payment`, data),
    // Verifications
    getBrandVerifications: () => api.get('/brand/verifications'),
    // ── Brand Instagram OAuth (separate from influencer) ──
    getInstagramConnectURL: () => api.get('/brand/instagram/connect'),
    disconnectInstagram: () => api.post('/brand/instagram/disconnect'),
    refreshInstagramSync: () => api.post('/brand/instagram/refresh'),
    getInstagramProfile: () => api.get('/brand/instagram/profile'),
    getInstagramAnalytics: () => api.get('/brand/instagram/analytics'),
    getInstagramMedia: () => api.get('/brand/instagram/media'),
    lookupPost: (postUrl: string) => api.post('/brand/instagram/post-lookup', { postUrl }),
};

// ─── Influencer ──────────────────────────────────────
export const influencerAPI = {
    getDashboard: () => api.get('/influencer/dashboard'),
    // Profile
    getProfile: () => api.get('/influencer/profile'),
    updateProfile: (data: Record<string, unknown>) => api.put('/influencer/profile', data),
    getCollaborations: (params?: Record<string, unknown>) => api.get('/collaborations', { params }),
    // Instagram OAuth
    getInstagramConnectURL: () => api.get('/influencer/instagram/connect'),
    disconnectInstagram: () => api.post('/influencer/instagram/disconnect'),
    refreshInstagramSync: () => api.post('/influencer/instagram/refresh'),
    getInstagramProfile: () => api.get('/influencer/instagram/profile'),
    getInstagramAnalytics: () => api.get('/influencer/instagram/analytics'),
    getInstagram60DayAnalytics: () => api.get('/influencer/instagram/analytics/60'),
    getInstagramMedia: () => api.get('/influencer/instagram/media'),
    lookupPost: (postUrl: string) => api.post('/influencer/instagram/post-lookup', { postUrl }),
    // Incoming campaign requests
    getRequests: (params?: Record<string, unknown>) => api.get('/influencer/requests', { params }),
    respondToRequest: (id: string, data: { status: string; rejectionReason?: string }) =>
        api.patch(`/influencer/requests/${id}`, data),
    getPerformance: () => api.get('/influencer/performance'),
    getCampaignTracking: (id: string) => api.get(`/collaborations/${id}/influencer/tracking`),
    acceptCampaignTracking: (id: string) => api.post(`/collaborations/${id}/influencer/tracking/accept`, { accept: true }),
    // Content verification
    submitVerification: (data: { campaignRequestId: string; postUrl: string }) =>
        api.post('/influencer/verify', data),
    getVerifications: () => api.get('/influencer/verifications'),
    // Earnings & Cashouts
    getEarnings: () => api.get('/influencer/earnings'),
    cashout: (amount: number) => api.post('/influencer/cashout', { amount }),
    getCashouts: () => api.get('/influencer/cashouts'),
};

export const softwareClientAPI = {
    getDashboard: () => api.get('/software-client/dashboard'),
    getProfile: () => api.get('/software-client/profile'),
    getProjects: () => api.get('/software-client/projects'),
};

export const trackingAPI = {
    getStatus: () => api.get('/tracking/status'),
    startSetup: (data: { platform?: string; method?: string }) => api.post('/tracking/setup/start', data),
    testStatus: () => api.post('/tracking/test-status'),
    checkTestStatus: () => api.post('/tracking/check-test-status'),
    getTestCampaign: () => api.get('/tracking/test-campaign'),
    getActivity: () => api.get('/tracking/activity'),
};

export const shopifyAPI = {
    getStatus: () => api.get('/integrations/shopify/status'),
    disconnect: () => api.post('/integrations/shopify/disconnect'),
    getInstallUrl: (shopDomain: string) => `${API_URL}/integrations/shopify/install?shop=${encodeURIComponent(shopDomain)}`,
    startShopifyInstall: (shopDomain: string) => api.get('/integrations/shopify/install', { params: { shop: shopDomain } }),
    connect: (data: { shopDomain: string }) => api.post('/integrations/shopify/connect', data),
};

export const woocommerceAPI = {
    connect: (data: { storeUrl: string; consumerKey: string; consumerSecret: string }) => api.post('/integrations/woocommerce/connect', data),
    getStatus: () => api.get('/integrations/woocommerce/status'),
    disconnect: () => api.post('/integrations/woocommerce/disconnect'),
};
