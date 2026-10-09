# Evelina's Flowershop - Deployment Guide

## Overview
This is a full-stack flower shop application with:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript + MongoDB (Mongoose)
- **Authentication**: JWT with HttpOnly cookies
- **Database**: MongoDB

---

## Quick Deploy to Render (Free Tier)

### Prerequisites
1. GitHub account
2. Render account (free at render.com)
3. MongoDB Atlas account (free at mongodb.com/atlas)

---

## Step 1: Set up MongoDB Atlas (Free)

### 1.1 Create MongoDB Atlas Account
1. Go to mongodb.com/atlas
2. Sign up for a free account
3. Create a new project (e.g., "evelinas-flowershop")

### 1.2 Create Free Cluster
1. Click "Build a Database"
2. Choose **M0 Free** tier (Shared)
3. Select **AWS** -> **N. Virginia (us-east-1)** (closest to Render's Oregon region)
4. Cluster name: `evelinas-flowershop`
5. Click "Create Cluster" (takes 1-3 minutes)

### 1.3 Configure Database Access
1. In left sidebar: **Database Access** -> **Add New Database User**
2. Username: `flowershop_user` (or your choice)
3. Password: **Generate a secure password** (save this!)
4. Database User Privileges: **Read and write to any database**
5. Click **Add User**

### 1.4 Configure Network Access
1. In left sidebar: **Network Access** -> **Add IP Address**
2. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Required for Render's dynamic IPs
3. Click **Confirm**

### 1.5 Get Connection String
1. In left sidebar: **Database** -> **Connect** -> **Drivers**
2. Driver: **Node.js**, Version: **4.1 or later**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `evelinas-flowershop`

**Example:**
```
mongodb+srv://flowershop_user:YourPassword123@evelinas-flowershop.xxxxx.mongodb.net/evelinas-flowershop?retryWrites=true&w=majority
```

---

## Step 2: Prepare Repository

### 2.1 Initialize Git (if not already)
```bash
git init
git add .
git commit -m "Initial commit: Evelina's Flowershop"
```

### 2.2 Push to GitHub
1. Create new repo on GitHub (e.g., `evelinas-flowershop`)
2. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/evelinas-flowershop.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Render

### 3.1 Connect Repository
1. Go to dashboard.render.com
2. Click **"New +"** -> **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and show two services:
   - `evelinas-flowershop-api` (Node.js Web Service)
   - `evelinas-flowershop` (Static Site)

### 3.2 Configure Environment Variables

#### For API Service (`evelinas-flowershop-api`):
Click on the API service -> **Environment** -> Add these:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1.5 |
| `JWT_SECRET` | (Click "Generate" for a secure random value) |
| `FRONTEND_URL` | `https://evelinas-flowershop.onrender.com` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render sets this automatically) |

#### For Frontend Service (`evelinas-flowershop`):
| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://evelinas-flowershop-api.onrender.com/api` |

### 3.3 Deploy
1. Click **"Apply"** to create both services
2. Wait for builds to complete (5-10 minutes)
3. API will be at: `https://evelinas-flowershop-api.onrender.com`
4. Frontend will be at: `https://evelinas-flowershop.onrender.com`

---

## Step 4: Seed Database (One-time)

After API is deployed, seed the products:

### Option A: Via Render Shell (Recommended)
1. Go to API service -> **Shell**
2. Run:
```bash
npm run db:seed
```

### Option B: Locally (with production DB)
```bash
# Create .env with production MONGODB_URI
MONGODB_URI=your-atlas-connection-string
npm run db:seed
```

---

## Step 5: Create Admin User

1. Visit your frontend: `https://evelinas-flowershop.onrender.com`
2. Register a new account
3. In MongoDB Atlas -> **Database** -> **Browse Collections** -> `users`
4. Find your user and change `role` from `"customer"` to `"admin"`
5. Refresh frontend - you'll now see Admin Dashboard

---

## Local Development

### Install Dependencies
```bash
npm install
```

### Set up Environment
```bash
cp .env.example .env
# Edit .env with your local MongoDB URI
```

### Run Locally
```bash
# Terminal 1: Frontend (port 5173)
npm run dev

# Terminal 2: Backend (port 3001)
npm run server:dev
```

### Seed Local Database
```bash
npm run db:seed
```

---

## Project Structure

```
project/
├── src/                    # Frontend React app
│   ├── app/
│   │   ├── api/client.ts   # API client (connects to VITE_API_URL)
│   │   ├── contexts/       # React contexts (Auth, Cart, Orders, etc.)
│   │   ├── pages/          # Page components
│   │   └── components/     # UI components
│   └── main.tsx
├── server/                 # Backend Express API
│   ├── index.ts            # Entry point
│   ├── seed.ts             # Database seeding script
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── middleware/         # Auth middleware
├── dist/                   # Built output (generated)
├── render.yaml             # Render deployment config
├── .env.example            # Environment template
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/products` | List products |
| POST | `/api/products/seed` | Seed products (dev) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders |
| POST | `/api/reviews` | Create review |
| GET | `/api/gallery/approved` | Get approved gallery photos |
| ... | ... | More endpoints available |

---

## Troubleshooting

### "MongoDB connection failed"
- Check MONGODB_URI is correct in Render env vars
- Verify Network Access allows 0.0.0.0/0 in Atlas
- Check Database User has correct password

### "CORS error"
- Ensure FRONTEND_URL in API env vars matches your frontend URL exactly
- Check both services are on HTTPS in production

### "Build failed"
- Check Node version compatibility (use Node 20+)
- Ensure all dependencies are in package.json
- Check Render build logs for specific errors

### "API calls fail in browser"
- Open browser DevTools -> Network tab
- Check if requests go to correct API URL
- Verify VITE_API_URL is set in frontend env vars

---

## Cost Breakdown (Free Tier)

| Service | Cost |
|---------|------|
| Render API (Web Service) | Free (spins down after 15 min inactivity) |
| Render Frontend (Static Site) | Free |
| MongoDB Atlas M0 Cluster | Free (512 MB storage) |
| **Total** | **$0/month** |

---

## Next Steps

- [ ] Set up custom domain on Render
- [ ] Enable MongoDB Atlas backups
- [ ] Add email service (SendGrid, Resend) for order confirmations
- [ ] Add payment integration (Stripe)
- [ ] Set up monitoring/alerts
- [ ] Add rate limiting to API

---

## Support

For issues:
1. Check Render logs (Dashboard -> Service -> Logs)
2. Check MongoDB Atlas logs (Atlas -> Monitoring)
3. Verify environment variables are set correctly