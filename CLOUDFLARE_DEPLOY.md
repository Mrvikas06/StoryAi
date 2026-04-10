# Cloudflare Deployment Guide

## Prerequisites
- Cloudflare account (https://dash.cloudflare.com)
- Domain connected to Cloudflare (or use pages.dev subdomain)
- Node.js and npm installed locally
- Wrangler CLI: `npm install -g wrangler`

## Setup Steps

### 1. Authenticate with Cloudflare
```bash
wrangler login
```
This will open a browser to authorize your Cloudflare account.

### 2. Create KV Namespaces (for audio caching)
```bash
wrangler kv:namespace create "AUDIO_CACHE"
wrangler kv:namespace create "AUDIO_CACHE" --preview
```

### 3. Update wrangler.toml
Add the KV namespace IDs returned from the previous command to `wrangler.toml`:
```toml
[[env.production.kv_namespaces]]
binding = "AUDIO_CACHE"
id = "your_kv_namespace_id"
preview_id = "your_kv_preview_id"
```

### 4. Set Environment Variables
```bash
wrangler secret put GROQ_API_KEY
# Paste your Groq API key when prompted

wrangler secret put MONGODB_URI
# Paste your MongoDB connection string when prompted
```

### 5. Deploy
```bash
npm run deploy:cloudflare
```

## Post-Deployment

Your app will be available at: `https://storytime-app.pages.dev`

### Test the deployment:
```bash
curl https://storytime-app.pages.dev/api/health
```

## Troubleshooting

### TTS Issues
⚠️ **Note:** Python edge-tts may not work on Cloudflare Workers due to execution environment limitations. For TTS support, consider:
- Keep Render.io for backend API only
- Use Cloudflare Pages + API proxy to Render backend

### Log viewing
```bash
wrangler tail
```

### Local testing before deployment
```bash
npm run dev:cloudflare
```

## File Structure
```
├── wrangler.toml                 # Cloudflare config
├── src/
│   └── worker.js                # Worker entry point
├── backend/
│   ├── routes/
│   ├── utils/
│   └── models/
└── frontend/
    └── dist/                    # Built React app
```

## Important Notes

1. **Python Limitations**: Cloudflare Workers doesn't support Python execution. The TTS module may fail.
2. **File System**: Workers can't access traditional file system. MP3 files need to be stored in KV or R2.
3. **Timeouts**: Workers have execution time limits (10 seconds for free tier, 30 for paid).

## Alternative: Hybrid Deployment

For full TTS support:
- Frontend: Cloudflare Pages (React)
- Backend API: Render.io (Python TTS support)
- Update API_URL to point to Render backend

This gives you the best of both worlds!
