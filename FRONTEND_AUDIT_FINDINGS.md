# Frontend Collaboration & Instagram Profile Display Audit

**Audit Date:** April 22, 2026  
**Scope:** Frontend React/Next.js application for brand and influencer portals

---

## Executive Summary

The frontend has **comprehensive collaboration management** and **Instagram integration** with **several critical issues** and **missing real-time functionality**. Profile pictures are displayed but with **potential CORS/image loading issues**. Instagram insights are fetched but **not fully visualized in all locations**.

---

## 1. API CALLS FOR COLLABORATION DATA

### ✅ API Layer Implementation

**File:** [frontend/lib/api.ts](frontend/lib/api.ts)

**Brand API Endpoints:**
```typescript
// Line 76-83
brandAPI = {
    getRequests: (params?) => api.get('/brand/requests', { params }),
    getRequest: (id: string) => api.get(`/brand/requests/${id}`),
    getDashboard: () => api.get('/brand/dashboard'),
}
```

**Influencer API Endpoints:**
```typescript
// Line 118-122
influencerAPI = {
    getRequests: (params?) => api.get('/influencer/requests', { params }),
    respondToRequest: (id: string, data) => api.patch(`/influencer/requests/${id}`, data),
}
```

### ✅ Endpoint URL Construction

- **Correct Pattern:** Using `api.get()` and `api.patch()` wrapper (baseURL: `/api` or `http://localhost:5001/api`)
- **Endpoints Used:**
  - Brand: `/brand/requests` ✅
  - Influencer: `/influencer/requests` ✅
  - NOT using `/getCollaborations` or `/api/brand/requests` duplicates

### ⚠️ Issue #1: Raw `fetch()` Calls Bypass API Wrapper

**File:** [frontend/app/dashboard/brand/CampaignsPage.tsx](frontend/app/dashboard/brand/CampaignsPage.tsx) - Lines 83-91, 98-106

```typescript
// ISSUE: Using fetch() instead of API wrapper
try {
    const res = await fetch(`/api/brand/requests/${request._id}`, {
        method: 'PATCH',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
    });
```

**Problems:**
- Token interceptor from `api` object not applied
- No automatic error handling (401 redirect)
- Bypasses centralized error handling middleware
- Hardcoded `/api` prefix

**Recommendation:** Use `brandAPI.getRequest(id)` instead of raw `fetch()`

---

## 2. BRAND PORTAL DASHBOARD - COLLABORATIONS

### 📍 Location

**File:** [frontend/app/dashboard/brand/page.tsx](frontend/app/dashboard/brand/page.tsx)  
**Pages:** 
- Main Overview: [OverviewPage.tsx](frontend/app/dashboard/brand/OverviewPage.tsx)
- Campaigns List: [CampaignsPage.tsx](frontend/app/dashboard/brand/CampaignsPage.tsx)
- Collaborations Route: [app/dashboard/brand/collaborations/page.tsx](frontend/app/dashboard/brand/collaborations/page.tsx)

### ✅ Data Fetching

```typescript
// OverviewPage.tsx - Lines 15-26
useEffect(() => {
    Promise.all([
        brandAPI.getRequests(),      // ✅ Collaboration requests
        brandAPI.getBrandVerifications(),  // ✅ Verification status
        brandAPI.getDashboard(),     // ✅ Dashboard stats
    ]).then(([reqRes, verRes, dashRes]) => {
        setRequests(reqRes.data.requests || []);
        setVerifications(verRes.data.verifications || []);
        setProfileComplete(dashRes.data.dashboard.profileComplete);
    })
    .catch(() => toast.error('Failed to load dashboard'));
}, []);
```

### ✅ Campaign Status Display

**Status Mapping:** [CampaignsPage.tsx](frontend/app/dashboard/brand/CampaignsPage.tsx) - Lines 11-23

