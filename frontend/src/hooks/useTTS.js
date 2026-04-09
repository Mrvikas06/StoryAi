import { useState } from 'react';
import { speakText } from '../api';

export const useTTS = () => {
  const [speaking, setSpeaking] = useState(false);

  const speak = async (textOrStory) => {
    if (speaking) {
      setSpeaking(false);
      return;
    }

    let text = textOrStory;
    if (typeof textOrStory === 'object' && textOrStory.lines) {
      text = textOrStory.lines
        .map(l => `${l.en}. ${l.hi}`)
        .join('. ')
        + `. ${textOrStory.question?.en || ''}`;
    }

    if (!text) return;

    try {
      setSpeaking(true);
      const blob = await speakText(text, 'en');
      
      if (!blob || blob.size < 100) {
        throw new Error('Audio generation failed');
      }

      const url = URL.createObjectURL(blob);
      const audioEl = new Audio(url);
      
      audioEl.onplay = () => setSpeaking(true);
      audioEl.onend = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audioEl.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      
      await audioEl.play();
    } catch (err) {
      console.error('TTS error:', err);
      setSpeaking(false);
    }
  };

  const stop = () => {
    setSpeaking(false);
  };

  return { speaking, speak, stop };
};
