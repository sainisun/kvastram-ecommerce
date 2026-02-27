# Deployment Guide - Kvastram Platform

## Prerequisites
- GitHub account with your code pushed
- Railway account (free)
- Vercel account (free)

---

## Step 1: Supabase Database (Already Set Up ✅)

Your database is already configured at Supabase. Keep the connection string handy.

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your kvastram-platform repository
6. Select the `backend` folder

### 2.2 Configure Environment Variables
In Railway dashboard, go to Variables tab and add:

```
DATABASE_URL=postgresql://postgres.qsnradlhidpbeopahztr:WUaXy0ENSM59wCiS@aws-1-us-east-1.pooler.supabase.com:6543/postgres
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-storefront.vercel.app
ALLOWED_ORIGINS=https://your-storefront.vercel.app,https://your-admin.vercel.app
JWT_SECRET=generate_a_64_character_random_string
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
```

### 2.3 Deploy
- Click "Deploy"
- Wait for build to complete
- Note your backend URL: `https://your-backend.railway.app`

---

## Step 3: Deploy Storefront to Vercel

### 3.1 Create Vercel Project
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your kvastram-platform repository
5. Select the `storefront` folder
6. Framework Preset: Next.js

### 3.2 Configure Environment Variables
Add these in Vercel:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_FACEBOOK_APP_ID=xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
NEXT_PUBLIC_TAWK_PROPERTY_ID=69916132e258621c36ed87d2/1jhfu7bu0
```

### 3.3 Deploy
- Click "Deploy"
- Note your storefront URL: `https://kvastram-storefront.vercel.app`

---

## Step 4: Deploy Admin to Vercel

### 4.1 Create Vercel Project
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your kvastram-platform repository
4. Select the `admin` folder
5. Framework Preset: Next.js

### 4.2 Configure Environment Variables
Add:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### 4.3 Deploy
- Click "Deploy"
- Note your admin URL: `https://kvastram-admin.vercel.app`

---

## Step 5: Update Backend CORS

After deploying storefront and admin:

1. Go to Railway dashboard
2. Update `ALLOWED_ORIGINS` variable:
```
ALLOWED_ORIGINS=https://kvastram-storefront.vercel.app,https://kvastram-admin.vercel.app
```
3. Redeploy backend

---

## Step 6: Test

| Test | URL |
|------|-----|
| Storefront | https://kvastram-storefront.vercel.app |
| Admin | https://kvastram-admin.vercel.app |
| API Health | https://your-backend.railway.app/health |

---

## Troubleshooting

### Email Not Working?
- Sign up for free Mailtrap account
- Update SMTP credentials in Railway

### Database Connection Error?
- Ensure Supabase pooler is enabled
- Check DATABASE_URL is correct

### CORS Errors?
- Update ALLOWED_ORIGINS in Railway
- Redeploy backend

---

## Cost Estimate

| Service | Free Limit | Cost |
|---------|------------|------|
| Supabase DB | 500MB | $0 |
| Railway | 500hrs/month | $0 |
| Vercel | 100GB bandwidth | $0 |
| Mailtrap | Free testing | $0 |

**Total: $0/month** ✅
