/**
 * Production Server for Render.io
 * Serves both API and Frontend from single process
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: process.env.RENDER_EXTERNAL_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static frontend files
const frontendDistPath = path.join(__dirname, "frontend/dist");
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    console.log("✅ Frontend dist found and served");
} else {
    console.warn("⚠️ Frontend dist not found - make sure frontend is built");
}

console.log("🔧 Production server starting...");
console.log("Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 4000,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasMongoDB: !!process.env.MONGODB_URI,
    frontendFound: fs.existsSync(frontendDistPath)
});

// MongoDB Connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(() => console.log("✅ MongoDB Connected"))
        .catch((err) => {
            console.warn("⚠️ MongoDB Warning:", err.message);
            console.log("   Continuing without database...");
        });
} else {
    console.log("⚠️ MongoDB not configured - running in demo mode");
}

// API Routes
try {
    const ttsRoute = require("./backend/routes/tts");
    const storyRoute = require("./backend/routes/story");

    app.use("/api/tts", ttsRoute);
    app.use("/api/story", storyRoute);
    console.log("✅ API routes loaded");
} catch (err) {
    console.error("❌ Error loading routes:", err.message);
}

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// Catch-all for React app (SPA routing) - must be last
app.get("*", (req, res) => {
    const indexPath = path.join(frontendDistPath, "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error("Error sending index.html:", err);
                res.status(404).json({ error: "Not found" });
            }
        });
    } else {
        res.status(404).json({ error: "Frontend not built. Please build frontend first." });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error("🚨 Server error:", err.stack);
    res.status(500).json({
        error: err.message,
        status: 500
    });
});

// Start Server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
    console.log("📛 SIGTERM received, closing server...");
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    console.log("⏹️ SIGINT received, closing server...");
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});

module.exports = app;
