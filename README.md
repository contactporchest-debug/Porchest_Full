# Porchest 🚀
**AI-Powered Multi-Portal Influencer & Brand Management Platform**

A futuristic SaaS platform connecting brands with influencers via AI matching, real-time chat, and role-based dashboards.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TailwindCSS, Framer Motion |
| Backend | Express.js, MongoDB Atlas, JWT, Socket.io |
| Auth | JWT + bcrypt |
| AI | Mock scoring engine (engagement, niche, followers) |

## Getting Started

### 1. Backend
```bash
cd backend
cp .env.example .env   # Fill in your MongoDB Atlas URI
npm install
npm run create-admin   # Ensures the default owner login exists
npm run dev            # Starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev            # Starts on http://localhost:3000
```

## Default Owner Login
| Role | Email | Password |
|---|---|---|
| 👑 Owner | `admin@porchest.com` | `Porchest_Admin` |

## Environment Variables
**.env** (backend):
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
PORT=5000
FRONTEND_URL=https://www.porchest.com
PORCHEST_PUBLIC_SITE_URL=https://www.porchest.com
PORCHEST_PUBLIC_API_URL=https://api.porchest.com
SHOPIFY_APP_URL=https://api.porchest.com
```

**.env.local** (frontend):
```
NEXT_PUBLIC_API_URL=https://api.porchest.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.porchest.com
NEXT_PUBLIC_APP_URL=https://www.porchest.com
```

## Deployment
- **Frontend**: Vercel project for `www.porchest.com`
- **Backend**: Vercel project for `api.porchest.com`
- **Note**: Socket.IO requires a long-running backend host. If the backend is deployed as Vercel serverless, live socket updates will need a different runtime or a separate realtime service.

## Features
- ✅ 3 role portals: Admin, Brand, Influencer
- ✅ JWT auth + bcrypt passwords
- ✅ AI influencer matching (score: engagement 40%, niche 40%, reach 20%)
- ✅ Real-time messaging (Socket.io)
- ✅ Campaign management
- ✅ Earnings tracking
- ✅ Glassmorphism dark UI with neon purple accent
- ✅ Responsive design + smooth animations

## Project Structure
```text
.
├── api/            # Vercel serverless entry for the backend
├── backend/        # Express app, models, controllers, routes, services, scripts
├── frontend/       # Next.js app, components, context, and static assets
├── vercel.json     # Deployment routing for frontend + API
└── README.md
```

## Cleaned Up
- Removed the legacy duplicate `Landing Page/` app copy
- Removed build artifacts like `frontend/.next/` and `node_modules/`
- Removed the debug file `backend/test-gemini.js` that contained a hardcoded API key
