import { useState, useMemo } from 'react';
import { splitStorySentences } from '../hooks/useTTS';

export default function StoryDisplay({
  story,
  onNewStory,
  onSpeak,
  speaking,
  speakLang,
  ttsLoading,
  activeSentenceIndex,
  speechRate,
  onToggleRate
}) {
  const [activeTab, setActiveTab] = useState('bilingual'); // 'bilingual' | 'en' | 'hi'

  const englishSentences = useMemo(() => {
    return splitStorySentences(story?.english || '', 'en');
  }, [story?.english]);

  const hindiSentences = useMemo(() => {
    return splitStorySentences(story?.hindi || '', 'hi');
  }, [story?.hindi]);

  if (!story) return null;

  const isSpeakingEn = speaking && speakLang === 'en';
  const isSpeakingHi = speaking && speakLang === 'hi';

  return (
    <article className="kid-card storybook-card">
      {/* Story Header */}
      <header className="storybook-header">
        <div className="storybook-meta-left">
          <div className="hero-emoji-circle" title="Main Character">
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
          <div className="speed-toggle-control">
            <button
              type="button"
              className="kid-speed-btn"
              onClick={onToggleRate}
              title="Change reading speed"
            >
              {speechRate <= 0.9 ? '🐢 Gentle Speed' : '🐇 Normal Speed'}
            </button>
          </div>

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

      {/* Interactive Helper Banner */}
      <div className="kid-helper-tip">
        <span>💡 Tip: Tap the Listen button or tap any sentence to hear it read aloud!</span>
      </div>

      {/* Story Text Panes */}
      <div className={`storybook-panes layout-${activeTab}`}>
        {/* English Pane */}
        {(activeTab === 'bilingual' || activeTab === 'en') && (
          <section className="story-pane english-pane">
            <div className="pane-control-bar">
              <span className="pane-lang-title">🇬🇧 English Story</span>
              <button
                type="button"
                className={`kid-audio-btn ${isSpeakingEn ? 'playing' : ''}`}
                onClick={() => onSpeak(story.english || '', 'en')}
                disabled={ttsLoading && !isSpeakingEn}
              >
                <span className="audio-icon">{isSpeakingEn ? '⏸️' : '🔊'}</span>
                <span>
                  {ttsLoading && speakLang === 'en'
                    ? 'Loading Voice...'
                    : isSpeakingEn
                    ? 'Pause'
                    : 'Listen in English'}
                </span>
              </button>
            </div>

            <div className="story-sentences-container">
              {englishSentences.map((sentence, sIdx) => {
                const isHighlight = isSpeakingEn && activeSentenceIndex === sIdx;
                return (
                  <span
                    key={sIdx}
                    className={`read-sentence ${isHighlight ? 'active-reading' : ''}`}
                    onClick={() => onSpeak(story.english || '', 'en', sIdx)}
                    title="Click to hear this sentence"
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
              <span className="pane-lang-title">🇮🇳 हिंदी कहानी (Hindi)</span>
              <button
                type="button"
                className={`kid-audio-btn ${isSpeakingHi ? 'playing' : ''}`}
                onClick={() => onSpeak(story.hindi || '', 'hi')}
                disabled={ttsLoading && !isSpeakingHi}
              >
                <span className="audio-icon">{isSpeakingHi ? '⏸️' : '🔊'}</span>
                <span>
                  {ttsLoading && speakLang === 'hi'
                    ? 'आवाज़ लोड हो रही है...'
                    : isSpeakingHi
                    ? 'रोकें (Pause)'
                    : 'हिंदी में सुनें (Listen)'}
                </span>
              </button>
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
