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
npm run seed           # Creates demo accounts
npm run dev            # Starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev            # Starts on http://localhost:3000
```

## Demo Accounts
| Role | Email | Password |
|---|---|---|
| 👑 Admin | `admin@porchest.com` | `Admin123!` |
| 🏢 Brand | `brand@demo.com` | `Brand123!` |
| ⭐ Influencer | `influencer@demo.com` | `Influencer123!` |

Use the **Demo Login** buttons on `/login` to log in instantly.

## Environment Variables
**.env** (backend):
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**.env.local** (frontend):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Deployment
- **Frontend**: Vercel (`vercel deploy`)
- **Backend**: Render or Railway

## Features
- ✅ 3 role portals: Admin, Brand, Influencer
- ✅ JWT auth + bcrypt passwords
- ✅ AI influencer matching (score: engagement 40%, niche 40%, reach 20%)
- ✅ Real-time messaging (Socket.io)
- ✅ Campaign management
- ✅ Earnings tracking
- ✅ Glassmorphism dark UI with neon purple accent
- ✅ Responsive design + smooth animations
