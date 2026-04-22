# Porchest Collaboration System - Comprehensive Audit
**Date:** April 22, 2026 | **Scope:** Complete collaboration workflow across frontend & backend

---

## 1. BACKEND MODELS & DATABASE SCHEMAS

### 1.1 CampaignRequest Model
**File:** [backend/models/CampaignRequest.js](backend/models/CampaignRequest.js)

**Purpose:** Core data model for all brand→influencer collaboration requests

**Key Fields:**
- **Participants:** `brandUserId`, `influencerUserId`, `brandProfileId`, `influencerProfileId`
- **Campaign Details:** `campaignTitle`, `campaignDescription`, `campaignType` (enum: 'sponsored_post', 'ugc', 'affiliate', 'review', 'story', 'reel')
- **Deliverables:** `deliverables`, `requiredElements`, `videoLength`, `contentGuidelines`, `hashtags`, `disclosureRequirements`
- **Budget:** `agreedPrice`, `budgetRangeMin`, `budgetRangeMax`, `paymentTerms`, `currency`
- **Timeline:** `postingDeadline`, `campaignStartDate`, `campaignEndDate`
- **Communication:** `brandMessage`

**Status Lifecycle:**
```
'sent' → 'viewed' → (accepted/rejected/negotiation/deal_closed/expired/cancelled)
                      ├─ 'accepted' → 'deal_closed'
                      ├─ 'rejected'
                      ├─ 'negotiation' → (accepted/rejected/deal_closed)
```

**Timestamps:**
- `sentAt`, `viewedAt`, `acceptedAt`, `rejectedAt`, `negotiationStartedAt`, `dealClosedAt`, `expiredAt`, `cancelledAt`

**Negotiation Fields:**
- `counterOfferPrice`, `counterOfferMessage`, `rejectionReason`

**Denormalized Snapshots** (for quick display without JOIN):
- Brand: `brandName`, `brandLogoUrl`, `brandCategory`
- Influencer: `influencerName`, `influencerUsername`, `influencerProfilePic`, `influencerNiche`

**Indexes:**
```javascript
{ brandUserId: 1, status: 1 }
{ influencerUserId: 1, status: 1 }
{ status: 1, createdAt: -1 }
```

---

### 1.2 InfluencerProfile Model
**File:** [backend/models/InfluencerProfile.js](backend/models/InfluencerProfile.js)

**Key Collaboration-Related Fields:**
- `userId`: Reference to User account
- `fullName`, `displayName`, `instagramUsername`
- `profilePictureUrl`: App profile picture (field name inconsistency!)
- `instagramDPURL`: ⚠️ **Legacy field** - now stored as `profilePictureUrl` via Instagram OAuth
- `niche`, `categories`, `tags`
- `avgPostPrice`, `avgReelPrice`: Pricing signals for collaboration matching
- `followersCount`, `engagementRate`: Matching criteria
- `instagramConnected`, `instagramConnectionStatus`: OAuth connection status
- `isSearchable`: Controls visibility to brands
- `verificationStatus`: 'unverified' | 'pending' | 'verified' | 'rejected'

---

### 1.3 BrandProfile Model
**File:** [backend/models/BrandProfile.js](backend/models/BrandProfile.js)

**Key Collaboration-Related Fields:**
- `userId`: Reference to User account
- `brandName`, `companyName`, `category`, `subcategory`
- `logoUrl`, `instagramDPURL`
- `preferredCollaborationType`: ['sponsored_post', 'ugc', 'affiliate']
- `budgetRange`, `approxBudgetUSD`
- `targetAudiencePreferences`, `preferredInfluencerCategories`
- `instagramConnected`, `instagramConnectionStatus`: OAuth connection status
- `followersCount`, `engagementRate`: For brand credibility

---

### 1.4 Notification Model
**File:** [backend/models/Notification.js](backend/models/Notification.js)

**Collaboration-Related Types:**
- `collaboration_request`: New campaign request sent to influencer
- `request_viewed`: Influencer viewed brand's request
- `request_accepted`: Influencer accepted collaboration
- `request_rejected`: Influencer declined collaboration
- `negotiation`: Counter offer received
- `deal_closed`: Deal confirmed

---

## 2. BACKEND CONTROLLERS & API ENDPOINTS

### 2.1 Campaign Request Controller
**File:** [backend/controllers/campaignRequestController.js](backend/controllers/campaignRequestController.js)

