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

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [speakLang, setSpeakLang] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const audioRef = useRef(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore audio stop error
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
  }, []);

  const speakWithBrowser = useCallback((text, lang) => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        return reject(new Error('Browser speech synthesis is not supported'));
      }

      const synth = window.speechSynthesis;
      const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      let hasFallenBack = false;

      const setVoice = () => {
        const voices = synth.getVoices() || [];
        if (!voices.length) return false;
        const exact = voices.find((v) => v.lang === targetLang);
        const prefix = voices.find((v) => v.lang && v.lang.startsWith(targetLang.split('-')[0]));
        utterance.voice = exact || prefix || voices[0] || null;
        return true;
      };

      const executeSpeak = () => {
        utterance.onstart = () => {
          setSpeaking(true);
          setSpeakLang(lang);
          setLoading(false);
        };

        utterance.onend = () => {
          setSpeaking(false);
          setSpeakLang('');
          setLoading(false);
          resolve();
        };

        utterance.onerror = (ev) => {
          if (!hasFallenBack) {
            hasFallenBack = true;
            utterance.lang = 'en-US';
            const voices = synth.getVoices() || [];
            utterance.voice = voices[0] || null;
            synth.cancel();
            synth.speak(utterance);
            return;
          }
          stopAudio();
          reject(new Error(`Browser speech error: ${ev.error || 'unknown'}`));
        };

        try {
          synth.cancel();
          synth.speak(utterance);
        } catch (err) {
          stopAudio();
          reject(err);
        }
      };

      if (setVoice()) {
        executeSpeak();
      } else {
        const handleVoices = () => {
          if (setVoice()) {
            synth.removeEventListener('voiceschanged', handleVoices);
            executeSpeak();
          }
        };
        synth.addEventListener('voiceschanged', handleVoices);
        setTimeout(() => {
          synth.removeEventListener('voiceschanged', handleVoices);
          setVoice();
          executeSpeak();
        }, 500);
      }
    });
  }, [stopAudio]);

  const speak = useCallback(async (text, lang = 'en') => {
    if (speaking && speakLang === lang) {
      stopAudio();
      return;
    }

    stopAudio();
    setLoading(true);
    setSpeakLang(lang);
    setError('');

    const clean = stripEmoji(text);
    if (!clean) {
      setLoading(false);
      return;
    }

    try {
      // 1. Attempt server-side neural TTS
      const blob = await speakText(clean, lang);
      if (!blob || blob.size < 50) {
        throw new Error('Server audio payload unavailable');
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setSpeaking(true);
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
    } catch {
      // 2. Fall back seamlessly to browser SpeechSynthesis
      try {
        await speakWithBrowser(clean, lang);
      } catch (browserErr) {
        setError(browserErr.message || 'Speech playback failed');
        stopAudio();
      }
    }
  }, [speakLang, speakWithBrowser, speaking, stopAudio]);

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
    speak,
    stopAudio
  };
}

export default useTTS;
