import useVoiceInput from '../hooks/useVoiceInput';

const THEME_IDEAS = [
  { icon: '🦁', label: 'Playful Animals', words: ['Puppy', 'Rainbow', 'Picnic'] },
  { icon: '🚀', label: 'Space Quest', words: ['Rocket', 'Star', 'Moon'] },
  { icon: '🏰', label: 'Magic Kingdom', words: ['Dragon', 'Castle', 'Wand'] },
  { icon: '🌊', label: 'Ocean Voyage', words: ['Dolphin', 'Shell', 'Island'] },
  { icon: '🌲', label: 'Forest Friends', words: ['Squirrel', 'Acorn', 'Treehouse'] }
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

  const applyTheme = (themeWords) => {
    setWords(themeWords);
    if (setError) setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <section className="kid-card input-card">
      <div className="card-top-header">
        <div className="title-area">
          <span className="card-icon-badge">✨</span>
          <div>
            <h2 className="kid-title">What is your story about?</h2>
            <p className="kid-subtitle">
              Type or speak up to 3 fun words, or pick an adventure pack below!
            </p>
          </div>
        </div>

        {isSupported && (
          <button
            type="button"
            className={`kid-btn-voice ${listening ? 'listening' : ''}`}
            onClick={listening ? stopListening : () => startListening('en-US')}
            title={listening ? 'Click to stop' : 'Click to speak your words'}
          >
            <span className="mic-icon">{listening ? '⏹' : '🎤'}</span>
            <span>{listening ? 'Listening...' : 'Speak Words'}</span>
          </button>
        )}
      </div>

      <div className="kid-words-grid">
        {words.map((word, i) => (
          <div key={i} className="kid-input-wrapper">
            <span className="input-number-tag">{['🌟 Word 1', '🎈 Word 2', '🎨 Word 3'][i]}</span>
            <input
              id={`word-input-${i}`}
              type="text"
              className="kid-text-input"
              placeholder={['e.g. Bear', 'e.g. Lantern', 'e.g. Garden'][i]}
              value={word}
              maxLength={24}
              onChange={(e) => updateWord(i, e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        ))}
      </div>

      <div className="theme-packs-section">
        <span className="theme-heading">Quick Adventure Packs:</span>
        <div className="theme-chips-list">
          {THEME_IDEAS.map((theme, idx) => (
            <button
              key={idx}
              type="button"
              className="theme-chip-btn"
              onClick={() => applyTheme(theme.words)}
            >
              <span className="chip-emoji">{theme.icon}</span>
              <span className="chip-name">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="kid-alert-box" role="alert">
          <span className="alert-emoji">💡</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card-bottom-actions">
        <button
          type="button"
          className="kid-btn-generate"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="kid-spinner"></span>
              <span>Weaving Your Story...</span>
            </>
          ) : (
            <>
              <span className="sparkle-icon">📖</span>
              <span>Create My Storybook!</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
