# Vercel + Render Deployment

## Recommended setup

- **Frontend**: Vercel
- **Backend API**: Render
- **Database**: MongoDB Atlas

## Environment variables

### Render backend

Add these in the Render dashboard for the backend service:

- `GROQ_API_KEY`
- `MONGODB_URI` (optional but recommended)
- `NODE_ENV=production`
- `PORT=10000`
- `RENDER_EXTERNAL_URL=https://your-render-service.onrender.com`

### Vercel frontend

Add this in the Vercel project settings:

- `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`

## Deploy steps

1. Push the repo to GitHub.
2. Create the backend service on Render using the repo.
3. Set the backend start command to `cd backend && node server.js`.
4. Add the Render env variables above.
5. Deploy the frontend on Vercel using the same repo.
6. Add `VITE_API_BASE_URL` in Vercel.
7. Redeploy.

## Notes

- The app will use browser speech synthesis on Vercel if the server TTS route is unavailable.
- If you want server-generated MP3 audio, keep the backend on Render.
- The story generation route runs from Vercel `/api/story/generate` and can also use the Render backend depending on the frontend API base URL.
