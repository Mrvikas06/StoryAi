const path = require('path');
const fs = require('fs');

const VOICES = {
  en: 'en-GB-SoniaNeural',
  hi: 'hi-IN-MadhurNeural'
};

const tempDir = path.join(__dirname, '../temp');

function cleanOldTempFiles() {
  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      return;
    }
    const now = Date.now();
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (file === '.gitkeep') continue;
      const fullPath = path.join(tempDir, file);
      try {
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > 10 * 60 * 1000) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // ignore individual unlink errors
      }
    }
  } catch {
    // ignore readdir errors
  }
}

/**
 * Split text into chunks suitable for TTS (under 180 chars per clause)
 */
function splitIntoChunks(text, lang = 'en') {
  const isHindi = lang === 'hi' || lang === 'hi-IN' || /[\u0900-\u097F]/.test(text);
  const delimiter = isHindi
    ? /([^।!?.,\n]+[।!?.,\n]+|[^।!?.,\n]+$)/g
    : /([^.!?:\n]+[.!?:\n]+|[^.!?:\n]+$)/g;
  const rawChunks = text.match(delimiter) || [text];
  const result = [];

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    if (trimmed.length <= 180) {
      result.push(trimmed);
    } else {
      // Further split long sentence by commas or spaces
      const subClauses = trimmed.split(/,\s*/);
      let current = '';
      for (const clause of subClauses) {
        if ((current + ' ' + clause).trim().length <= 180) {
          current = (current + ' ' + clause).trim();
        } else {
          if (current) result.push(current);
          current = clause;
        }
      }
      if (current) result.push(current);
    }
  }

  return result.length > 0 ? result : [text.substring(0, 180)];
}

/**
 * Synthesize speech buffer using Google Translate TTS API
 * Using 'en-gb' for proper English storytelling and 'hi' for authentic Indian Hindi accent
 */
async function synthesizeWebAudio(text, lang = 'en') {
  const isHindi = lang === 'hi' || lang === 'hi-IN' || /[\u0900-\u097F]/.test(text);
  const langCode = isHindi ? 'hi' : 'en-gb';
  const chunks = splitIntoChunks(text, lang);
  const buffers = [];

  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`Google TTS request failed with status ${response.status}`);
    }

    const arrayBuf = await response.arrayBuffer();
    buffers.push(Buffer.from(arrayBuf));
  }

  return Buffer.concat(buffers);
}

const generateTTS = async (text, lang = 'en') => {
  cleanOldTempFiles();

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const fileName = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp3`;
  const filePath = path.join(tempDir, fileName);

  try {
    // Generate audio buffer via robust web synthesis
    const audioBuffer = await synthesizeWebAudio(text, lang);
    await fs.promises.writeFile(filePath, audioBuffer);
    return { fileName, filePath };
  } catch (err) {
    console.warn('Web audio synthesis failed, attempting local fallback:', err.message);
    throw err;
  }
};

module.exports = {
  generateTTS,
  synthesizeWebAudio,
  cleanOldTempFiles,
  splitIntoChunks,
  VOICES
};
