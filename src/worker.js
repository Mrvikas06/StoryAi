const path = require('path');
const express = require('express');
const cors = require('cors');

// Import routes
const storyRoute = require('../backend/routes/story');
const ttsRoute = require('../backend/routes/tts');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

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
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Export as default for Cloudflare
module.exports = app;
