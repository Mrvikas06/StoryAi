module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  // Serverless environments without media binaries rely on frontend browser SpeechSynthesis
  return res.status(503).json({
    error: 'Serverless audio synthesis unavailable',
    fallback: 'browser'
  });
};
