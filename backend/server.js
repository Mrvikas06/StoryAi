require("dotenv").config();

const express = require("express");
const cors = require("cors");

// ✅ create app FIRST
const app = express();

// ✅ middlewares
app.use(cors());
app.use(express.json());

// ✅ routes AFTER app is created
const ttsRoute = require("./routes/tts");
app.use("/api/tts", ttsRoute);

// (your other routes)
const storyRoute = require("./routes/story");
app.use("/api/story", storyRoute);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

// ✅ start server LAST (only if not on Vercel)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
const mongoose = require("mongoose");

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