#### Function: `createRequest()` (Lines 11-96)
**Route:** `POST /api/brand/requests`  
**Authentication:** Required (brand role)  
**Purpose:** Brand creates new campaign request to influencer

**Request Body:**
```javascript
{
  influencerId: ObjectId,
  campaignTitle: string (required),
  campaignDescription: string,
  campaignType: string,           // 'sponsored_post', 'ugc', 'affiliate', etc.
  deliverables: string (required),
  requiredElements: string (required),
  videoLength: string (required),
  contentGuidelines: string (required),
  hashtags: string,
  disclosureRequirements: string,
  agreedPrice: number,
  budgetRangeMin: number,
  budgetRangeMax: number,
  paymentTerms: string,
  postingDeadline: date,
  campaignStartDate: date,
  campaignEndDate: date,
  brandMessage: string
}
```

**Process:**
1. Validates `influencerId` and `campaignTitle`
2. Fetches brand and influencer profiles
3. Generates unique request code (REQ-xxx)
4. Creates CampaignRequest with denormalized snapshots
5. Creates notification for influencer
6. Returns created request

**Response:**
```javascript
{ success: true, request: CampaignRequest }
```

**Error Handling:**
- 400: Missing required fields
- 404: Influencer not found
- Generic error caught by errorHandler middleware

---

#### Function: `getBrandRequests()` (Lines 97-126)
**Route:** `GET /api/brand/requests`  
**Query Parameters:**
- `status`: Filter by status ('all' returns all)
- `page`: Pagination (default 1)
- `limit`: Results per page (default 50)

**Process:**
1. Filters by `brandUserId` and optional `status`
2. Sorts by creation date (newest first)
3. Returns paginated results

**Response:**
```javascript
{
  success: true,
  requests: CampaignRequest[],
  total: number,
  page: number,
  totalPages: number
}
```

---

#### Function: `getBrandRequestDetail()` (Lines 128-147)
**Route:** `GET /api/brand/requests/:id`  
**Purpose:** Get single request details for brand

**Response:**
```javascript
{ success: true, request: CampaignRequest }
```

---

#### Function: `getInfluencerRequests()` (Lines 149-202)
**Route:** `GET /api/influencer/requests`  
**Query Parameters:** Same as `getBrandRequests()`

**⚠️ ISSUE - AUTO-STATUS UPDATE (SIDE EFFECT):**
```javascript
// Lines 173-185: Auto-updates 'sent' requests to 'viewed' on fetch
const unviewedIds = requests.filter(r => r.status === 'sent').map(r => r._id);
if (unviewedIds.length > 0) {
    await CampaignRequest.updateMany(
        { _id: { $in: unviewedIds } },
        { $set: { status: 'viewed', viewedAt: new Date() } }
    );
    // Sends notifications to brands
}
```

**Problem:** This is a side effect on a GET request - modifies data while reading  
**Recommendation:** Either make this explicit (`GET?markAsViewed=true`) or move to separate endpoint

---

#### Function: `respondToRequest()` (Lines 204-281)
**Route:** `PATCH /api/influencer/requests/:id`  
**Authentication:** Required (influencer role)

**Request Body:**
```javascript
{
  status: 'accepted' | 'rejected' | 'negotiation' | 'deal_closed',
  rejectionReason?: string,
  counterOfferPrice?: number,
  counterOfferMessage?: string
}
```

**Process:**
1. Validates request ID and status
2. Fetches request (influencer ownership check)
3. Updates status and relevant timestamps
4. Creates notification for brand
5. Saves request

**Status Transitions:**
- `accepted`: Sets `acceptedAt`
- `rejected`: Sets `rejectedAt`, stores `rejectionReason`
- `negotiation`: Sets `negotiationStartedAt`, stores counter offer details
- `deal_closed`: Sets `dealClosedAt`

**Response:**
```javascript
{ success: true, request: CampaignRequest }
```

---

#### Function: `brandRespondToRequest()` (Lines 283-370)
**Route:** `PATCH /api/brand/requests/:id`  
**Authentication:** Required (brand role)  
**Purpose:** Brand responds to influencer counter-offers or initiates negotiation

**Request Body:**
```javascript
{
  status: 'accepted' | 'rejected' | 'negotiation' | 'deal_closed' | 'cancelled',
  agreedPrice?: number,
  brandMessage?: string,
  rejectionReason?: string
}
```

**Allowed Transitions:**
- From `negotiation`: can `accept`, `reject`, `deal_closed`, `cancelled`
- Response to counter offer

**Notifications Sent:**
- Notifies influencer of brand's response

