import { useState, useRef, useEffect, useCallback } from 'react';

export default function useVoiceInput(onWords, onError) {
  const [listening, setListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        // ignore already stopped recognition
      }
    }
    setListening(false);
  }, []);

  const startListening = useCallback((lang = 'en-US') => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (recRef.current) {
        recRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (event) => {
        setListening(false);
        if (event.error === 'no-speech') {
          if (onError) onError('No speech detected. Please try speaking again.');
        } else if (event.error === 'not-allowed') {
          if (onError) onError('Microphone access was denied. Check browser permissions.');
        } else if (onError) {
          onError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        const parsedWords = transcript
          .replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3);

        if (parsedWords.length > 0 && onWords) {
          onWords(parsedWords);
        }
      };

      recRef.current = recognition;
      recognition.start();
    } catch (err) {
      setListening(false);
      if (onError) onError(err.message || 'Unable to start microphone.');
    }
  }, [onError, onWords]);

  useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.abort();
        } catch {
          // ignore cleanup abort
        }
      }
    };
  }, []);

  return {
    listening,
    isSupported,
    startListening,
    stopListening
  };
}
