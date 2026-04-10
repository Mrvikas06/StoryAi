# Cloudflare Pages + Render.io Backend Deployment

## Architecture
- **Frontend**: React app hosted on Cloudflare Pages (fast CDN)
- **Backend API**: Node.js + Python TTS on Render.io (full compatibility)
- **Database**: MongoDB Atlas (free tier)

## Cloudflare Pages Setup

### 1. Connect GitHub Repository
1. Go to https://dash.cloudflare.com/
2. Select "Pages" → "Create a project"
3. Select "Connect to Git"
4. Authorize GitHub and select `Mrvikas06/storytime-app`
5. Choose branch: `main`

### 2. Build Settings
- **Framework preset**: Vite
- **Build command**: `cd frontend && npm install && npm run build`
- **Build output directory**: `frontend/dist`

### 3. Environment Variables
No secrets needed for frontend (kept private in .env)

### 4. Deploy
- Click "Save and Deploy"
- Your app will be live at: `https://storytime-app.pages.dev`

---

## Render.io Backend Setup

### 1. Create Web Service
1. Go to https://render.com/
2. Click "New +" → "Web Service"
3. Connect GitHub repository: `storytime-app`
4. Choose branch: `main`

### 2. Configure Service
- **Name**: `storytime-app-api`
- **Environment**: `Node`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `node server.js`
- **Instance Type**: Free tier (for testing) or paid

### 3. Environment Variables
Add these in Render dashboard:
```
GROQ_API_KEY=<your-groq-api-key>
MONGODB_URI=<your-mongodb-connection-string>
PORT=4000
NODE_ENV=production
```

### 4. Deploy
- Click "Create Web Service"
- Backend will be live at: `https://storytime-app-api.onrender.com`

---

## Connect Frontend to Backend

The frontend will automatically detect the backend URL:
- **Local dev**: `http://localhost:4000`
- **Production**: `https://storytime-app-api.onrender.com`

No changes needed! The API detection is already built in.

---

## Deployment Timeline

1. **Render.io**: Deploy backend first (~3-5 minutes)
2. **Cloudflare Pages**: Deploy frontend (~1-2 minutes)
3. **Test**: Visit `https://storytime-app.pages.dev` and create a story

---

## Benefits of Hybrid Approach

✅ **Frontend (Cloudflare Pages)**
- Free tier available
- Global CDN for fast loads
- Automatic deployments from GitHub
- SSL included

✅ **Backend (Render.io)**
- Python TTS fully supported
- Traditional Express.js (no rewrites)
- File system access
- Long-running processes OK
- Easy environment configuration

✅ **Overall**
- Best performance for both
- Scalable independently
- Full feature support
- Simple to maintain

---

## Troubleshooting

### Backend not connecting
1. Check Render backend is running (green status)
2. Verify `GROQ_API_KEY` is set correctly
3. Check browser console for API errors

### TTS not working
1. Ensure `edge-tts` Python module is installed on Render
2. Check Render logs for Python errors
3. Verify audio files are being generated

### Database errors
1. Whitelist Render IP in MongoDB Atlas Network Access
2. Verify `MONGODB_URI` connection string is correct
3. Check if database exists: `storytime`

---

## Next Steps

1. Deploy Render.io backend first
2. Deploy Cloudflare Pages frontend
3. Test at production URLs
4. (Optional) Set up custom domain on Cloudflare