---

#### Function: `getVerifications()` (Lines 372-409)
**Route:** `GET /api/brand/verifications`  
**Purpose:** Brand retrieves verification/content submission records from influencers

**Process:**
1. Filters verifications by brand's campaign requests
2. Returns verification status and post URLs
3. Includes admin review status

**Response:**
```javascript
{
  success: true,
  verifications: [
    {
      _id: ObjectId,
      campaignRequestId: ObjectId,
      postUrl: string,
      status: 'pending' | 'verified' | 'rejected',
      performance: { views, likes, comments, shares },
      adminNote?: string
    }
  ]
}
```

---

### 2.2 Backend API Routes

#### Brand Routes
**File:** [backend/routes/brand.js](backend/routes/brand.js)

```javascript
// Campaign Requests
POST   /api/brand/requests              → createRequest()
GET    /api/brand/requests              → getBrandRequests()
GET    /api/brand/requests/:id          → getBrandRequestDetail()
PATCH  /api/brand/requests/:id          → brandRespondToRequest()

// Influencer Discovery
GET    /api/brand/influencers           → getMatchedInfluencers()
GET    /api/brand/influencers/:id/details → getInfluencerDetail()
```

#### Influencer Routes
**File:** [backend/routes/influencer.js](backend/routes/influencer.js)

```javascript
// Campaign Requests (incoming)
GET    /api/influencer/requests         → getInfluencerRequests()
PATCH  /api/influencer/requests/:id     → respondToRequest()
```

---

## 3. FRONTEND API WRAPPER

**File:** [frontend/lib/api.ts](frontend/lib/api.ts)

### Brand API Methods
```typescript
brandAPI.createRequest(data)          // POST /brand/requests
brandAPI.getRequests(params)          // GET /brand/requests
brandAPI.getRequest(id)               // GET /brand/requests/:id
brandAPI.updateRequest(id, data)      // PATCH /brand/requests/:id
  // data: { status, rejectionReason?, agreedPrice? }
brandAPI.getInfluencers(params)       // GET /brand/influencers
brandAPI.getInfluencerDetail(id)      // GET /brand/influencers/:id/details
brandAPI.getBrandVerifications()      // GET /brand/verifications
```

### Influencer API Methods
```typescript
influencerAPI.getRequests(params)     // GET /influencer/requests
influencerAPI.respondToRequest(id, data)  // PATCH /influencer/requests/:id
  // data: { status, rejectionReason?, counterOfferPrice?, counterOfferMessage? }
influencerAPI.submitVerification(data)    // POST /influencer/verify
  // data: { campaignRequestId, postUrl }
influencerAPI.getVerifications()      // GET /influencer/verifications
```

---

## 4. FRONTEND PAGES & COMPONENTS

### 4.1 BRAND COLLABORATION PAGES

#### Brand Collaborations Page
**File:** [frontend/app/dashboard/brand/collaborations/page.tsx](frontend/app/dashboard/brand/collaborations/page.tsx)

**Purpose:** Main collaboration management hub for brands  
**Wraps:** `CampaignsPage` component

---

#### CampaignsPage Component
**File:** [frontend/app/dashboard/brand/CampaignsPage.tsx](frontend/app/dashboard/brand/CampaignsPage.tsx) (~650+ lines)

**Purpose:** Comprehensive campaigns/requests management for brands

**Key Features:**
1. **Request Filtering:** By status (all, pending, negotiation, accepted, rejected)
2. **Real-time Updates:** Via Socket.IO (`useCollaborationUpdates` hook)
3. **Request Details Display:** Campaign specs, pricing, timeline, content guidelines
4. **Status Management:** 
   - Accept/reject influencer responses
   - Respond to counter offers
   - Close deals
5. **Verification Tracking:** Display influencer post URLs and verification status
6. **Performance Metrics:** Show likes, comments, views on verified posts

**Data Fetching:**
```typescript
const fetchData = useCallback(async () => {
  const [requestsRes, verificationsRes] = await Promise.all([
    brandAPI.getRequests(),        // Get all brand's requests
    brandAPI.getBrandVerifications() // Get verification status
  ]);
}, []);

// Real-time updates via Socket
useCollaborationUpdates(useCallback((data) => {
  console.log('[Influencer Collaboration Update]', data);
  setRefreshTrigger(p => p + 1);  // Trigger refetch
}, []));

// Polling as fallback (every 30s)
useEffect(() => {
  const intervalId = setInterval(load, 30000);
  return () => clearInterval(intervalId);
}, []);
```

