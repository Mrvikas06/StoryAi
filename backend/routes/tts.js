const router = require('express').Router();
const fs = require('fs');
const { generateTTS } = require('../utils/ttsService');

function stripEmoji(text) {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

router.post('/speak', async (req, res) => {
  const { text, lang = 'en' } = req.body || {};

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  let generatedFile = null;

  const cleanup = () => {
    if (generatedFile && fs.existsSync(generatedFile)) {
      fs.unlink(generatedFile, () => {});
      generatedFile = null;
    }
  };

  try {
    const clean = stripEmoji(text).substring(0, 3000);
    const { filePath, fileName } = await generateTTS(clean, lang);
    generatedFile = filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: 'Audio file generation failed' });
    }

    const stats = fs.statSync(filePath);
    if (stats.size < 50) {
      cleanup();
      return res.status(500).json({ error: 'Audio file is too small or corrupted' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const stream = fs.createReadStream(filePath);

    res.on('finish', () => {
      setTimeout(cleanup, 250);
    });

    res.on('close', () => {
      setTimeout(cleanup, 250);
    });

    stream.on('error', (err) => {
      cleanup();
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read audio stream', message: err.message });
      }
    });

    stream.pipe(res);
  } catch (err) {
    cleanup();
    res.status(500).json({
      error: 'Text-to-speech unavailable',
      message: err.message
    });
  }
});

module.exports = router;
module.exports.stripEmoji = stripEmoji;
