const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Voice options - use voices that work reliably
const VOICES = {
  en: 'en-US-AriaNeural',      // Professional English female
  hi: 'hi-IN-MadhurNeural'     // Hindi male narrator (reliable)
};

// Fallback voices if primary fails
const FALLBACK_VOICES = {
  en: 'en-US-GuyNeural',
  hi: 'hi-IN-NeerajNeural'     // Alternative Hindi voice
};

// Additional fallback voices for extra reliability
const SECOND_FALLBACK_VOICES = {
  en: 'en-US-JennyNeural',
  hi: 'hi-IN-AmolNeural'       // Third option for Hindi
};

// Cache for generated audio files
const audioCache = new Map();

const generateTTS = async (text, lang = 'en', attemptCount = 0) => {
  return new Promise((resolve, reject) => {
    try {
      let voiceId = VOICES[lang] || VOICES.en;
      
      // Use fallback voice on second attempt
      if (attemptCount === 1) {
        voiceId = FALLBACK_VOICES[lang] || VOICES[lang];
        console.log('🎤 Trying fallback voice:', voiceId);
      }
      
      // Use second fallback on third attempt
      if (attemptCount === 2) {
        voiceId = SECOND_FALLBACK_VOICES[lang] || VOICES[lang];
        console.log('🎤 Trying second fallback voice:', voiceId);
      }
      
      // Check cache first
      const cacheKey = `${voiceId}_${text}`;
      const hash = crypto.createHash('md5').update(cacheKey).digest('hex');
      
      if (audioCache.has(hash)) {
        console.log('📦 Using cached audio');
        const cachedData = audioCache.get(hash);
        // Verify file still exists
        if (fs.existsSync(cachedData.filePath)) {
          return resolve(cachedData);
        } else {
          console.log('⚠️ Cached file missing, regenerating...');
          audioCache.delete(hash);
        }
      }
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate unique filename
      const fileName = `tts_${hash}.mp3`;
      const filePath = path.join(tempDir, fileName);

      // Check if file already exists on disk
      if (fs.existsSync(filePath)) {
        console.log('💾 Audio exists on disk');
        const data = { fileName, filePath };
        audioCache.set(hash, data);
        return resolve(data);
      }

      // Escape quotes and special chars for command line
      // On Windows, we need to wrap the path in quotes
      const safeText = text.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
      const quotedPath = `"${filePath}"`;

      // Use edge-tts CLI (Python) - with longer timeout for Hindi
      const timeout = lang === 'hi' ? 90000 : 30000;
      // Try both forms of the command
      const command = `python -m edge_tts --voice "${voiceId}" --rate -5% --write-media ${quotedPath} --text "${safeText}"`;

      console.log('🎤 Generating TTS:', { voice: voiceId, chars: text.length, lang, attempt: attemptCount + 1 });
      console.log('   Command:', command);

      const options = {
        maxBuffer: 10 * 1024 * 1024,
        timeout,
        shell: true,
        env: { ...process.env }
      };

      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ TTS CLI Error:', error.message);
          console.error('   Command was:', command);
          console.error('   Stdout:', stdout);
          console.error('   Stderr:', stderr);
          
          // Retry with fallback voice if not already attempted
          if (attemptCount === 0) {
            console.log('⚠️ TTS failed, retrying with fallback voice...');
            return generateTTS(text, lang, attemptCount + 1)
              .then(resolve)
              .catch(reject);
          }
          
          // Retry with second fallback on second failure
          if (attemptCount === 1) {
            console.log('⚠️ Fallback voice failed, trying second fallback...');
            return generateTTS(text, lang, attemptCount + 2)
              .then(resolve)
              .catch(reject);
          }
          
          // If all voices fail and it's Hindi, try English
          if (lang === 'hi' && attemptCount === 2) {
            console.log('⚠️ All Hindi voices failed, trying English fallback...');
            return generateTTS(text, 'en', 0)
              .then(resolve)
              .catch(reject);
          }
          
          return reject(new Error(`TTS failed after retries: ${error.message}`));
        }

        // Verify file was actually created
        if (!fs.existsSync(filePath)) {
          console.error('❌ Audio file was not created:', filePath);
          
          // Retry with fallback voice if not already attempted
          if (attemptCount === 0) {
            console.log('⚠️ Audio file not created, retrying with fallback voice...');
            return generateTTS(text, lang, attemptCount + 1)
              .then(resolve)
              .catch(reject);
          }
          
          // Retry with second fallback on second failure
          if (attemptCount === 1) {
            console.log('⚠️ Fallback audio not created, trying second fallback...');
            return generateTTS(text, lang, attemptCount + 2)
              .then(resolve)
              .catch(reject);
          }
          
          // If all voices fail and it's Hindi, try English
          if (lang === 'hi' && attemptCount === 2) {
            console.log('⚠️ All Hindi voices failed to create file, trying English fallback...');
            return generateTTS(text, 'en', 0)
              .then(resolve)
              .catch(reject);
          }
          
          return reject(new Error('Audio file not generated - edge-tts did not create output'));
        }

        // Verify file has content
        const stats = fs.statSync(filePath);
        if (stats.size < 50) {
          console.error('❌ Audio file too small:', stats.size);
          
          // Retry with fallback voice if not already attempted
          if (attemptCount === 0) {
            console.log('⚠️ Audio file too small, retrying with fallback voice...');
            return generateTTS(text, lang, attemptCount + 1)
              .then(resolve)
              .catch(reject);
          }
          
          // Retry with second fallback on second failure
          if (attemptCount === 1) {
            console.log('⚠️ Fallback audio too small, trying second fallback...');
            return generateTTS(text, lang, attemptCount + 2)
              .then(resolve)
              .catch(reject);
          }
          
          // If all voices fail and it's Hindi, try English
          if (lang === 'hi' && attemptCount === 2) {
            console.log('⚠️ All Hindi audio files too small, trying English fallback...');
            return generateTTS(text, 'en', 0)
              .then(resolve)
              .catch(reject);
          }
          
          return reject(new Error(`Audio file too small: ${stats.size} bytes`));
        }

        const data = { fileName, filePath };
        audioCache.set(hash, data);
        
        console.log('✅ Audio generated:', fileName, `(${stats.size} bytes)`);
        resolve(data);
      });

    } catch (err) {
      console.error('TTS Generation Error:', err);
      reject(err);
    }
  });
};

module.exports = { generateTTS };