**Status Configuration:**
```typescript
STATUS_CFG = {
  sent: { label: 'Pending', color: '#fbbf24', icon: Clock },
  viewed: { label: 'Viewed', color: '#a78bfa', icon: Eye },
  negotiation: { label: 'Negotiation', color: '#facc15', icon: AlertCircle },
  accepted: { label: 'In-Process', color: '#60d5f8', icon: PlayCircle },
  deal_closed: { label: 'Closed ✓', color: '#4ade80', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#f87171', icon: XCircle }
}
```

**Actions Available:**
- Accept counter offer: `brandAPI.updateRequest(id, { status: 'deal_closed', agreedPrice: newPrice })`
- Reject counter offer: `brandAPI.updateRequest(id, { status: 'rejected', rejectionReason: '...' })`
- Counter back: `brandAPI.updateRequest(id, { status: 'negotiation', agreedPrice: newPrice })`

**UI Issues Found:**
1. ✅ FIXED: Raw fetch() calls replaced with `brandAPI.updateRequest()`
2. ✅ FIXED: Removed `window.location.reload()` - now uses state updates
3. ✅ FIXED: Added error handling with toast notifications
4. ✅ FIXED: Added image error fallback handling (`brokenImages` state)

---

#### CreateRequestModal Component
**File:** [frontend/app/dashboard/brand/CreateRequestModal.tsx](frontend/app/dashboard/brand/CreateRequestModal.tsx)

**Purpose:** Modal form for brands to create new campaign requests

**Form Fields:**
- Campaign Title (required)
- Campaign Description (required)
- Deliverables (required)
- Required Elements (required)
- Video Length (required) - dropdown options
- Posting Deadline (required)
- Content Guidelines (required)
- Hashtags (optional)
- Disclosure Requirements (default: '#Ad #Sponsored')
- Agreed Price (required)

**Submission:**
```typescript
await brandAPI.createRequest({
  influencerId: influencer._id,
  ...formData,
  agreedPrice: Number(form.agreedPrice),
  paymentTerms: '50% advance before campaign starts, 50% after deliverables are verified',
  postingDeadline: new Date(form.postingDeadline).toISOString(),
});
```

**Important Note:** All terms are locked once submitted; agreed price cannot be renegotiated

---

#### InfluencerSearch Component
**File:** [frontend/app/dashboard/brand/InfluencerSearch.tsx](frontend/app/dashboard/brand/InfluencerSearch.tsx)

**Purpose:** Discover & filter influencers for collaboration

**Filters Available:**
- Niche (14 categories)
- Follower Range (5 tiers)
- Engagement Rate (4 thresholds)
- Country (10 countries)
- Cost Range (4 price brackets)

**Fetch Logic:**
```typescript
const fetchInfluencers = useCallback(async () => {
  const params: Record<string, unknown> = {};
  // Build params from filters...
  const res = await brandAPI.getInfluencers(params);
  setInfluencers(res.data.influencers || []);
}, [niche, followerRange, country, engagementRange, costRange]);
```

**Card Display:**
- Name, niche, followers, engagement rate
- Average cost (post & reel)
- Fit score & quality label
- Instagram connection status

**Action:** Click "Request Collaboration" → Opens `CreateRequestModal`

---

#### InfluencerProfileModal Component
**File:** [frontend/app/dashboard/brand/InfluencerProfileModal.tsx](frontend/app/dashboard/brand/InfluencerProfileModal.tsx) (~1000+ lines)

**Purpose:** Detailed influencer profile view with analytics

**Key Information Displayed:**
- Profile picture, name, niche, followers
- Engagement rate, average likes/comments
- Demographics breakdown
- Recent posts/reels performance
- Fit score analysis
- Pricing information

**DP Priority (FIXED):**
```typescript
// ✅ FIXED: Correct field priority
const dp = profile?.profilePictureUrl || profile?.instagramDPURL || profile?.profileImageURL;
```

**Image Error Handling (FIXED):**
```typescript
const [dpError, setDpError] = useState(false);
<img 
  src={dp} 
  onError={() => setDpError(true)} 
  alt="IG"
/>
// Shows initials as fallback if image fails
```

---

### 4.2 INFLUENCER COLLABORATION PAGES

#### Influencer CollaborationsPage
**File:** [frontend/app/dashboard/influencer/CollaborationsPage.tsx](frontend/app/dashboard/influencer/CollaborationsPage.tsx) (~1000+ lines)

