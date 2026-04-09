import { useState, useRef } from 'react';

export default function useVoiceInput(onWords, onError) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      onError('Voice not supported. Please type!');
      return;
    }
    const r = new SR();
    r.lang = 'en-IN';
    r.continuous = false;
    r.interimResults = false;
    r.onstart  = () => setListening(true);
    r.onend    = () => setListening(false);
    r.onerror  = () => { setListening(false); onError('Could not hear. Please type!'); };
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const heard = transcript.split(/[\s,]+/).filter(Boolean).slice(0, 3);
      onWords(heard);
    };
    recRef.current = r;
    r.start();
  };

  const stopListening = () => {
    recRef.current?.stop();
    setListening(false);
  };

  return { listening, startListening, stopListening };
}