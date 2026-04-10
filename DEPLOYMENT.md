# 🚀 Storytime App - Complete Deployment Guide

## Overview

This application supports multiple deployment scenarios:
- **Render.io**: Full-stack deployment (Frontend + Backend)
- **Cloudflare Pages + Render API**: Frontend on Cloudflare CDN, Backend on Render
- **Local Development**: Both on localhost

---

## Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- npm or yarn
- Git repository pushed to GitHub
- API Keys:
  - **GROQ_API_KEY** (for story generation) - [Get from Groq Console](https://console.groq.com)
  - **MongoDB URI** (optional, for persistence) - [Create at MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - **Optional**: OpenAI, Anthropic, ElevenLabs API keys

---

## 🏠 Option 1: Render.io Full-Stack Deployment (Recommended for Start)

### Step 1: Connect GitHub Repository

1. Go to [https://render.com/](https://render.com/)
2. Click **"New +"** → **"Web Service"**
3. Select **"Connect a GitHub repository"**
4. Authorize GitHub and select `Mrvikas06/storytime-app`
5. Select branch: **`main`**

### Step 2: Configure Service

Fill in the following details:

| Field | Value |
|-------|-------|
| **Name** | `storytime-app` |
| **Environment** | `Node` |
| **Build Command** | `cd backend && npm install && npm cache clean --force && cd ../frontend && npm install && npm run build && cd ..` |
| **Start Command** | `node scripts/start-server.js` |
| **Instance Type** | Free (testing) or Starter Plus (production) |

### Step 3: Set Environment Variables

In Render dashboard, add these environment variables:

```
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/storytime
NODE_ENV=production
PORT=10000
```

**How to get these values:**
- **GROQ_API_KEY**: Visit [Groq Console](https://console.groq.com/keys) → Create API Key
- **MONGODB_URI**: 
  1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Create a free cluster
  3. Get connection string from "Connect" → "Connect your application"

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Your app will be available at: `https://storytime-app.onrender.com`
4. First deployment takes 3-5 minutes

### Step 5: Verify Deployment

```bash
# Check health
curl https://storytime-app.onrender.com/api/health

# Should return:
# {"status":"ok","message":"Server is running","timestamp":"...","environment":"production"}
```

**Initial Load**: The first request may take 30-60 seconds due to cold start on free tier.

---

## 🌐 Option 2: Cloudflare Pages + Render API (Best for Performance)

This setup provides:
- **Frontend**: Cloudflare Pages (fast global CDN)
- **Backend API**: Render.io (Python TTS support)

### Step 1: Deploy Backend to Render.io

Follow **Option 1** above, but skip the frontend build in start command.

For Render.io backend-only, update `render.yaml`:

```yaml
startCommand: node backend/server.js
```

Backend will be at: `https://storytime-app-api.onrender.com`

### Step 2: Deploy Frontend to Cloudflare Pages

1. Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Select **"Pages"** → **"Create a project"**
3. Click **"Connect to Git"**
4. Authorize GitHub and select `Mrvikas06/storytime-app`
5. Configure build settings:

| Field | Value |
|-------|-------|
| **Framework preset** | Vite |
| **Build command** | `cd frontend && npm install && npm run build` |
| **Build output directory** | `frontend/dist` |

6. Click **"Save and Deploy"**

Frontend will be at: `https://storytime-app.pages.dev`

### Step 3: Configure API URL

The frontend automatically detects the API URL:
- On Cloudflare Pages → Uses `https://storytime-app-api.onrender.com/api`
- On localhost → Uses `http://localhost:4000/api`

No additional configuration needed!

---

## 💻 Local Development

### Setup

```bash
# Install dependencies
cd backend
npm install
cd ../frontend
npm install
cd ..
```

### Configure Environment

1. Copy `.env.example` to `.env` in the backend folder:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and add your API keys:
   ```
   GROQ_API_KEY=your_key_here
   MONGODB_URI=mongodb://localhost:27017/storytime
   NODE_ENV=development
   PORT=4000
   ```

### Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173 (or next available port)
```

Frontend will proxy API calls to `http://localhost:4000/api` automatically.

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] API keys added to environment variables
- [ ] MongoDB URI configured (or accept demo mode without persistence)
- [ ] GitHub repository is up to date
- [ ] All sensitive data in `.env` files
- [ ] `.env` files added to `.gitignore`
- [ ] Frontend builds successfully: `npm run build` in `frontend/`
- [ ] Backend starts successfully: `npm start` in `backend/`
- [ ] Health check works: `curl /api/health`

---

## 🔧 Troubleshooting

### "Frontend build not found"

**Problem**: Application shows "Frontend not built" error

**Solution**:
```bash
# Manually build frontend
cd frontend
npm install
npm run build
cd ..
```

### "Cannot connect to MongoDB"

**Problem**: Application runs but stories can't be saved

**Solution**: 
- App runs in demo mode (no persistence)
- Get MongoDB connection string from MongoDB Atlas
- Add `MONGODB_URI` to environment variables

### "API returns 404 for /api/health"

**Problem**: Backend routes not loading

**Solution**:
```bash
# Verify routes are installed
cd backend
npm install

# Check for errors
npm start
```

### "TTS audio generation fails"

**Problem**: Story generates but audio doesn't play

**Solution**:
- Ensure Python and edge-tts are installed (for local dev)
- On Cloudflare Workers: TTS limited due to environment constraints
- Use Render backend instead of Cloudflare Workers for TTS

---

## 📊 Performance Tips

### For Render.io

- **Upgrade instance** for better performance beyond free tier
- **Use MongoDB Atlas free tier** for persistence
- Keep `frontend/dist` size small (check with `npm run build`)

### For Cloudflare Pages

- Frontend already optimized with global CDN
- Enable caching headers in `vite.config.js`
- Use Render for backend (includes Python TTS support)

---

## 🔐 Security Best Practices

1. **Never commit .env files**
   - Already in `.gitignore`
   - Add locally only

2. **Rotate API keys regularly**
   - Monitor usage in provider dashboards
   - Update environment variables immediately

3. **Use HTTPS only**
   - Render and Cloudflare provide free SSL
   - Never send credentials over HTTP

4. **Validate all inputs**
   - Backend validates story words
   - API limits request sizes

---

## 📞 Support

### Common Resources

- **Render.io Docs**: https://render.com/docs
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Groq API Docs**: https://console.groq.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/

### Getting Help

1. Check application logs:
   - Render: Dashboard → "Logs"
   - Cloudflare: Dashboard → "Analytics"

2. Test locally first before deploying changes

3. Use health check endpoint to verify setup: `/api/health`

---

## 🎉 Next Steps After Deployment

1. **Test the application**
   - Create a story with test words
   - Verify audio generation

2. **Monitor performance**
   - Check response times
   - Monitor error logs

3. **Set up custom domain** (optional)
   - Render/Cloudflare allow custom domains
   - Both include free SSL

4. **Enable auto-deploy from GitHub**
   - Changes to `main` branch auto-deploy
   - Already configured in both services

---

**Happy Deploying! 🎊**
