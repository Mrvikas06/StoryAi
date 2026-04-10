require("dotenv").config();

console.log("🔧 Backend starting...");
console.log("Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasMongoDB: !!process.env.MONGODB_URI
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// ✅ CORS config
app.use(cors({
    origin: [
        'https://storyai-8gn.pages.dev',
        'http://localhost:3000',
        'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ✅ Handle preflight - use "*" not "/*"
app.options("*", cors());

app.use(express.json());

// MongoDB
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log("✅ MongoDB Connected"))
        .catch((err) => console.warn("⚠️ MongoDB Warning:", err.message));
} else {
    console.log("⚠️ MongoDB URI not configured - running in demo mode");
}

// Routes
const ttsRoute = require("./routes/tts");
app.use("/api/tts", ttsRoute);

const storyRoute = require("./routes/story");
app.use("/api/story", storyRoute);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;