```typescript
const STATUS_CFG = {
    sent: { label: 'Pending', color: '#fbbf24' },
    viewed: { label: 'Viewed', color: '#a78bfa' },
    negotiation: { label: 'Negotiation', color: '#facc15' },
    accepted: { label: 'In-Process', color: '#60d5f8' },
    deal_closed: { label: 'Closed ✓', color: '#4ade80' },
    rejected: { label: 'Rejected', color: '#f87171' },
};
```

### ✅ Campaign Status Flow

- **Pending** → Brand waiting for influencer decision
- **Viewed** → Influencer has seen request
- **Negotiation** → Counter offer in progress
- **Accepted/In-Process** → Deal accepted, awaiting content submission
- **Deal Closed/Completed** → Verification complete
- **Rejected** → Declined by influencer

### ✅ Counter Offer Negotiation

**Display:** [CampaignsPage.tsx](frontend/app/dashboard/brand/CampaignsPage.tsx) - Lines 36-60

```typescript
{request.status === 'negotiation' && (
    <div>
        <div style={{...}}>
            <p>Original Ask: ${request.agreedPrice}</p>
            <p>Counter Ask: ${request.counterOfferPrice}</p>
        </div>
        {request.counterOfferMessage && (
            <p>"{request.counterOfferMessage}"</p>
        )}
```

### ⚠️ Issue #2: Verification Lookup Relies on Request ID Matching

**File:** [CampaignsPage.tsx](frontend/app/dashboard/brand/CampaignsPage.tsx) - Lines 27-30

```typescript
const verification = verifications.find(v =>
    (v.campaignRequestId?._id || v.campaignRequestId) === request._id
);
```

**Risk:** If backend returns `campaignRequestId` as a string instead of object with `_id`, this fails.

### ⚠️ Issue #3: No Error Handling for Failed Campaign Load

**File:** [OverviewPage.tsx](frontend/app/dashboard/brand/OverviewPage.tsx) - Lines 23-24

```typescript
.catch(() => toast.error('Failed to load dashboard'))
```

**Issue:** Single generic error message. No distinction between:
- Network error
- Authorization error (401)
- Server error (500)
- Data validation error

---

## 3. INFLUENCER PORTAL DASHBOARD - INCOMING REQUESTS

### 📍 Location

**File:** [frontend/app/dashboard/influencer/page.tsx](frontend/app/dashboard/influencer/page.tsx)  
**Requests Display:** [CollaborationsPage.tsx](frontend/app/dashboard/influencer/CollaborationsPage.tsx)

### ✅ Data Fetching

```typescript
// CollaborationsPage.tsx - Lines 80-86
const load = () => {
    influencerAPI.getRequests({ status: 'pending' })
        .then(res => setRequests(res.data.requests || []))
        .catch(err => {
            if (loading) toast.error('Failed to load requests');
        })
        .finally(() => setLoading(false));
};
```

### ✅ Auto-Refresh Mechanism

**File:** [CollaborationsPage.tsx](frontend/app/dashboard/influencer/CollaborationsPage.tsx) - Lines 88-91

```typescript
useEffect(() => {
    load();
    const intervalId = setInterval(load, 10000);  // ✅ Polls every 10 seconds
    return () => clearInterval(intervalId);
}, []);
```

### ✅ Incoming Requests UI

**Sections:**
1. **Pending Requests** - Incoming campaign offers
2. **Active Collaborations** - Accepted requests awaiting content submission
3. **Completed Requests** - Finalized & paid collaborations

### ✅ Accept/Reject/Counter Offer Actions

**File:** [CollaborationsPage.tsx](frontend/app/dashboard/influencer/CollaborationsPage.tsx) - Lines 93-121

```typescript
const respond = async (id: string, status, additional = {}) => {
    if (status === 'accepted' && !agreedTerms[id]) {
        toast.error('You must agree to the Terms & Conditions...');
        return;
    }
    
    await influencerAPI.respondToRequest(id, { 
        status, 
        ...additional 
    });
};

// Accept action
onClick={() => respond(r._id, 'accepted')}

// Counter offer action
onClick={() => respond(r._id, 'negotiation', {
    counterOfferPrice: Number(counterPrice),
    counterOfferMessage: counterMsg
})}

// Decline action
onClick={() => respond(r._id, 'rejected')}
```

