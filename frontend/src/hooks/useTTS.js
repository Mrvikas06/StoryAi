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

export function splitStorySentences(text, lang = 'en') {
  if (!text) return [];
  const delimiter = lang === 'hi' ? /[^।!?]+[।!?]+|[^।!?]+$/g : /[^.!?]+[.!?]+|[^.!?]+$/g;
  const matches = text.match(delimiter);
  if (!matches) return [text];
  return matches.map((s) => s.trim()).filter(Boolean);
}

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [speakLang, setSpeakLang] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speechRate, setSpeechRate] = useState(0.9); // 0.85 for slow kid mode, 1.0 for normal
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);

  const audioRef = useRef(null);
  const cancelFlagRef = useRef(false);

  const stopAudio = useCallback(() => {
    cancelFlagRef.current = true;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore audio pause errors
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore speech cancel error
      }
    }
    setSpeaking(false);
    setSpeakLang('');
    setLoading(false);
    setActiveSentenceIndex(-1);
  }, []);

  const speakWithBrowserSentenceBySentence = useCallback(
    async (sentences, lang, startIndex = 0) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        throw new Error('Browser speech is not available on this device');
      }

      const synth = window.speechSynthesis;
      const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';

      const getBestVoice = () => {
        const voices = synth.getVoices() || [];
        if (!voices.length) return null;
        // Look for gentle, natural voices
        const match =
          voices.find((v) => v.lang === targetLang && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira'))) ||
          voices.find((v) => v.lang === targetLang) ||
          voices.find((v) => v.lang.startsWith(targetLang.split('-')[0])) ||
          voices[0];
        return match;
      };

      cancelFlagRef.current = false;
      setSpeaking(true);
      setSpeakLang(lang);
      setLoading(false);

      for (let i = startIndex; i < sentences.length; i++) {
        if (cancelFlagRef.current) break;
        setActiveSentenceIndex(i);

        const cleanSentence = stripEmoji(sentences[i]);
        if (!cleanSentence) continue;

        await new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(cleanSentence);
          utterance.lang = targetLang;
          utterance.rate = speechRate;
          utterance.pitch = 1.05; // Slightly warmer, friendlier pitch for children

          const voice = getBestVoice();
          if (voice) utterance.voice = voice;

          utterance.onend = () => {
            resolve();
          };

          utterance.onerror = () => {
            resolve();
          };

          synth.speak(utterance);
        });

        // Small joyful breathing pause between sentences (200ms)
        await new Promise((r) => setTimeout(r, 200));
      }

      if (!cancelFlagRef.current) {
        stopAudio();
      }
    },
    [speechRate, stopAudio]
  );

  const speak = useCallback(
    async (text, lang = 'en', specificSentenceIndex = null) => {
      if (speaking && speakLang === lang && specificSentenceIndex === null) {
        stopAudio();
        return;
      }

      stopAudio();
      setLoading(true);
      setSpeakLang(lang);
      setError('');
      cancelFlagRef.current = false;

      const clean = stripEmoji(text);
      if (!clean) {
        setLoading(false);
        return;
      }

      const sentences = splitStorySentences(text, lang);
      const startIdx = specificSentenceIndex !== null ? specificSentenceIndex : 0;

      // 1. Try server-side audio first if wanting full continuous narration
      if (specificSentenceIndex === null) {
        try {
          const blob = await speakText(clean, lang);
          if (blob && blob.size > 200) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.playbackRate = speechRate;

            audio.onplay = () => {
              setSpeaking(true);
              setLoading(false);
            };

            audio.onended = () => {
              stopAudio();
              URL.revokeObjectURL(url);
            };

            audio.onerror = () => {
              // Fallback to browser read-along engine if audio tag fails
              URL.revokeObjectURL(url);
              speakWithBrowserSentenceBySentence(sentences, lang, startIdx);
            };

            await audio.play();
            return;
          }
        } catch {
          // If server audio network is offline, seamlessly switch to browser speech synthesis
        }
      }

      // 2. Interactive sentence-by-sentence read-along narration
      try {
        await speakWithBrowserSentenceBySentence(sentences, lang, startIdx);
      } catch (browserErr) {
        setError(browserErr.message || 'Speech playback failed. Please check sound settings.');
        stopAudio();
      }
    },
    [speakLang, speakWithBrowserSentenceBySentence, speaking, speechRate, stopAudio]
  );

  const toggleRate = useCallback(() => {
    setSpeechRate((prev) => (prev <= 0.9 ? 1.0 : 0.85));
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    speaking,
    speakLang,
    loading,
    error,
    speechRate,
    activeSentenceIndex,
    speak,
    stopAudio,
    toggleRate
  };
}

export default useTTS;
