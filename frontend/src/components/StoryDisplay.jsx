import { useState, useMemo, useRef, useEffect } from 'react';
import { splitStorySentences, STORYTELLER_TONES } from '../hooks/useTTS';

export default function StoryDisplay({
  story,
  onNewStory,
  onSpeak,
  speaking,
  paused,
  speakLang,
  ttsLoading,
  activeSentenceIndex,
  selectedTone,
  onSelectTone,
  onStopAudio
}) {
  const [activeTab, setActiveTab] = useState('bilingual'); // 'bilingual' | 'en' | 'hi'
  const cardRef = useRef(null);

  const englishSentences = useMemo(() => {
    return splitStorySentences(story?.english || '', 'en');
  }, [story?.english]);

  const hindiSentences = useMemo(() => {
    return splitStorySentences(story?.hindi || '', 'hi');
  }, [story?.hindi]);

  // Smoothly keep the active narrated sentence in view
  useEffect(() => {
    if (activeSentenceIndex >= 0 && cardRef.current) {
      const activeEl = cardRef.current.querySelector('.read-sentence.active-reading');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [activeSentenceIndex]);

  if (!story) return null;

  const isSpeakingEn = speaking && speakLang === 'en';
  const isSpeakingHi = speaking && speakLang === 'hi';

  return (
    <article className="kid-card storybook-card" ref={cardRef}>
      {/* Story Header */}
      <header className="storybook-header">
        <div className="storybook-meta-left">
          <div className="hero-emoji-circle" title="Story Character">
            {story.emoji || '🌟'}
          </div>

          <div className="meta-text-block">
            <div className="meta-pills-row">
              {story.skillType && (
                <span className="kid-badge badge-skill-type">
                  ⭐ {story.skillType}
                </span>
              )}
              {story.skill && (
                <span className="kid-badge badge-skill-name">
                  🌱 {story.skill}
                </span>
              )}
            </div>
            <h2 className="storybook-title">{story.title}</h2>
          </div>
        </div>

        <div className="storybook-header-controls">
          <div className="view-mode-tabs" role="tablist">
            <button
              type="button"
              className={`mode-tab ${activeTab === 'bilingual' ? 'active' : ''}`}
              onClick={() => setActiveTab('bilingual')}
            >
              📖 Both
            </button>
            <button
              type="button"
              className={`mode-tab ${activeTab === 'en' ? 'active' : ''}`}
              onClick={() => setActiveTab('en')}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              className={`mode-tab ${activeTab === 'hi' ? 'active' : ''}`}
              onClick={() => setActiveTab('hi')}
            >
              🇮🇳 हिंदी
            </button>
          </div>

          <button
            type="button"
            className="kid-btn-secondary"
            onClick={onNewStory}
          >
            ✨ New Story
          </button>
        </div>
      </header>

      {/* Storyteller Voice Tone Bar */}
      <div className="storyteller-bar">
        <div className="tone-label-group">
          <span className="tone-bar-title">🎙️ Storyteller Voice:</span>
        </div>
        <div className="tone-chips-group">
          {Object.values(STORYTELLER_TONES).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tone-pill-btn ${selectedTone === t.id ? 'active' : ''}`}
              onClick={() => onSelectTone && onSelectTone(t.id)}
              title={t.description}
            >
              <span className="tone-emoji">{t.emoji}</span>
              <span className="tone-name">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Helper Banner */}
      <div className="kid-helper-tip">
        <span>💡 Tap "Listen" to hear natural storytelling, or tap any sentence to practice reading it!</span>
      </div>

      {/* Story Text Panes */}
      <div className={`storybook-panes layout-${activeTab}`}>
        {/* English Pane */}
        {(activeTab === 'bilingual' || activeTab === 'en') && (
          <section className="story-pane english-pane">
            <div className="pane-control-bar">
              <div className="pane-title-group">
                <span className="pane-lang-title">🇬🇧 English Story</span>
                {isSpeakingEn && activeSentenceIndex >= 0 && (
                  <span className="reading-progress-pill">
                    ⭐ Sentence {activeSentenceIndex + 1} of {englishSentences.length}
                  </span>
                )}
              </div>
              <div className="audio-actions-group">
                <button
                  type="button"
                  className={`kid-audio-btn ${isSpeakingEn ? 'playing' : ''}`}
                  onClick={() => onSpeak(story.english || '', 'en')}
                  disabled={ttsLoading && !isSpeakingEn}
                >
                  <span className="audio-icon">{isSpeakingEn ? (paused ? '▶️' : '⏸️') : '🔊'}</span>
                  <span>
                    {ttsLoading && speakLang === 'en'
                      ? 'Starting Voice...'
                      : isSpeakingEn
                      ? (paused ? 'Resume' : 'Pause')
                      : 'Listen in English'}
                  </span>
                  {isSpeakingEn && !paused && (
                    <span className="sound-wave-bars">
                      <span className="bar b1"></span>
                      <span className="bar b2"></span>
                      <span className="bar b3"></span>
                    </span>
                  )}
                </button>

                {isSpeakingEn && (
                  <button
                    type="button"
                    className="kid-stop-btn"
                    onClick={onStopAudio}
                    title="Stop audio"
                  >
                    ⏹️ Stop
                  </button>
                )}
              </div>
            </div>

            <div className="story-sentences-container">
              {englishSentences.map((sentence, sIdx) => {
                const isHighlight = isSpeakingEn && activeSentenceIndex === sIdx;
                return (
                  <span
                    key={sIdx}
                    className={`read-sentence ${isHighlight ? 'active-reading' : ''}`}
                    onClick={() => onSpeak(story.english || '', 'en', sIdx)}
                    title="Tap to hear this sentence"
                  >
                    {sentence}{' '}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Hindi Pane */}
        {(activeTab === 'bilingual' || activeTab === 'hi') && (
          <section className="story-pane hindi-pane">
            <div className="pane-control-bar">
              <div className="pane-title-group">
                <span className="pane-lang-title">🇮🇳 हिंदी कहानी (Hindi)</span>
                {isSpeakingHi && activeSentenceIndex >= 0 && (
                  <span className="reading-progress-pill">
                    ⭐ वाक्य {activeSentenceIndex + 1} / {hindiSentences.length}
                  </span>
                )}
              </div>
              <div className="audio-actions-group">
                <button
                  type="button"
                  className={`kid-audio-btn ${isSpeakingHi ? 'playing' : ''}`}
                  onClick={() => onSpeak(story.hindi || '', 'hi')}
                  disabled={ttsLoading && !isSpeakingHi}
                >
                  <span className="audio-icon">{isSpeakingHi ? (paused ? '▶️' : '⏸️') : '🔊'}</span>
                  <span>
                    {ttsLoading && speakLang === 'hi'
                      ? 'आवाज़ शुरू हो रही है...'
                      : isSpeakingHi
                      ? (paused ? 'पुनः शुरू करें' : 'रोकें')
                      : 'हिंदी में सुनें (Listen)'}
                  </span>
                  {isSpeakingHi && !paused && (
                    <span className="sound-wave-bars">
                      <span className="bar b1"></span>
                      <span className="bar b2"></span>
                      <span className="bar b3"></span>
                    </span>
                  )}
                </button>

                {isSpeakingHi && (
                  <button
                    type="button"
                    className="kid-stop-btn"
                    onClick={onStopAudio}
                    title="Stop audio"
                  >
                    ⏹️ Stop
                  </button>
                )}
              </div>
            </div>

            <div className="story-sentences-container hindi-text">
              {hindiSentences.map((sentence, sIdx) => {
                const isHighlight = isSpeakingHi && activeSentenceIndex === sIdx;
                return (
                  <span
                    key={sIdx}
                    className={`read-sentence ${isHighlight ? 'active-reading' : ''}`}
                    onClick={() => onSpeak(story.hindi || '', 'hi', sIdx)}
                    title="इस वाक्य को सुनने के लिए क्लिक करें"
                  >
                    {sentence}{' '}
                  </span>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Reflection Question Box */}
      {(story.question?.en || story.question?.hi) && (
        <aside className="kid-reflection-card">
          <div className="reflection-header">
            <span className="reflection-emoji">💭</span>
            <h3 className="reflection-heading">Think & Share</h3>
          </div>
          {story.question?.en && (
            <p className="question-text english-question">
              👉 {story.question.en}
            </p>
          )}
          {story.question?.hi && (
            <p className="question-text hindi-question">
              👉 {story.question.hi}
            </p>
          )}
        </aside>
      )}
    </article>
  );
}