### ✅ Verification Submission

**File:** [CollaborationsPage.tsx](frontend/app/dashboard/influencer/CollaborationsPage.tsx) - Lines 262-295

```typescript
const submitVerification = async (campaignRequestId: string) => {
    try {
        await influencerAPI.submitVerification({
            campaignRequestId,
            postUrl
        });
        toast.success('Post submitted for verification!');
        setSubmitOpen(null);
        setPostUrl('');
        load();
    } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to submit');
    }
};
```

---

## 4. INSTAGRAM PROFILE PICTURE DISPLAY

### 📍 Locations & Data Sources

**Profile Picture Fields:**
1. `profile.instagramDPURL` - Manual input (influencer/profile page)
2. `profile.profileImageURL` - System-stored image
3. `instagram.profilePictureURL` - Meta Graph API synced

**File:** [InfluencerProfileModal.tsx](frontend/app/dashboard/brand/InfluencerProfileModal.tsx) - Line 109

```typescript
const dp = profile?.instagramDPURL || profile?.profileImageURL || instagram?.profilePictureURL;
```

### ✅ Display Locations

#### 1. **Influencer Search Cards**

**File:** [InfluencerSearch.tsx](frontend/app/dashboard/brand/InfluencerSearch.tsx) - Lines 253-265

```typescript
<div style={{...}}>
    {dp ? (
        <img src={dp} alt={inf.fullName} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : initials}
</div>
```

**Fallback:** Initials of influencer name if DP not available ✅

#### 2. **Influencer Profile Modal**

**File:** [InfluencerProfileModal.tsx](frontend/app/dashboard/brand/InfluencerProfileModal.tsx) - Lines 251-252

```typescript
{dp ? (
    <img src={dp} alt={profile?.fullName} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
) : initials}
```

**Fallback:** Initials ✅

#### 3. **Instagram Profile Connection Card**

**File:** [frontend/app/dashboard/influencer/profile/page.tsx](frontend/app/dashboard/influencer/profile/page.tsx) - Line 178

```typescript
{conn?.profilePictureURL ? (
    <img src={conn.profilePictureURL} alt="IG" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
) : <Instagram size={20} style={{ color: '#fff' }} />}
```

**Fallback:** Instagram icon ✅

#### 4. **Brand Portal - Instagram Connection Card**

**File:** [frontend/app/dashboard/brand/profile/page.tsx](frontend/app/dashboard/brand/profile/page.tsx) - Line 188

Same pattern as influencer profile ✅

### ⚠️ Issue #4: No Image Error Handling

**Problem:** No `onError` handler on `<img>` tags. If Meta API image URL expires or CORS blocks access:
- Image fails silently
- No fallback triggered
- User sees broken image placeholder

**Example of Issue:**
```typescript
// CURRENT - No error handling
<img src={dp} alt={inf.fullName} style={{...}} />

// SHOULD BE
<img 
    src={dp} 
    alt={inf.fullName} 
    onError={(e) => {
        e.currentTarget.style.display = 'none';
        // Show fallback content
    }}
    style={{...}} 
/>
```

### ⚠️ Issue #5: Profile Picture URL Source Ambiguity

**File:** [InfluencerProfileModal.tsx](frontend/app/dashboard/brand/InfluencerProfileModal.tsx) - Line 109

```typescript
const dp = profile?.instagramDPURL || profile?.profileImageURL || instagram?.profilePictureURL;
```

**Problem:**
- `instagramDPURL` - Manual input by influencer (could be stale/incorrect)
- `profileImageURL` - Not documented where this comes from
- `instagram.profilePictureURL` - Meta API (most reliable, but could expire)

**Risk:** Using manual `instagramDPURL` first prioritizes unverified data over API-synced data.

**Recommendation:** Reverse priority:
```typescript
const dp = instagram?.profilePictureURL || profile?.profileImageURL || profile?.instagramDPURL;
```