**Purpose:** Complete collaboration workflow for influencers

**Three Main Sections:**

##### 1. PENDING REQUESTS
**Purpose:** Display incoming collaboration requests from brands

**Features:**
- Brief preview with campaign title, brand, pricing, deadline
- Expandable detail panel showing full brief
- T&C checkbox required for acceptance
- Actions: Accept, Counter Offer, Decline

**Data Fetching:**
```typescript
const load = () => {
  influencerAPI.getRequests({ status: 'pending' })
    .then(res => {
      setRequests(res.data.requests || []);
      setError(null);
    })
    .catch(err => {
      setError(err?.response?.data?.message || 'Failed to load');
      if (loading) toast.error(error); // Only on initial load ⚠️
    });
};

// Polling every 30s
useEffect(() => {
  load();
  const intervalId = setInterval(load, 30000);
  return () => clearInterval(intervalId);
}, []);
```

**Accept Workflow:**
```typescript
await influencerAPI.respondToRequest(id, { 
  status: 'accepted'
});
toast.success('✅ Collaboration accepted!');
```

**Counter Offer Workflow:**
```typescript
await influencerAPI.respondToRequest(id, {
  status: 'negotiation',
  counterOfferPrice: Number(counterPrice),
  counterOfferMessage: counterMsg
});
```

**⚠️ ERROR HANDLING ISSUE:**
- Errors only toasted during initial load (`if (loading)` check)
- Polling errors (every 30s) are silent - user doesn't see failures
- **Fixed by:** Always showing error state in UI

---

##### 2. ACTIVE COLLABORATIONS
**Purpose:** Show accepted collaborations awaiting deliverables

**Features:**
- Display campaign details
- Show counter offer negotiation (if applicable)
- Submission form for post URL verification
- Payment status tracking

**Submission Workflow:**
```typescript
await influencerAPI.submitVerification({
  campaignRequestId: collaboration._id,
  postUrl: submittedUrl
});
```

---

##### 3. COMPLETED / HISTORY
**Purpose:** Show past collaborations and payment records

**Features:**
- List of closed deals
- Payment received status
- Performance metrics (if verified)
- Earnings accumulated

---

### 4.3 Real-time Updates Hook

#### useSocket / useCollaborationUpdates
**File:** [frontend/lib/useSocket.ts](frontend/lib/useSocket.ts)

**Purpose:** WebSocket connection for real-time collaboration updates

**Events Listened To:**
```typescript
socket.on('collaboration:received', callback);
socket.on('collaboration:responded', callback);
socket.on('collaboration:updated', callback);
```

**Usage in Components:**
```typescript
useCollaborationUpdates(useCallback((data: any) => {
  console.log('[Collaboration Update]', data);
  setRefreshTrigger(p => p + 1);  // Trigger refetch
}, []));
```

**Configuration:**
- Auto-reconnect with exponential backoff (max 5s delay, 10 attempts)
- Transports: WebSocket (primary), Polling (fallback)
- Auth: JWT token passed in socket options

**Fallback Polling:**
- If WebSocket unavailable: polling continues every 30s
- User won't know if socket disconnected (⚠️ no visual indicator)

---

## 5. DATA FLOW DIAGRAMS

### Brand → Influencer Collaboration Flow

```
BRAND SIDE                          INFLUENCER SIDE
─────────────────────────────────────────────────────
1. Search influencers
   brandAPI.getInfluencers()
                                    
2. View profile
   brandAPI.getInfluencerDetail()
                                    
3. Create request
   brandAPI.createRequest()
   ├─ Creates CampaignRequest
   ├─ Denormalizes brand snapshot
   └─ Creates notification
                                    4. Sees notification
                                       "New collaboration request"
                                    
                                    5. Fetches requests
                                       influencerAPI.getRequests()
                                       └─ ⚠️ AUTO-UPDATES status: 'sent'→'viewed'
                                    
6. Sees "Request Viewed"
   notification
                                    7. Reviews campaign brief
                                       (expandable details)
                                    
                                    8. Responds (one of):
                                       a) Accept
                                          respondToRequest({ status: 'accepted' })
                                       b) Counter offer
                                          respondToRequest({ status: 'negotiation', counterOfferPrice, ... })
                                       c) Decline
                                          respondToRequest({ status: 'rejected' })
                                    
9. Sees notification:
   - "Request Accepted! 🎉"
   - "Counter Offer Received"
   - "Request Declined"
                                    
10. NEGOTIATION LOOP (if counter):
    a) Reviews counter in CampaignDetail panel
    b) Accepts counter
       brandAPI.updateRequest({ status: 'deal_closed', agreedPrice })
       └─ Sends "Deal Confirmed" notification
    OR
    b) Rejects counter / counters back
       brandAPI.updateRequest({ status: 'rejected'|'negotiation', ... })
                                    
11. Deal closed status = 'deal_closed'
                                    12. Sees "In-Process" status
                                    13. Creates post/content per brief
                                    14. Submits post URL for verification
                                        influencerAPI.submitVerification({
                                          campaignRequestId,
                                          postUrl
                                        })
                                    
15. Sees post URL in verification
    section of CampaignDetail
    ├─ Status: pending admin review
    ├─ Post link accessible
                                    16. Waits for admin verification
                                    
17. Admin verifies content
    └─ Status: 'verified' with metrics
                                    18. Gets earnings credited
                                        (if applicable)
```

