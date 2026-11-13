const { webcrypto } = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');

const VOICES = {
  en: 'en-US-AriaNeural',
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
        // ignore individual file stat/unlink errors
      }
    }
  } catch {
    // ignore readdir errors
  }
}

const generateTTS = async (text, lang = 'en') => {
  cleanOldTempFiles();

  const voiceId = VOICES[lang] || VOICES.en;
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const fileName = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp3`;
  const filePath = path.join(tempDir, fileName);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    const { audioStream } = tts.toStream(text);
    audioStream.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    audioStream.on('error', reject);
  });

  return { fileName, filePath };
};

module.exports = { generateTTS, cleanOldTempFiles, VOICES };
