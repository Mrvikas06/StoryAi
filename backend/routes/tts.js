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
  const { text, lang = 'en' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    const clean = stripEmoji(text).substring(0, 3000);
    console.log('🎤 TTS Request:', { lang, chars: clean.length });

    const { filePath, fileName } = await generateTTS(clean, lang);
    
    // Verify file exists and has content
    if (!fs.existsSync(filePath)) {
      console.error('❌ Audio file not found:', filePath);
      return res.status(500).json({ error: 'Audio file generation failed' });
    }

    const stats = fs.statSync(filePath);
    if (stats.size < 50) {
      console.error('❌ Audio file too small:', stats.size);
      return res.status(500).json({ error: 'Audio file is too small/corrupted' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', (err) => {
      console.error('❌ Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read audio file' });
      }
    });
    
    stream.pipe(res);

    stream.on('end', () => {
      // Clean up temp file after a short delay
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Cleanup error:', err);
          }
        });
      }, 100);
    });

  } catch (err) {
    console.error('❌ TTS Error:', err.message);
    console.error('Stack:', err.stack);
    // Return empty audio or error message instead of 500
    res.status(500).json({ 
      error: 'Text-to-speech unavailable. Python/edge-tts may not be installed on server.',
      message: err.message 
    });
  }
});

module.exports = router;