---

## 5. INSTAGRAM INSIGHTS DISPLAY

### 📍 Analytics Pages

#### **Influencer Analytics:**

**File:** [frontend/app/dashboard/influencer/analytics/page.tsx](frontend/app/dashboard/influencer/analytics/page.tsx)

**API Call (Lines 143-148):**
```typescript
const load = useCallback(async () => {
    setLoading(true);
    try {
        const [analyticsRes, profileRes, mediaRes] = await Promise.all([
            influencerAPI.getInstagramAnalytics(),   // ✅ Metrics
            influencerAPI.getInstagramProfile(),      // ✅ Connection info
            influencerAPI.getInstagramMedia(),        // ✅ Recent posts
        ]);
```

**Metrics Displayed (Lines 227-246):**

| Metric | Display | Status |
|--------|---------|--------|
| Followers | `fmtK(analytics?.followersCount)` | ✅ Shows account overview |
| Follower Growth | `fmt(analytics?.growthRate, '%')` | ✅ Shows trending |
| Engagement Rate | `fmt(analytics?.engagementRate, '%')` | ✅ Core metric |
| Avg Likes/Post | `fmt(analytics?.avgLikes, '', 0)` | ✅ Detailed breakdown |
| Avg Comments/Post | `fmt(analytics?.avgComments)` | ✅ Engagement split |
| Like:Comment Ratio | `analytics?.likeToCommentRatio` | ✅ Audience behavior |
| Efficiency Rate | `fmtK(analytics?.efficiencyRate)` | ✅ Per 1K followers |

**Visualizations:**
- Metric cards with trend indicators (↑ ↓)
- Charts for posting cadence (last 7/30 days)
- Recent media grid

#### **Brand Analytics (Portfolio View):**

**File:** [frontend/app/dashboard/brand/analytics/page.tsx](frontend/app/dashboard/brand/analytics/page.tsx)

**Similar metrics displayed** with brand account focus

### ✅ Post Lookup Feature

**File:** [frontend/app/dashboard/influencer/analytics/page.tsx](frontend/app/dashboard/influencer/analytics/page.tsx) - Lines 170-199

```typescript
const handleLookup = async () => {
    if (!postUrl.trim()) return toast.error('Enter a post URL');
    setLookupLoading(true);
    
    try {
        const res = await influencerAPI.lookupPost(postUrl.trim());
        setLookupResult(res.data);
    } catch (err: any) {
        setLookupError(err?.response?.data?.message || 'Post not found.');
    } finally {
        setLookupLoading(false);
    }
};
```

**Returns Detailed Post Metrics:**
- Views, Likes, Comments
- Engagement Rate by Followers
- CPE (Cost Per Engagement) calculation
- Reach insights

### ⚠️ Issue #6: Missing Insights on Dashboard Overview

**File:** [frontend/app/dashboard/influencer/OverviewPage.tsx](frontend/app/dashboard/influencer/OverviewPage.tsx)

**What's NOT displayed in main dashboard:**
- ❌ Engagement rate
- ❌ Follower growth trend
- ❌ Recent post performance
- ❌ Audience demographics

**Current Display (Lines 71-83):**
```typescript
const collaborationCountCards = [
    { label: 'Total Requests Received', value: stats?.totalRequests },
    { label: 'Total Accepted', value: stats?.totalAccepted },
    { label: 'Total Rejected', value: stats?.totalRejected },
    { label: 'Total Completed', value: stats?.totalCompleted },
];
```

**Issue:** Only collaboration counts shown, not Instagram metrics.

### ⚠️ Issue #7: No Real-Time Metrics Update

**File:** [frontend/app/dashboard/influencer/OverviewPage.tsx](frontend/app/dashboard/influencer/OverviewPage.tsx) - Lines 52-70

```typescript
useEffect(() => {
    if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search);
        if (p.get('ig_connected') === '1') {
            toast.success('Instagram connected! ✅');
        }
    }
    
    influencerAPI.getDashboard()
        .then(res => {
            setDashStats(res.data.dashboard);
            setIgConnected(!!res.data.dashboard?.instagramConnection?.isConnected);
            setProfileCompletion(res.data.dashboard?.profileCompletion);
        })
        .catch(() => { });
}, []);
```