---

## 6. IDENTIFIED GAPS & MISSING IMPLEMENTATIONS

### 6.1 CRITICAL GAPS

#### 1. **No Verification Model**
- ⚠️ Verification data stored inline in responses (not separate model)
- No database schema for post submissions, admin reviews
- No tracking of performance metrics (views, likes, comments)
- **Impact:** Can't query verification history, no audit trail
- **Recommendation:** Create `Verification` model with separate endpoints

---

#### 2. **No Admin Verification Endpoints**
- API endpoints exist: `GET /admin/verifications`, `PATCH /admin/verifications/:id`
- BUT: No controller implementation found
- No admin workflow for reviewing submitted posts
- **Impact:** Verification system incomplete, can't mark posts as verified
- **Recommendation:** Implement `adminController.js` verification handlers

---

#### 3. **Verification Submission Endpoint Missing**
- Frontend calls: `influencerAPI.submitVerification(data)`
- Backend endpoint NOT found: `POST /influencer/verify`
- Route not defined in [backend/routes/influencer.js](backend/routes/influencer.js)
- **Impact:** Influencers can't submit post URLs for verification
- **Recommendation:** Add endpoint to create verification records

---

#### 4. **No Post URL Validation/Parsing**
- No logic to extract Instagram post metadata
- No verification that URL points to valid Instagram post
- No tracking of post performance metrics (auto-fetch from IG)
- **Impact:** Can't validate deliverables or track performance
- **Recommendation:** Integrate Instagram Graph API to fetch post metrics on submission

---

#### 6.2 MEDIUM PRIORITY GAPS

