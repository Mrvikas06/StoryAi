import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import Express and routes
import express from 'express';
import cors from 'cors';

// Dynamic imports for compatibility
let storyRoute, ttsRoute;

async function loadRoutes() {
  if (!storyRoute) {
    const storyModule = await import('../backend/routes/story.js');
    storyRoute = storyModule.default;
  }
  if (!ttsRoute) {
    const ttsModule = await import('../backend/routes/tts.js');
    ttsRoute = ttsModule.default;
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Initialize routes
app.use(async (req, res, next) => {
  await loadRoutes();
  next();
});

// API routes
app.use('/api/story', storyRoute);
app.use('/api/tts', ttsRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running on Cloudflare Workers',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for React app (SPA routing)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Export for Cloudflare Workers
export default app;
