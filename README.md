# 🛍️ Kvastram Platform - E-Commerce System

> **Complete D2C (Direct-to-Consumer) E-commerce Platform**  
> Backend API + Admin Dashboard + Customer Storefront

---

## 🚀 Quick Start

### For Developers (First Time)
1. Read [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) - Complete project overview
2. Read [`backend/SETUP_GUIDE.md`](./backend/SETUP_GUIDE.md) - Setup instructions
3. Configure `.env` files
4. Start servers (see below)

### For Antigravity AI (New Conversation)
1. **ALWAYS READ FIRST:** [`PHASE_3_CURRENT_TASK.md`](./PHASE_3_CURRENT_TASK.md) - Current task details
2. **THEN READ:** [`MASTER_PROGRESS.md`](./MASTER_PROGRESS.md) - Overall progress
3. **THEN READ:** [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - Quick reference
4. Check: [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) - Complete history

---

## 📦 Project Structure

```
kvastram-platform/
├── backend/          # API Server (Node.js + Hono + PostgreSQL)
├── admin/            # Admin Dashboard (Next.js 16)
├── storefront/       # Customer Store (Next.js 16)
├── PROJECT_CONTEXT.md       # 📚 Complete project history & state
├── QUICK_REFERENCE.md       # ⚡ Quick start for AI
└── README.md               # 👈 You are here
```

---

## 🎯 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Hono (Fast web framework)
- **Database:** PostgreSQL (Supabase Cloud)
- **ORM:** Drizzle ORM
- **Auth:** JWT + bcrypt

### Frontend (Admin + Storefront)
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** CSS

---

## 🚀 Running the Project

### Start All Servers

```powershell
# Terminal 1 - Backend (Port 4000)
cd backend
npm run dev

# Terminal 2 - Admin Panel (Port 3001)
cd admin
npm run dev -- -p 3001

# Terminal 3 - Storefront (Port 3002)
cd storefront
npm run dev -- -p 3002
```

### Access URLs
- **Backend API:** http://localhost:4000
- **Admin Panel:** http://localhost:3001
- **Storefront:** http://localhost:3002

---

## 📚 Documentation

### Essential Reading (Priority Order)
1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick start for AI assistants ⚡
2. **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Complete project state & history 📚
3. **[backend/CURRENT_STATUS_AND_FIX.md](./backend/CURRENT_STATUS_AND_FIX.md)** - Latest changes 🔧
4. **[backend/SETUP_GUIDE.md](./backend/SETUP_GUIDE.md)** - Initial setup 🛠️
5. **[docs/HOSTINGER_VPS_DEPLOY.md](./docs/HOSTINGER_VPS_DEPLOY.md)** - Production VPS deployment guide

### Additional Guides
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database setup
- **[FEATURE_PLAN.md](./FEATURE_PLAN.md)** - Feature roadmap
- **[QUICK_START.md](./QUICK_START.md)** - Admin features guide

---

## ✅ Current Status (2026-04-12)

| Component | Status | Port |
|-----------|--------|------|
| Backend API | ✅ Build passing | 4000 |
| Admin Panel | ✅ Build passing | 3001 |
| Storefront | ✅ Build passing | 3000 |
| Database | ✅ Supported | PostgreSQL / Supabase |

**Deployment target:** Hostinger VPS via Docker Compose + Nginx.

---

## 🔧 Recent Fixes (2026-02-05)

### Fixed Issues:
1. ✅ Module import error (`Cannot find module '../db'`)
2. ✅ Database connection timeout (Supabase configuration)

### Changes Made:
1. Created `backend/src/db/index.ts` (barrel export)
2. Updated `backend/src/db/client.ts` (Supabase-optimized settings)

**Details:** See [CURRENT_STATUS_AND_FIX.md](./backend/CURRENT_STATUS_AND_FIX.md)

---

## 🎓 Features

### Admin Panel
- ✅ Dashboard with analytics
- ✅ Product management (CRUD)
- ✅ Order management
- ✅ Customer management
- ✅ Inventory tracking
- ✅ Bulk operations
- ✅ Search & filters

### Storefront
- ✅ Product catalog
- ✅ Shopping cart
- ✅ Checkout flow
- ✅ User authentication
- ✅ Order tracking

### Backend API
- ✅ RESTful endpoints
- ✅ JWT authentication
- ✅ Role-based access
- ✅ Data validation
- ✅ Error handling

---

## 🔐 Environment Setup

### Backend `.env`
```env
DATABASE_URL=postgresql://[your-supabase-url]
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

**Note:** Never commit `.env` files!

---

## 🛠️ Development Commands

### Backend
```powershell
npm run dev          # Start dev server
npm run build        # Build for production
npm run generate     # Generate DB migrations
npm run migrate      # Run DB migrations
```

### Admin / Storefront
```powershell
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
```

---

## 🚨 Troubleshooting

### Server won't start
1. Check if ports are available
2. Run `npm install` in each folder
3. Verify `.env` configuration

### Database errors
1. Check Supabase project is active
2. Verify `DATABASE_URL` in `.env`
3. Check internet connection

**More help:** See [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) → Troubleshooting section

---

## 📞 Support

For issues or questions:
1. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) first
2. Review [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
3. Check [CURRENT_STATUS_AND_FIX.md](./backend/CURRENT_STATUS_AND_FIX.md)

---

## 📝 Contributing

When making changes:
1. Read documentation first
2. Test thoroughly
3. Update `PROJECT_CONTEXT.md`
4. Document changes in `CURRENT_STATUS_AND_FIX.md`

---

## 📄 License

Private project - All rights reserved

---

**Last Updated:** 2026-04-12  
**Status:** VPS deployment ready, final production rollout requires real env vars and secret rotation  
**Version:** 1.0.0
