require("dotenv").config();

console.log("🔧 Backend starting...");
console.log("Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasMongoDB: !!process.env.MONGODB_URI
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// ✅ create app FIRST
const app = express();

// ✅ CORS FIRST - before any routes
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.use(express.json());

// MongoDB Connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
    })
    .catch((err) => {
        console.warn("⚠️ MongoDB Warning:", err.message);
        console.log("   Continuing without database...");
    });
} else {
    console.log("⚠️ MongoDB URI not configured - running in demo mode");
}

// ✅ routes AFTER app is created
const ttsRoute = require("./routes/tts");
app.use("/api/tts", ttsRoute);

const storyRoute = require("./routes/story");
app.use("/api/story", storyRoute);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

// ✅ Handle OPTIONS for all routes (preflight)
app.options("/*", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "*");
    res.sendStatus(200);
});

// ✅ start server LAST (only if NOT in serverless environment)
if (process.env.VERCEL !== "true") {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
const cors = require('cors');

app.use(cors({
  origin: [
    'https://storyai-8gn.pages.dev',
    'http://localhost:3000',      // for local dev
    'http://localhost:5173',      // if using Vite
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// This must be BEFORE all your routes
app.use(express.json());
app.use('/api', yourRoutes);

// Export for Vercel serverless functions
module.exports = app;