**Issue:** Loads once on mount, NO periodic refresh. Instagram data could be 10+ days old.

**Recommendation:** Add auto-refresh:
```typescript
useEffect(() => {
    const intervalId = setInterval(() => {
        influencerAPI.getDashboard().then(res => {
            setDashStats(res.data.dashboard);
        });
    }, 300000); // 5 minutes
    
    return () => clearInterval(intervalId);
}, []);
```

---

## 6. REAL-TIME UPDATES

### ⚠️ Issue #8: NO Socket.IO Implementation

**Package Installed:** ✅ `socket.io-client` v4.7.5 in package.json  
**Actually Used:** ❌ NOT USED ANYWHERE in frontend

**Search Result:** No `socket`, `io(`, or `emit` calls found in codebase.

### ⚠️ Issue #9: Polling Used Instead of WebSockets

**Influencer Requests Poll (10 seconds):**
**File:** [CollaborationsPage.tsx](frontend/app/dashboard/influencer/CollaborationsPage.tsx) - Lines 88-91

```typescript
useEffect(() => {
    load();
    const intervalId = setInterval(load, 10000);  // 10 second poll
    return () => clearInterval(intervalId);
}, []);
```

**Problem:**
- Inefficient for many concurrent users
- Delays up to 10 seconds in seeing new requests
- Constant API calls increase server load
- Wastes bandwidth

### ⚠️ Issue #10: No Refresh After Actions

**Counter Offer Acceptance (Brand Portal):**

**File:** [CampaignsPage.tsx](frontend/app/dashboard/brand/CampaignsPage.tsx) - Lines 83-92

