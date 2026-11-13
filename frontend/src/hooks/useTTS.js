import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

export function splitStorySentences(text, lang = 'en') {
  if (!text) return [];
  const delimiter = lang === 'hi' ? /[^।!?]+[।!?]+|[^।!?]+$/g : /[^.!?]+[.!?]+|[^.!?]+$/g;
  const matches = text.match(delimiter);
  if (!matches) return [text];
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
    rate: 0.96,
    description: 'Upbeat, cheerful, engaging adventure tone'
  },
  bedtime: {
    id: 'bedtime',
    label: 'Calm Bedtime',
    emoji: '🌙',
    pitch: 0.97,
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

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore audio pause
      }
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
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPaused(true);
      return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setPaused(false);
      return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, []);

  /**
   * Find the most expressive, natural storytelling voice
   */
  const pickBestStoryVoice = useCallback(
    (lang = 'en') => {
      const voices = availableVoices.length > 0
        ? availableVoices
        : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);

      if (!voices || !voices.length) return null;

      if (lang === 'hi') {
        // 1. Natural / Neural Hindi
        const naturalHi = voices.find(
          (v) => (v.lang === 'hi-IN' || v.lang === 'hi') && (v.name.includes('Natural') || v.name.includes('Online'))
        );
        if (naturalHi) return naturalHi;

        // 2. Google / Lekha / Swara
        const namedHi = voices.find(
          (v) => (v.lang === 'hi-IN' || v.lang === 'hi') && (v.name.includes('Google') || v.name.includes('Lekha') || v.name.includes('Swara') || v.name.includes('Madhur'))
        );
        if (namedHi) return namedHi;

        // 3. Any Hindi voice
        const anyHi = voices.find((v) => v.lang.startsWith('hi'));
        if (anyHi) return anyHi;
      }

      // English Voice Selection:
      // Priority 1: Microsoft Natural storytelling voices (Jenny, Aria, Christopher, Steffan, Guy)
      const naturalEn = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online')) && (v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Christopher') || v.name.includes('Guy'))
      );
      if (naturalEn) return naturalEn;

      // Priority 2: Any Natural/Neural English voice
      const anyNaturalEn = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural'))
      );
      if (anyNaturalEn) return anyNaturalEn;

      // Priority 3: Google Human-grade Voices (UK English Female, US English)
      const googleEn = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google UK English Female') || v.name.includes('Google US'))
      );
      if (googleEn) return googleEn;

      // Priority 4: Apple / macOS Storytelling voices (Samantha, Victoria)
      const appleEn = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Victoria'))
      );
      if (appleEn) return appleEn;

      // Priority 5: Any non-David English voice
      const friendlyEn = voices.find(
        (v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('david')
      );
      if (friendlyEn) return friendlyEn;

      return voices.find((v) => v.lang.startsWith('en')) || voices[0];
    },
    [availableVoices]
  );

  /**
   * Speak with seamless continuous prosody and real-time sentence tracking
   */
  const speakNatural = useCallback(
    (text, lang = 'en', specificSentenceIdx = null) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        throw new Error('Browser speech is not available on this device');
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const toneConfig = STORYTELLER_TONES[selectedTone] || STORYTELLER_TONES.gentle;
      const allSentences = splitStorySentences(text, lang);

      const targetText =
        specificSentenceIdx !== null && allSentences[specificSentenceIdx]
          ? allSentences[specificSentenceIdx]
          : text;

      const cleanText = stripEmoji(targetText);
      const utterance = new SpeechSynthesisUtterance(cleanText);

      const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
      utterance.lang = targetLang;
      utterance.rate = toneConfig.rate;
      utterance.pitch = toneConfig.pitch;

      const voice = pickBestStoryVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      // Pre-calculate sentence character offset ranges for boundary matching
      const sentenceRanges = [];
      let runningOffset = 0;
      allSentences.forEach((s) => {
        const cleanS = stripEmoji(s);
        const idx = cleanText.indexOf(cleanS, runningOffset);
        if (idx !== -1) {
          sentenceRanges.push({ start: idx, end: idx + cleanS.length });
          runningOffset = idx + cleanS.length;
        } else {
          sentenceRanges.push({ start: runningOffset, end: runningOffset + cleanS.length });
          runningOffset += cleanS.length;
        }
      });

      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
        setSpeakLang(lang);
        setLoading(false);
        setActiveSentenceIndex(specificSentenceIdx !== null ? specificSentenceIdx : 0);
      };

      utterance.onboundary = (event) => {
        if (specificSentenceIdx !== null) return;
        const charIdx = event.charIndex;
        if (typeof charIdx === 'number') {
          const matchIdx = sentenceRanges.findIndex(
            (r) => charIdx >= r.start && charIdx <= r.end
          );
          if (matchIdx !== -1) {
            setActiveSentenceIndex(matchIdx);
          }
        }
      };

      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        setActiveSentenceIndex(-1);
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          setError(`Narration error: ${e.error || 'speech failed'}`);
        }
        setSpeaking(false);
        setPaused(false);
        setActiveSentenceIndex(-1);
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [selectedTone, pickBestStoryVoice]
  );

  const speak = useCallback(
    async (text, lang = 'en', specificSentenceIndex = null) => {
      // Toggle pause/resume if already speaking same language
      if (speaking && speakLang === lang && specificSentenceIndex === null) {
        if (paused) {
          resumeAudio();
        } else {
          pauseAudio();
        }
        return;
      }

      stopAudio();
      setLoading(true);
      setError('');

      const clean = stripEmoji(text);
      if (!clean) {
        setLoading(false);
        return;
      }

      // 1. Natural client-side neural speech synthesis (Best human storytelling prosody)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          speakNatural(clean, lang, specificSentenceIndex);
          return;
        } catch {
          // Fall through to server audio stream
        }
      }

      // 2. Server audio fallback
      try {
        const blob = await speakText(clean, lang);
        if (blob && blob.size > 200) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          const toneConfig = STORYTELLER_TONES[selectedTone] || STORYTELLER_TONES.gentle;
          audio.playbackRate = toneConfig.rate;

          audio.onplay = () => {
            setSpeaking(true);
            setPaused(false);
            setSpeakLang(lang);
            setLoading(false);
          };

          audio.onended = () => {
            stopAudio();
            URL.revokeObjectURL(url);
          };

          audio.onerror = () => {
            stopAudio();
            URL.revokeObjectURL(url);
          };

          await audio.play();
          return;
        }
      } catch (err) {
        setError(err.message || 'Audio playback unavailable');
        stopAudio();
      }
    },
    [speaking, speakLang, paused, resumeAudio, pauseAudio, stopAudio, speakNatural, selectedTone]
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
