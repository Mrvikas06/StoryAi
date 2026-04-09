// api/health.js - Simple health check endpoint
export default (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
};
