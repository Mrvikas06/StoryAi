/**
 * Production Server for Render.io
 * Serves both API and Frontend from single process
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend/dist")));

console.log("🔧 Production server starting...");

// MongoDB Connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log("✅ MongoDB Connected"))
        .catch((err) => console.warn("⚠️ MongoDB:", err.message));
} else {
    console.log("⚠️ MongoDB not configured - demo mode");
}

// API Routes
const ttsRoute = require("./backend/routes/tts");
const storyRoute = require("./backend/routes/story");

app.use("/api/tts", ttsRoute);
app.use("/api/story", storyRoute);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

// Serve React app
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
