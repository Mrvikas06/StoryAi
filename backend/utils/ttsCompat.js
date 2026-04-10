const path = require('path');

// Fallback TTS using Google Translate API (free, no auth needed)
async function generateTTSWeb(text, lang = 'en') {
  const langCode = lang === 'hi' ? 'hi' : 'en';
  
  try {
    // Use a free TTS API as fallback
    const response = await fetch('https://tts-api.com/api/synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        lang: langCode,
        service: 'google'
      })
    });

    if (!response.ok) {
      throw new Error('TTS API failed');
    }

    const buffer = await response.arrayBuffer();
    
    return {
      buffer: Buffer.from(buffer),
      mimeType: 'audio/mp3'
    };
  } catch (err) {
    console.error('TTS Web API error:', err.message);
    throw new Error('TTS generation failed');
  }
}

// Check if we're in a Cloudflare Worker environment
function isCloudflareWorker() {
  return typeof globalThis !== 'undefined' && 
         globalThis.AUDIO_CACHE !== undefined;
}

const generateTTS = async (text, lang = 'en', attemptCount = 0) => {
  // In Cloudflare Workers, use web-based TTS
  if (isCloudflareWorker()) {
    const result = await generateTTSWeb(text, lang);
    return {
      buffer: result.buffer,
      mimeType: result.mimeType
    };
  }

  // Local development: use original edge-tts
  return require('./ttsService').generateTTS(text, lang, attemptCount);
};

module.exports = { generateTTS, isCloudflareWorker };
