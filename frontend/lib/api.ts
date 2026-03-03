import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
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
    // Influencer discovery
    getInfluencers: (params?: Record<string, unknown>) => api.get('/brand/influencers', { params }),
    // Structured Campaign Request Documents
    createRequest: (data: Record<string, unknown>) => api.post('/brand/requests', data),
    getRequests: (params?: Record<string, unknown>) => api.get('/brand/requests', { params }),
    getRequest: (id: string) => api.get(`/brand/requests/${id}`),
    // Verified post data
    getBrandVerifications: () => api.get('/brand/verifications'),
    updateProfile: (data: Record<string, unknown>) => api.put('/brand/profile', data),
};

// ─── Influencer ──────────────────────────────────────
export const influencerAPI = {
    getDashboard: () => api.get('/influencer/dashboard'),
    updateProfile: (data: Record<string, unknown>) => api.put('/influencer/profile', data),
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
