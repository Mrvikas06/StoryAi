#!/usr/bin/env node
/**
 * Production startup script for Render.io
 * Ensures frontend is built before starting the backend server
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("🚀 Starting production server...");

// Check if frontend is built
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (!fs.existsSync(frontendDistPath)) {
  console.log("📦 Frontend build not found. Building frontend...");
  
  const buildProcess = spawn("npm", ["run", "build"], {
    cwd: path.join(__dirname, "../"),
    stdio: "inherit",
    shell: true
  });

  buildProcess.on("close", (code) => {
    if (code !== 0) {
      console.error("❌ Frontend build failed!");
      process.exit(1);
    }
    console.log("✅ Frontend build complete");
    startBackend();
  });
} else {
  console.log("✅ Frontend build found");
  startBackend();
}

function startBackend() {
  console.log("🔧 Starting backend server...");
  
  const serverProcess = spawn("node", [path.join(__dirname, "../server.js")], {
    stdio: "inherit",
    env: { ...process.env }
  });

  serverProcess.on("error", (err) => {
    console.error("❌ Server error:", err);
    process.exit(1);
  });

  process.on("SIGTERM", () => {
    console.log("📛 SIGTERM received, shutting down...");
    serverProcess.kill();
    process.exit(0);
  });
}
