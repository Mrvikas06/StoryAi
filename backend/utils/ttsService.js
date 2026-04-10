const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const VOICES = {
  en: 'en-US-AriaNeural',
  hi: 'hi-IN-MadhurNeural'
};

const audioCache = new Map();

const generateTTS = async (text, lang = 'en') => {
  const voiceId = VOICES[lang] || VOICES.en;
  const cacheKey = `${voiceId}_${text}`;
  const hash = crypto.createHash('md5').update(cacheKey).digest('hex');

  // Return cached file if exists
  if (audioCache.has(hash)) {
    const cached = audioCache.get(hash);
    if (fs.existsSync(cached.filePath)) return cached;
    audioCache.delete(hash);
  }

  // Create temp dir
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const fileName = `tts_${hash}.mp3`;
  const filePath = path.join(tempDir, fileName);

  // Return if already on disk
  if (fs.existsSync(filePath)) {
    const data = { fileName, filePath };
    audioCache.set(hash, data);
    return data;
  }

  console.log('🎤 Generating TTS:', { voice: voiceId, chars: text.length, lang });

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

  const stats = fs.statSync(filePath);
  console.log('✅ Audio generated:', fileName, `(${stats.size} bytes)`);

  const data = { fileName, filePath };
  audioCache.set(hash, data);
  return data;
};

module.exports = { generateTTS };