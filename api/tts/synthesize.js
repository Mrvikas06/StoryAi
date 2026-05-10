// api/tts/synthesize.js - Text-to-speech endpoint
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, lang = 'en' } = req.query;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const voice = lang === 'hi' ? 'hi-IN-NeerajNeural' : 'en-US-AriaNeural';
    const hash = crypto.createHash('md5').update(`${text}_${lang}`).digest('hex');
    const audioPath = `/tmp/tts_${hash}.mp3`;

    // Generate audio using edge-tts
    const command = `python -m edge_tts --voice "${voice}" --rate -5% --write-media "${audioPath}" --text "${text.replace(/"/g, '\\"')}"`;
    
    try {
      execSync(command, { shell: true, stdio: 'pipe' });
    } catch (err) {
      console.error('TTS error:', err.message);
      return res.status(500).json({ error: 'Audio generation failed' });
    }

    // Read and stream audio
    if (fs.existsSync(audioPath)) {
      const audio = fs.readFileSync(audioPath);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audio);
      
      // Clean up
      fs.unlinkSync(audioPath);
    } else {
      res.status(500).json({ error: 'Failed to generate audio' });
    }
  } catch (e) {
    console.error('TTS endpoint error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
