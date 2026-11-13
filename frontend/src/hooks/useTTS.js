import { useState, useRef, useEffect, useCallback } from 'react';
import { speakText } from '../api';

function stripEmoji(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split story text into clean, individual sentences for read-along tracking.
 * Accurately parses Devanagari Hindi punctuation (।, !, ?, .) and English (. ! ?).
 */
export function splitStorySentences(text, lang = 'en') {
  if (!text) return [];
  const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(text);
  const delimiter = isHindi
    ? /[^।!?.\n]+[।!?.\n]+|[^।!?.\n]+$/g
    : /[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g;
  const matches = text.match(delimiter);
  if (!matches) return [text.trim()];
  return matches.map((s) => s.trim()).filter(Boolean);
}

export const STORYTELLER_TONES = {
  gentle: {
    id: 'gentle',
    label: 'Warm Storyteller',
    emoji: '🌸',
    pitch: 1.0,
    rate: 0.90,
    description: 'Natural, warm, comforting storytelling cadence'
  },
  lively: {
    id: 'lively',
    label: 'Lively Explorer',
    emoji: '🌟',
    pitch: 1.02,
    rate: 0.98,
    description: 'Upbeat, cheerful, engaging adventure tone'
  },
  bedtime: {
    id: 'bedtime',
    label: 'Calm Bedtime',
    emoji: '🌙',
    pitch: 0.96,
    rate: 0.84,
    description: 'Slow, soothing, relaxing bedtime cadence'
  }
};

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speakLang, setSpeakLang] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);
  const [selectedTone, setSelectedTone] = useState('gentle');
  const [availableVoices, setAvailableVoices] = useState([]);

  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const timerRef = useRef(null);

  const sessionRef = useRef({
    id: 0,
    active: false,
    paused: false,
    lang: 'en',
    sentences: [],
    currentIndex: 0,
    singleOnly: false,
    mode: 'synth', // 'synth' or 'server'
    voice: null,
    audioCache: new Map(), // sentenceIndex -> blobUrl
    prefetching: new Set()
  });

  // Load and cache browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices() || [];
      if (v.length > 0) {
        setAvailableVoices(v);
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  /**
   * Evaluate best voice and playback engine.
   * - For English: Prioritizes British / Proper English accents (en-GB, UK English)
   *   or high-quality natural voices. If only robotic David Desktop is found, falls back to server TTS (en-gb).
   * - For Hindi: Prioritizes genuine Indian Hindi voices (Swara, Madhur, Google Hindi).
   *   If no native Hindi voice is present in the browser, falls back to server TTS (hi) with authentic Indian accent.
   */
  const evaluateVoiceOption = useCallback(
    (lang = 'en') => {
      const voices =
        availableVoices.length > 0
          ? availableVoices
          : typeof window !== 'undefined' && window.speechSynthesis
          ? window.speechSynthesis.getVoices()
          : [];

      if (!voices || !voices.length) {
        return { mode: 'server', voice: null };
      }

      if (lang === 'hi') {
        // Priority 1: Natural / Online Hindi voices
        const naturalHi = voices.find(
          (v) =>
            (v.lang.startsWith('hi') || v.lang === 'hi_IN') &&
            (v.name.includes('Natural') || v.name.includes('Online'))
        );
        if (naturalHi) return { mode: 'synth', voice: naturalHi };

        // Priority 2: Named authentic Hindi voices (Google हिन्दी, Swara, Madhur, Lekha, Kalpana)
        const namedHi = voices.find(
          (v) =>
            (v.lang.startsWith('hi') || v.lang === 'hi_IN') &&
            (v.name.includes('Google') ||
              v.name.includes('Madhur') ||
              v.name.includes('Swara') ||
              v.name.includes('Lekha') ||
              v.name.includes('Kalpana') ||
              v.name.includes('हिन्दी'))
        );
        if (namedHi) return { mode: 'synth', voice: namedHi };

        // Priority 3: Any voice matching Hindi lang tag
        const anyHi = voices.find((v) => v.lang.startsWith('hi') || v.lang === 'hi_IN');
        if (anyHi) return { mode: 'synth', voice: anyHi };

        // If no Hindi voice is installed on user's machine (standard Windows),
        // use server TTS which streams native Indian Hindi audio!
        return { mode: 'server', voice: null };
      }

      // English ("Proper English" - UK / Received Pronunciation & Natural voices)
      // Priority 1: Microsoft UK Natural voices (Sonia, Ryan, Libby, Maisie)
      const ukNatural = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('en-gb') &&
          (v.name.includes('Natural') || v.name.includes('Online'))
      );
      if (ukNatural) return { mode: 'synth', voice: ukNatural };

      // Priority 2: Google UK English voices
      const googleUk = voices.find(
        (v) =>
          v.name.includes('Google UK English') ||
          (v.lang.toLowerCase().startsWith('en-gb') && v.name.includes('Google'))
      );
      if (googleUk) return { mode: 'synth', voice: googleUk };

      // Priority 3: Other UK / British English voices (George, Hazel, Susan, Oliver, Serena)
      const anyUk = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('en-gb') ||
          v.name.includes('United Kingdom') ||
          v.name.includes('Great Britain')
      );
      if (anyUk) return { mode: 'synth', voice: anyUk };

      // Priority 4: Natural storytelling voices (Jenny, Aria, Christopher, Guy)
      const naturalEn = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural')) &&
          !v.name.toLowerCase().includes('david')
      );
      if (naturalEn) return { mode: 'synth', voice: naturalEn };

      // Priority 5: High quality US voices (Google US English, Samantha, Victoria)
      const friendlyEn = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Victoria'))
      );
      if (friendlyEn) return { mode: 'synth', voice: friendlyEn };

      // If only robotic Windows SAPI David Desktop is present, use server TTS (en-gb)
      const onlyRobotic = voices.every(
        (v) => v.name.toLowerCase().includes('david') || !v.lang.startsWith('en')
      );
      if (onlyRobotic) {
        return { mode: 'server', voice: null };
      }

      const fallback = voices.find((v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('david'));
      if (fallback) return { mode: 'synth', voice: fallback };

      return { mode: 'server', voice: null };
    },
    [availableVoices]
  );

  const stopAudio = useCallback(() => {
    // Increment session ID to cancel any in-flight asynchronous operations
    sessionRef.current.id += 1;
    sessionRef.current.active = false;
    sessionRef.current.paused = false;

    // Free memory by revoking object URLs
    sessionRef.current.audioCache.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore revoke error
      }
    });
    sessionRef.current.audioCache.clear();
    sessionRef.current.prefetching.clear();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore audio pause
      }
      audioRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore speech cancel
      }
    }

    setSpeaking(false);
    setPaused(false);
    setSpeakLang('');
    setLoading(false);
    setActiveSentenceIndex(-1);
  }, []);

  const pauseAudio = useCallback(() => {
    sessionRef.current.paused = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (audioRef.current && !audioRef.current.paused) {
      try {
        audioRef.current.pause();
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // ignore
      }
    }

    setPaused(true);
  }, []);

  /**
   * Play an individual sentence in sequence, updating the active yellow highlight
   * and smoothly transitioning to the next sentence upon completion.
   */
  const playSentence = useCallback(
    (index) => {
      const session = sessionRef.current;
      if (!session.active || session.paused) return;

      if (index < 0 || index >= session.sentences.length) {
        stopAudio();
        return;
      }

      session.currentIndex = index;
      setActiveSentenceIndex(index);
      setSpeaking(true);
      setPaused(false);
      setSpeakLang(session.lang);
      setError('');

      const rawSentence = session.sentences[index];
      const cleanSentence = stripEmoji(rawSentence);
      const toneConfig = STORYTELLER_TONES[selectedTone] || STORYTELLER_TONES.gentle;

      // Mode A: High quality client browser speech synthesis
      if (session.mode === 'synth' && typeof window !== 'undefined' && window.speechSynthesis) {
        const synth = window.speechSynthesis;
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanSentence);
        utterance.rate = toneConfig.rate;
        utterance.pitch = toneConfig.pitch;
        utterance.voice = session.voice;
        utterance.lang = session.voice?.lang || (session.lang === 'hi' ? 'hi-IN' : 'en-GB');

        utterance.onstart = () => {
          setLoading(false);
        };

        utterance.onend = () => {
          if (!session.active || sessionRef.current.id !== session.id || sessionRef.current.paused) {
            return;
          }

          if (session.singleOnly) {
            stopAudio();
            return;
          }

          const nextIndex = index + 1;
          if (nextIndex < session.sentences.length) {
            // Natural human breath gap between sentences (180ms)
            timerRef.current = setTimeout(() => {
              playSentence(nextIndex);
            }, 180);
          } else {
            stopAudio();
          }
        };

        utterance.onerror = (e) => {
          if (e.error === 'interrupted' || e.error === 'canceled') return;
          console.warn('SpeechSynthesis error, seamlessly falling back to server audio:', e.error);
          session.mode = 'server';
          playSentence(index);
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
        return;
      }

      // Mode B: Server-side high fidelity neural audio streaming (Native Indian Hindi / Proper English en-GB)
      const currentSessionId = session.id;

      // Prefetch upcoming sentences in the background so next sentences start with 0ms delay
      [index + 1, index + 2].forEach((nextI) => {
        if (
          nextI < session.sentences.length &&
          !session.audioCache.has(nextI) &&
          !session.prefetching.has(nextI)
        ) {
          session.prefetching.add(nextI);
          speakText(stripEmoji(session.sentences[nextI]), session.lang)
            .then((blob) => {
              if (sessionRef.current.id === currentSessionId && blob && blob.size > 100) {
                const url = URL.createObjectURL(blob);
                session.audioCache.set(nextI, url);
              }
            })
            .catch(() => {})
            .finally(() => {
              session.prefetching.delete(nextI);
            });
        }
      });

      const playAudioSentence = async () => {
        let blobUrl = session.audioCache.get(index);
        if (!blobUrl) {
          setLoading(true);
          try {
            const blob = await speakText(cleanSentence, session.lang);
            if (sessionRef.current.id !== currentSessionId || !sessionRef.current.active) return;
            if (!blob || blob.size < 100) {
              throw new Error('Audio generation failed');
            }
            blobUrl = URL.createObjectURL(blob);
            session.audioCache.set(index, blobUrl);
          } catch (err) {
            if (sessionRef.current.id === currentSessionId) {
              setError('Narration audio temporarily unavailable');
              stopAudio();
            }
            return;
          } finally {
            if (sessionRef.current.id === currentSessionId) {
              setLoading(false);
            }
          }
        }

        if (sessionRef.current.id !== currentSessionId || !sessionRef.current.active) {
          return;
        }

        const audio = new Audio(blobUrl);
        audioRef.current = audio;
        audio.playbackRate = toneConfig.rate;

        audio.onended = () => {
          if (
            sessionRef.current.id !== currentSessionId ||
            !sessionRef.current.active ||
            sessionRef.current.paused
          ) {
            return;
          }

          if (session.singleOnly) {
            stopAudio();
            return;
          }

          const nextIndex = index + 1;
          if (nextIndex < session.sentences.length) {
            // Natural human breath gap between sentences (200ms)
            timerRef.current = setTimeout(() => {
              playSentence(nextIndex);
            }, 200);
          } else {
            stopAudio();
          }
        };

        audio.onerror = () => {
          if (sessionRef.current.id === currentSessionId) {
            console.warn('Audio sentence playback error at index', index);
            stopAudio();
          }
        };

        try {
          await audio.play();
        } catch (err) {
          if (err.name !== 'AbortError' && sessionRef.current.id === currentSessionId) {
            setError('Playback was interrupted');
            stopAudio();
          }
        }
      };

      playAudioSentence();
    },
    [selectedTone, stopAudio]
  );

  const resumeAudio = useCallback(() => {
    sessionRef.current.paused = false;
    setPaused(false);

    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else if (
      typeof window !== 'undefined' &&
      window.speechSynthesis &&
      window.speechSynthesis.paused
    ) {
      window.speechSynthesis.resume();
    } else if (sessionRef.current.active) {
      playSentence(sessionRef.current.currentIndex);
    }
  }, [playSentence]);

  /**
   * Public speak entrypoint: handles toggle pause/resume or kicks off narration
   */
  const speak = useCallback(
    async (text, lang = 'en', specificSentenceIndex = null) => {
      // Toggle pause / resume if same language narration is active
      if (speaking && speakLang === lang && specificSentenceIndex === null) {
        if (paused) {
          resumeAudio();
        } else {
          pauseAudio();
        }
        return;
      }

      stopAudio();
      setError('');

      const clean = stripEmoji(text);
      if (!clean) return;

      const sentences = splitStorySentences(clean, lang);
      if (!sentences.length) return;

      const voiceOption = evaluateVoiceOption(lang);
      const nextSessionId = sessionRef.current.id + 1;

      sessionRef.current = {
        id: nextSessionId,
        active: true,
        paused: false,
        lang,
        sentences,
        currentIndex: specificSentenceIndex !== null ? specificSentenceIndex : 0,
        singleOnly: specificSentenceIndex !== null,
        mode: voiceOption.mode,
        voice: voiceOption.voice,
        audioCache: new Map(),
        prefetching: new Set()
      };

      const startIdx = specificSentenceIndex !== null ? specificSentenceIndex : 0;
      playSentence(startIdx);
    },
    [
      speaking,
      speakLang,
      paused,
      resumeAudio,
      pauseAudio,
      stopAudio,
      evaluateVoiceOption,
      playSentence
    ]
  );

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    speaking,
    paused,
    speakLang,
    loading,
    error,
    activeSentenceIndex,
    selectedTone,
    setSelectedTone,
    speak,
    pauseAudio,
    resumeAudio,
    stopAudio
  };
}

export default useTTS;
