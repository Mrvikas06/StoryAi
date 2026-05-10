# Storytime App - Ready for Render.io & Cloudflare Deployment

> A child-friendly storytelling application with bilingual TTS support. Generate personalized stories with AI and hear them read aloud in English or Hindi!

## ✨ Features

- 📖 **AI Story Generation** - Creates personalized stories from word prompts using Groq API
- 🎤 **Text-to-Speech** - Bilingual audio support (English & Hindi)
- 👧 **Child-Friendly** - Designed for ages 6-12, emotionally engaging narratives
- 💾 **Story Persistence** - Optional MongoDB integration for saving stories
- 🎨 **Responsive UI** - Works on desktop, tablet, and mobile
- 🚀 **Easy Deployment** - Pre-configured for Render.io and Cloudflare

## 📦 Technology Stack

**Backend:**
- Node.js 18+
- Express.js
- MongoDB (optional)
- Groq SDK for AI
- edge-tts for text-to-speech

**Frontend:**
- React 19
- Vite
- Axios
- React Router

## 🚀 Quick Deploy

### 1️⃣ Render.io (Full Stack)

```bash
# No local setup needed!

# 1. Go to https://render.com
# 2. New Web Service → Connect GitHub → Select storytime-app
# 3. Configure:
#    Build: cd backend && npm install && npm cache clean --force && cd ../frontend && npm install && npm run build && cd ..
#    Start: node scripts/start-server.js
# 4. Add env vars: GROQ_API_KEY, MONGODB_URI (optional)
# 5. Deploy! 🎉
```

**Result:** Your app at `https://storytime-app.onrender.com`

### 2️⃣ Cloudflare Pages + Render API

```bash
# Frontend on Cloudflare CDN + Backend on Render for full TTS support

# 1. Deploy backend to Render (follow Option 1)
# 2. Go to https://dash.cloudflare.com
# 3. Pages → New Project → Connect GitHub
# 4. Build: cd frontend && npm run build
# 5. Output: frontend/dist
# 6. Deploy! 🎉
```

**Result:**
- Frontend: `https://storytime-app.pages.dev`
- Backend: `https://storyai-1-o3pn.onrender.com`

### 3️⃣ Vercel

```bash
# 1. Push this repo to GitHub
# 2. Go to https://vercel.com/new
# 3. Import the repository
# 4. Keep the root directory as-is
# 5. Add env vars: GROQ_API_KEY, MONGODB_URI (optional)
# 6. Deploy
```

**Result:**
- Frontend: Vercel static site from `frontend/dist`
- API: serverless functions under `/api/*`
- TTS: browser speech fallback on Vercel if the serverless audio route is unavailable

## 💻 Local Development

```bash
# Clone & Install
git clone https://github.com/Mrvikas06/storytime-app.git
cd storytime-app

# Backend Setup
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
# Runs on http://localhost:4000

# Frontend Setup (new terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## 🔑 Required API Keys

| Key | Purpose | Get From |
|-----|---------|----------|
| `GROQ_API_KEY` | Story generation | [Groq Console](https://console.groq.com/keys) |
| `MONGODB_URI` | Story persistence (optional) | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) |

## 📁 Project Structure

```
storytime-app/
├── backend/
│   ├── routes/
│   │   ├── story.js       # Story generation endpoint
│   │   └── tts.js         # Text-to-speech endpoint
│   ├── models/
│   │   └── Story.js       # MongoDB schema
│   ├── utils/
│   │   ├── ttsService.js  # TTS implementation
│   │   ├── prompt.js      # AI prompt engineering
│   │   └── parseStory.js  # Response parsing
│   ├── server.js          # Backend entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StoryDisplay.jsx
│   │   │   └── WordInput.jsx
│   │   ├── hooks/
│   │   │   ├── useTTS.js
│   │   │   └── useVoiceInput.js
│   │   ├── api.js         # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── server.js              # Production entry point
├── render.yaml            # Render.io config
├── wrangler.toml          # Cloudflare config
├── Dockerfile             # Docker support
├── DEPLOYMENT.md          # Detailed deployment guide
├── QUICK_START.md         # Quick reference
└── README.md              # This file
```

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/story/generate` | Generate story from words |
| GET | `/api/stories/:childId` | Get saved stories |
| POST | `/api/tts/speak` | Generate audio from text |

## ✅ Pre-Deployment Checklist

Before deploying:

- [ ] API keys configured in environment
- [ ] Frontend builds successfully: `npm run build` in frontend/
- [ ] Backend starts: `npm start` in backend/
- [ ] Health check passes: `curl http://localhost:4000/api/health`
- [ ] Git repo pushed to GitHub main branch
- [ ] `.env` file in `.gitignore` (already done)

## 🛠️ Configuration Files

### render.yaml
Configuration for Render.io deployment. Specifies:
- Build command (installs dependencies, builds frontend)
- Start command (runs production server)
- Environment variables
- Health check endpoint

### wrangler.toml
Configuration for Cloudflare Workers/Pages deployment. Includes:
- Build settings for Vite
- KV namespace bindings for caching
- Environment-specific settings

### Dockerfile
For Docker/container deployment:
```bash
docker build -t storytime-app .
docker run -p 10000:10000 \
  -e GROQ_API_KEY=your_key \
  -e MONGODB_URI=your_uri \
  storytime-app
```

## 📊 Environment Variables

```env
# Required
GROQ_API_KEY=xxx                    # Story generation API key

# Optional
MONGODB_URI=xxx                     # MongoDB connection string
NODE_ENV=production                 # Set to production on deploy
PORT=10000                          # Server port
RENDER_EXTERNAL_URL=https://...     # For CORS on Render

# Optional AI alternatives (if not using Groq)
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
ELEVENLABS_API_KEY=xxx
```

## 🚨 Troubleshooting

### Story generation fails
```
✅ Check GROQ_API_KEY is valid
✅ Visit https://console.groq.com/keys to verify
✅ Regenerate key if needed
```

### Audio doesn't play
```
✅ Python must be installed on server (pre-installed on Render)
✅ Check TTS route is working: POST /api/tts/speak
✅ Verify audio file is generated: backend/temp folder
```

### Vercel TTS fallback
```
✅ Vercel does not support the Python-based audio workflow used by the server route
✅ The app will fall back to browser speech synthesis automatically
✅ For server-generated MP3 audio, deploy the backend to Render instead
```

### Frontend shows "build not found"
```
✅ Build frontend: npm run build in frontend/
✅ Check render.yaml build command
✅ Verify frontend/dist exists after build
```

### MongoDB connection fails
```
✅ This is OK! App runs without database
✅ Stories saved in memory instead
✅ Add MONGODB_URI if you want persistence
```

## 📚 Documentation

- **Detailed Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md) - Step-by-step guide for all scenarios
- **Hybrid Setup**: [HYBRID_DEPLOY.md](HYBRID_DEPLOY.md) - Cloudflare + Render architecture
- **Cloudflare Setup**: [CLOUDFLARE_DEPLOY.md](CLOUDFLARE_DEPLOY.md) - Cloudflare Workers configuration

## 🎯 Next Steps

After deploying:

1. ✅ Test with sample words: "tree", "adventure", "friend"
2. ✅ Verify audio generation
3. ✅ Set up custom domain (optional)
4. ✅ Monitor logs in dashboard
5. ✅ Enable GitHub auto-deploy

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Groq Docs**: https://console.groq.com/docs

## 📝 License

This project is open source. Feel free to use and modify!

---

**🎉 Ready to deploy? Start with [DEPLOYMENT.md](DEPLOYMENT.md)!**