#### 5. **Auto-Status Update Side Effect**
**Location:** [backend/controllers/campaignRequestController.js#L179-180](backend/controllers/campaignRequestController.js#L179-180)

**Issue:** `getInfluencerRequests()` auto-changes status 'sent'→'viewed' on read

```javascript
// Problem: GET request modifies data
const unviewedIds = requests.filter(r => r.status === 'sent').map(r => r._id);
if (unviewedIds.length > 0) {
  await CampaignRequest.updateMany(
    { _id: { $in: unviewedIds } },
    { $set: { status: 'viewed', viewedAt: new Date() } }
  );
}
```

**Recommendation:** 
- Option A: Make explicit: `GET /api/influencer/requests?markAsViewed=true`
- Option B: Separate endpoint: `PATCH /api/influencer/requests/mark-viewed`
- Option C: Remove side effect (track views separately)

---

#### 6. **No Real-time Brand Notifications**
- ✅ Socket.IO infrastructure exists
- ✅ `useCollaborationUpdates()` hook available
- ❌ Backend NOT emitting socket events for:
  - New request creation
  - Influencer responses
  - Counter offers
  - Deal closures
- **Impact:** Brands see updates only via polling (30s delay)
- **Recommendation:** Add socket.emit() calls in `brandRespondToRequest()` and `respondToRequest()`

---

#### 7. **Polling Still Active Despite Socket**
- Both polling AND Socket.IO running simultaneously
- Polling interval: 30s
- Socket events don't prevent polling
- **Impact:** Redundant data fetches, higher server load
- **Recommendation:** 
  - Disable polling when socket connects
  - Re-enable polling only if socket disconnects
  - Show connection status to user

---

#### 8. **No Campaign Expiration Logic**
- Requests can stay 'sent' indefinitely
- No automatic expiry after X days
- No "Request Expired" workflow
- **Impact:** Stale requests clutter influencer feeds
- **Recommendation:**
  - Add expiration date field
  - Background job to mark expired requests
  - Notify both parties on expiration

---

#### 6.3 LOW PRIORITY GAPS

#### 9. **Image Display Inconsistencies**
**DP Field Priority Issues (PARTIALLY FIXED):**

| Component | Current | Status |
|-----------|---------|--------|
| InfluencerProfileModal.tsx | `profilePictureUrl` ✓ | ✅ FIXED |
| InfluencerSearch.tsx | Only checks `profileImageURL` | ⚠️ Inconsistent |
| CampaignsPage.tsx | N/A | ✅ FIXED |

**Recommendation:** Standardize on `profilePictureURL` (from backend) everywhere

---

#### 10. **No Earnings Tracking**
- No "Earnings" model for tracking payments
- No cashout system for influencers
- No payment status tracking
- **Impact:** Can't show influencers their earnings
- **Recommendation:** Implement earnings + cashout workflow

---

#### 11. **Limited Campaign Type Support**
- Types exist: 'sponsored_post', 'ugc', 'affiliate', 'review', 'story', 'reel'
- No differentiated workflows per type
- No type-specific validation or requirements
- **Impact:** All campaign types treated identically
- **Recommendation:** Add type-specific briefing templates and checklists

---

#### 12. **No Content Guidelines Validation**
- Guidelines stored as free text
- No checklist or structured requirements
- No way to track if influencer adheres to guidelines
- **Impact:** Hard to verify deliverables match requirements
- **Recommendation:** Structured guidelines with checkboxes/validation

---

#### 13. **No Multi-platform Support**
- All collaboration tied to Instagram
- No TikTok, YouTube, or other platform support
- InfluencerProfile treats Instagram as primary only
- **Impact:** Limited to Instagram creators
- **Recommendation:** Add platform-agnostic collaboration model

---

#### 14. **Incomplete Influencer Matching**
- Basic filtering by niche, followers, engagement, cost
- No engagement quality analysis
- No audience demographic matching
- No performance history matching
- **Impact:** Brands can't find best-fit influencers systematically
- **Recommendation:** Enhance `computeDynamicFitScore()` with more signals

---

## 7. ERROR HANDLING & VALIDATION

### 7.1 Backend Error Handling

**Status:** ✅ Good coverage in controllers

- 12 try-catch blocks in campaignRequestController.js
- Global error handler in middleware/errorHandler.js
- All endpoints wrapped

**Issues:**
1. **OAuth Error Messages Too Vague** ([backend/controllers/instagramController.js#L45-51](backend/controllers/instagramController.js#L45-51))
   - Uses generic codes: 'auth_denied', 'missing_code', 'invalid_state'
   - No error persistence
   - Makes debugging difficult

2. **Missing DB Connection Errors** ([backend/middleware/errorHandler.js#L1-26](backend/middleware/errorHandler.js#L1-26))
   - No handler for ECONNREFUSED, ENOTFOUND
   - Generic 500 response

3. **Missing 404 Response** ([backend/controllers/instagramController.js#L237](backend/controllers/instagramController.js#L237))
   - Returns 200 with null when profile not found
   - Should return 404

### 7.2 Frontend Error Handling

**Status:** ⚠️ Inconsistent

✅ Good:
- `CreateRequestModal`: Clear error messages on submit failure
- API interceptor: Redirects to /login on 401

❌ Issues:
- `CollaborationsPage`: Errors only shown on initial load (not during polling)
- Silent failures during 30s polling intervals
- No distinction between "no data" vs "error loading"
- User can't tell if data is stale

**Recommendation:** Show persistent error state in UI for all polling failures

---

## 8. API ENDPOINT REFERENCE TABLE

| Method | Endpoint | Auth | Purpose | Status |
|--------|----------|------|---------|--------|
| POST | `/brand/requests` | Brand | Create campaign request | ✅ Working |
| GET | `/brand/requests` | Brand | List brand's requests | ✅ Working |
| GET | `/brand/requests/:id` | Brand | Get request detail | ✅ Working |
| PATCH | `/brand/requests/:id` | Brand | Brand responds to counter | ✅ Working |
| GET | `/brand/influencers` | Brand | Search influencers | ✅ Working |
| GET | `/brand/influencers/:id/details` | Brand | Get influencer detail | ✅ Working |
| GET | `/brand/verifications` | Brand | Get verification status | ✅ Working |
| GET | `/influencer/requests` | Influencer | Get incoming requests | ✅ Working |
| PATCH | `/influencer/requests/:id` | Influencer | Respond to request | ✅ Working |
| POST | `/influencer/verify` | Influencer | Submit post for verification | ❌ **Missing** |
| GET | `/influencer/verifications` | Influencer | Get verification history | ❌ **Missing** |
| GET | `/admin/verifications` | Admin | Get verification queue | ❌ **Missing** |
| PATCH | `/admin/verifications/:id` | Admin | Review verification | ❌ **Missing** |

---

## 9. KEY FUNCTIONS & DATA STRUCTURES

### Frontend State Management

```typescript
// CampaignsPage (Brand)
type Filter = 'all' | 'pending' | 'negotiation' | 'accepted' | 'rejected';
const [requests, setRequests] = useState<any[]>([]);
const [verifications, setVerifications] = useState<any[]>([]);
const [filter, setFilter] = useState<Filter>('all');
const [expanded, setExpanded] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

// CollaborationsPage (Influencer)
const [requests, setRequests] = useState<any[]>([]);
const [error, setError] = useState<string | null>(null);
const [acting, setActing] = useState<string | null>(null);
const [expanded, setExpanded] = useState<string | null>(null);
const [counterOpen, setCounterOpen] = useState<string | null>(null);
const [counterPrice, setCounterPrice] = useState('');
const [counterMsg, setCounterMsg] = useState('');
const [agreedTerms, setAgreedTerms] = useState<Record<string, boolean>>({});
```

### Socket.IO Integration Points

```typescript
// Components using real-time updates:
1. CampaignsPage (brand)
   - useCollaborationUpdates(callback) 
   - Listens to influencer response events
   
2. CollaborationsPage (influencer)
   - useCollaborationUpdates(callback)
   - Listens to brand response events

3. Socket events emitted (TODO):
   - collaboration:created    → new request sent
   - collaboration:responded  → response from influencer/brand
   - collaboration:updated    → status change
   - collaboration:negotiation → counter offer
```

---

## 10. RECOMMENDATIONS FOR COMPLETION

### Immediate (Critical Path)

1. **Implement Verification Model & Endpoints** (High Priority)
   - Create `Verification` schema
   - Add POST `/influencer/verify` endpoint
   - Add GET `/influencer/verifications` endpoint
   - Add admin verification endpoints

2. **Emit Socket Events for Real-time Updates** (High Priority)
   - Add socket.emit() in respondToRequest()
   - Add socket.emit() in brandRespondToRequest()
   - Add socket.emit() in createRequest()

3. **Fix Polling Error Handling** (Medium Priority)
   - Show error state in UI for polling failures
   - Distinguish between "no data" and "error"
   - Add error indicator badge

4. **Remove Auto-Status Update Side Effect** (Medium Priority)
   - Make `markAsViewed` explicit parameter or separate endpoint

### Enhancements

5. **Add Campaign Expiration Logic**
   - Auto-expire requests after X days
   - Notify both parties

6. **Earnings & Payment Tracking**
   - Implement earnings model
   - Add cashout workflow
   - Track payment status

7. **Verification Auto-Fetch from Instagram**
   - Parse submitted URLs
   - Auto-fetch post metrics
   - Store performance data

8. **Multi-Platform Support**
   - Add TikTok, YouTube support
   - Platform-agnostic models

---

## SUMMARY TABLE

| Category | Component | Status | Files |
|----------|-----------|--------|-------|
| **Models** | CampaignRequest | ✅ Complete | models/CampaignRequest.js |
| | InfluencerProfile | ✅ Complete | models/InfluencerProfile.js |
| | BrandProfile | ✅ Complete | models/BrandProfile.js |
| | Verification | ❌ Missing | — |
| **Backend APIs** | Campaign Creation | ✅ Complete | controllers/campaignRequestController.js |
| | Request Management | ✅ Complete | controllers/campaignRequestController.js |
| | Verification | ❌ Incomplete | — |
| **Frontend Pages** | Brand Collaborations | ✅ Complete | app/dashboard/brand/collaborations/ |
| | Influencer Collaborations | ✅ Complete | app/dashboard/influencer/ |
| **Real-time** | Socket.IO Setup | ✅ Complete | lib/useSocket.ts |
| | Event Emission | ❌ Not Implemented | — |
| **Error Handling** | Backend | ✅ Good | middleware/errorHandler.js |
| | Frontend | ⚠️ Partial | (CollaborationsPage.tsx) |

---

Generated: April 22, 2026  
Updated by: Collaboration System Audit  
Version: 1.0
