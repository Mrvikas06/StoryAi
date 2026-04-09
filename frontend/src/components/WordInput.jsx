import { useState } from 'react';
import useVoiceInput from '../hooks/useVoiceInput';

export default function WordInput({ onGenerate, loading }) {
  const [words, setWords] = useState(['', '', '']);
  const [error, setError] = useState('');

  const update = (i, val) => {
    const w = [...words]; w[i] = val; setWords(w);
  };

  const handleVoiceWords = (heard) => {
    const newWords = ['', '', ''];
    heard.forEach((w, i) => { newWords[i] = w; });
    setWords(newWords);
    setError('');
  };

  const { listening, startListening } = useVoiceInput(
    handleVoiceWords,
    (msg) => setError(msg)
  );

  const handleGenerate = () => {
    const filtered = words.filter(w => w.trim());
    if (!filtered.length) {
      setError('Please enter at least one word!');
      return;
    }
    setError('');
    onGenerate(filtered);
  };

  return (
    <div className="input-card">
      <p className="input-label">✨ Enter your magic words</p>

      <div className="word-row">
        {words.map((w, i) => (
          <input key={i}
            className="word-input"
            placeholder={['Word 1 ✨', 'Word 2 🌈', 'Word 3 (optional)'][i]}
            value={w}
            maxLength={20}
            onChange={e => update(i, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
        ))}
      </div>

      <div className="btn-row">
        <button
          className="btn-generate"
          disabled={loading}
          onClick={handleGenerate}>
          {loading ? '✨ Writing...' : ' Make My Story!'}
        </button>

        <button
          className={`btn-voice ${listening ? 'listening' : ''}`}
          onClick={startListening}
          title="Speak your words">
          {listening ? '⏹' : '🎙️'}
        </button>
      </div>

      {error && (
        <div className="error-msg">⚠️ {error}</div>
      )}

      {listening && (
        <div className="listening-msg">🎙️ Listening... say your words!</div>
      )}
    </div>
  );
}