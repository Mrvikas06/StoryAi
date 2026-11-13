import useVoiceInput from '../hooks/useVoiceInput';

const QUICK_SUGGESTIONS = [
  ['Dragon', 'Compass', 'Mountain'],
  ['Garden', 'River', 'Friendship'],
  ['Astronaut', 'Star', 'Secret'],
  ['Kitten', 'Lantern', 'Courage']
];

export default function WordInput({
  words,
  setWords,
  onGenerate,
  loading,
  error,
  setError
}) {
  const updateWord = (index, value) => {
    const updated = [...words];
    updated[index] = value;
    setWords(updated);
    if (error && setError) setError('');
  };

  const handleVoiceWords = (heard) => {
    const newWords = [...words];
    heard.forEach((word, i) => {
      if (i < 3) newWords[i] = word;
    });
    setWords(newWords);
    if (setError) setError('');
  };

  const { listening, isSupported, startListening, stopListening } = useVoiceInput(
    handleVoiceWords,
    (msg) => {
      if (setError) setError(msg);
    }
  );

  const applySuggestion = (suggestion) => {
    setWords(suggestion);
    if (setError) setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <section className="input-card">
      <div className="card-header-row">
        <div>
          <h2 className="card-title">Story Prompt Words</h2>
          <p className="card-description">
            Enter up to three words or speak into your microphone to generate a custom bilingual story.
          </p>
        </div>

        {isSupported && (
          <button
            type="button"
            className={`btn-voice ${listening ? 'listening' : ''}`}
            onClick={listening ? stopListening : () => startListening('en-US')}
            title={listening ? 'Stop listening' : 'Speak prompt words'}
          >
            <span className="voice-indicator"></span>
            {listening ? 'Listening...' : 'Voice Input'}
          </button>
        )}
      </div>

      <div className="word-inputs-grid">
        {words.map((word, i) => (
          <div key={i} className="input-field-group">
            <label htmlFor={`word-input-${i}`} className="field-label">
              Word {i + 1}
            </label>
            <input
              id={`word-input-${i}`}
              type="text"
              className="text-input"
              placeholder={['e.g. Brave', 'e.g. River', 'e.g. Lantern'][i]}
              value={word}
              maxLength={24}
              onChange={(e) => updateWord(i, e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        ))}
      </div>

      <div className="suggestion-row">
        <span className="suggestion-label">Try ideas:</span>
        <div className="suggestion-chips">
          {QUICK_SUGGESTIONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-btn"
              onClick={() => applySuggestion(preset)}
            >
              {preset.join(' · ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="action-row">
        <button
          type="button"
          className="btn-primary"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Generating Narrative...
            </>
          ) : (
            'Generate Story'
          )}
        </button>
      </div>
    </section>
  );
}