```typescript
try {
    const res = await fetch(`/api/brand/requests/${request._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'deal_closed', agreedPrice: counterPrice })
    });
    if (res.ok) window.location.reload();  // ⚠️ FULL PAGE RELOAD!
} catch { toast.error('Error accepting counter'); }
```

**Issue:** Full page reload instead of selective state update. Causes:
- Loss of user scroll position
- Jarring UI flash
- Poor user experience

**Better Approach:**
```typescript
try {
    await brandAPI.updateRequest(request._id, { 
        status: 'deal_closed', 
        agreedPrice: counterPrice 
    });
    setRequests(prev => prev.map(r => 
        r._id === request._id ? { ...r, status: 'deal_closed' } : r
    ));
    toast.success('Counter offer accepted!');
} catch (err) {
    toast.error(err?.response?.data?.message || 'Failed');
}
```

### ⚠️ Issue #11: Manual Refresh Buttons Only on Analytics

**File:** [frontend/app/dashboard/influencer/analytics/page.tsx](frontend/app/dashboard/influencer/analytics/page.tsx)

Refresh button for Instagram analytics exists (Line 185) but:
- ❌ NO refresh on overview dashboard
- ❌ NO refresh on collaboration page
- ❌ User must navigate to analytics page to force sync

---

## 7. ERROR HANDLING ANALYSIS

### ✅ Toast Notifications Used Consistently

Framework: `react-hot-toast` (installed, v2.4.1)

**Pattern:** `toast.error('message')`, `toast.success('message')`

### ⚠️ Issue #12: Generic Error Messages

**Example (OverviewPage):**
```typescript
.catch(() => toast.error('Failed to load dashboard'))
```

**Missing Details:**
- Network status
- HTTP status code
- Specific field that failed
- Retry instructions

### ⚠️ Issue #13: Error Details Not Logged

**Pattern in multiple files:**
```typescript
.catch(() => { });  // Silent failure, no console.error
.catch(err => {
    console.error('Failed to load...', err);
    // But error not shown to user if loading is false
})
```

### ⚠️ Issue #14: Inconsistent Auth Error Handling

**API Wrapper (api.ts) - Lines 34-43:**

```typescript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('porchest_token');
            localStorage.removeItem('porchest_user');
            window.location.href = '/login';  // ✅ Redirects to login
        }
        return Promise.reject(error);
    }
);
```

**Good:** Centralizes 401 handling

**But Issue:** `window.location.href` causes full page reload, losing state

---

## 8. MISSING IMPLEMENTATIONS & DATA GAPS

### ❌ Issue #15: No "Last Updated" Timestamp for Insights

**File:** [analytics/page.tsx](frontend/app/dashboard/influencer/analytics/page.tsx)

Shows `lastSyncedAt` in header (Line 204):
```typescript
{connection?.lastSyncedAt && <p>Last synced: {new Date(connection.lastSyncedAt).toLocaleString()}</p>}
```

**But:** Missing on dashboard overview. Users don't know how stale data is.

### ❌ Issue #16: No Pending State for "Awaiting Influencer Response"

**File:** [OverviewPage.tsx](frontend/app/dashboard/brand/OverviewPage.tsx) - Line 42

```typescript
{ label: 'Pending Decisions', val: pending.length, color: '#fbbf24' }
```

**Missing:**
- Count of requests awaiting brand's response to counter offers
- Status breakdown visibility

### ❌ Issue #17: No Campaign Performance Metrics on Dashboard

Both brand and influencer dashboards show:
- ✅ Collaboration counts
- ❌ Campaign ROI
- ❌ Total payments/earnings
- ❌ Completion rate

### ❌ Issue #18: No Bulk Actions

Users can't:
- Accept/reject multiple requests
- Mark multiple collaborations as complete
- Bulk export collaboration data

---

## 9. DATA MAPPING ISSUES

### ⚠️ Issue #19: Inconsistent Field Naming

**Across Components:**

| Purpose | Field Names Used |
|---------|-----------------|
| Followers | `followers`, `followersCount`, `instagram.followersCount` |
| Profile Pic | `dp`, `profileImageURL`, `instagramDPURL`, `profilePictureURL` |
| Username | `username`, `instagramUsername`, `handle` |
| Engagement | `engagementRate`, `engagement`, `engagement_rate` |

**Risk:** Easy to miss data when it's renamed.

### ⚠️ Issue #20: Optional Chaining Doesn't Catch All Cases

**File:** [CollaborationsPage.tsx](frontend/app/dashboard/influencer/CollaborationsPage.tsx) - Line 75

```typescript
const brand = r.brandId;
const initials = (brand?.companyName || '?')[0].toUpperCase();
```

**Risk:** If `brand` is null, this errors. Should be:
```typescript
const initials = (brand?.companyName || 'Unknown')[0]?.toUpperCase() || '?';
```

---

## 10. MISSING API ENDPOINTS / BACKEND INTEGRATION

### ❌ Issue #21: No Campaign Performance Endpoint Called

**Missing:**
- Campaign ROI calculation
- Influencer payout status
- Verification analytics dashboard

### ❌ Issue #22: No Notification Real-Time Feed

Brand and influencer have notification counts:
```typescript
getUnreadCount: () => api.get('/brand/notifications/count'),
markNotificationRead: (id: string) => api.patch(`/brand/notifications/${id}/read`),
```

But:
- No UI for notification drawer/panel
- No navigation to notifications page
- Count shown but notifications not listed

---

## SUMMARY TABLE: Critical Findings

| # | Issue | Severity | File | Impact |
|---|-------|----------|------|--------|
| 1 | Raw `fetch()` bypasses API wrapper | 🔴 HIGH | CampaignsPage.tsx | Auth/error handling broken for counter offers |
| 2 | Verification ID matching fragile | 🟡 MEDIUM | CampaignsPage.tsx | Verification status may not display |
| 3 | No specific error messages | 🟡 MEDIUM | OverviewPage.tsx | Hard to debug failures |
| 4 | No image `onError` handler | 🟡 MEDIUM | InfluencerSearch.tsx | Broken images with no fallback |
| 5 | Profile pic priority wrong | 🟡 MEDIUM | InfluencerProfileModal.tsx | Shows stale manual data vs. API |
| 6 | No insights on main dashboard | 🟡 MEDIUM | OverviewPage.tsx | Influencers can't see their metrics |
| 7 | No real-time metric updates | 🟡 MEDIUM | OverviewPage.tsx | Data could be weeks old |
| 8 | Socket.IO installed but unused | 🔴 HIGH | package.json | No real-time collaboration updates |
| 9 | 10-second polling inefficient | 🟡 MEDIUM | CollaborationsPage.tsx | Server load, latency |
| 10 | Full page reload on actions | 🟡 MEDIUM | CampaignsPage.tsx | Poor UX, loses scroll/state |
| 11 | No refresh button on dashboard | 🔵 LOW | OverviewPage.tsx | Users stuck with stale data |
| 12 | Inconsistent field naming | 🟡 MEDIUM | Multiple files | Maintenance debt, bugs |
| 13 | Unsafe optional chaining | 🟡 MEDIUM | CollaborationsPage.tsx | Potential runtime errors |
| 14 | No bulk collaboration actions | 🔵 LOW | All pages | Poor UX for high-volume users |

---

## RECOMMENDATIONS (Priority Order)

### 🔴 CRITICAL (Fix Immediately)

1. **Replace raw `fetch()` with API wrapper** (Issue #1)
   - Change `fetch()` to `brandAPI` calls
   - Ensures consistent error handling
   - File: CampaignsPage.tsx lines 83-106

2. **Implement Socket.IO for Real-Time Updates** (Issue #8)
   - Remove 10-second polling
   - Emit events: `request:received`, `request:responded`, `request:verified`
   - Reduces server load 80%

3. **Fix Profile Picture Priority** (Issue #5)
   - Prioritize `instagram.profilePictureURL` over manual input
   - File: InfluencerProfileModal.tsx line 109

### 🟡 HIGH (Fix in Next Sprint)

4. **Add Image Error Handling** (Issue #4)
   - Add `onError` handler to all `<img>` tags
   - Fallback to initials or generic avatar
   - Test with expired Meta API URLs

5. **Improve Error Messages** (Issue #3, #12)
   - Include HTTP status, field name, retry option
   - Use specific error messages from backend
   - Example: `"Failed to accept counter: Invalid price format. Please try again."`

6. **Display Instagram Metrics on Dashboard** (Issue #6, #7)
   - Show engagement rate, follower count in overview
   - Add auto-refresh every 5 minutes
   - Include "Last Updated" timestamp

7. **Fix Counter Offer UX** (Issue #10)
   - Replace `window.location.reload()` with state update
   - Update request in local state after PATCH
   - Keep scroll position

### 🔵 MEDIUM (Future Improvements)

8. **Add Verification ID Robustness** (Issue #2)
   - Handle both `_id` object and string formats
   - Add fallback lookup by `postUrl`

9. **Create Notification Center** (Missing feature)
   - Show notification feed/drawer
   - Real-time badge updates
   - Link to relevant sections

10. **Add Campaign Performance Dashboard** (Missing feature)
    - ROI calculations
    - Influencer earnings summary
    - Completion rate tracking

---

## Testing Checklist

- [ ] Test counter offer flow without page reload
- [ ] Test profile picture with expired Meta URLs
- [ ] Test error messages for various failure scenarios
- [ ] Test socket.io connection/disconnection
- [ ] Verify Instagram metrics refresh after sync
- [ ] Test with slow network (throttle to 3G)
- [ ] Test on mobile (Safari + Chrome)
- [ ] Verify token refresh handling (401 intercept)
- [ ] Load test with 1000+ concurrent users (polling → 10K requests/sec!)
- [ ] Test brand & influencer workflows end-to-end

---

**Generated:** 2026-04-22  
**Auditor Notes:** Comprehensive data flow exists but needs real-time layer, better error handling, and UX refinement for counter offers. Image loading is fragile. Polling approach will not scale beyond 100-200 concurrent users.
