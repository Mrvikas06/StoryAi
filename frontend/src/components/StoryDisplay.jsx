import { useState } from 'react';

export default function StoryDisplay({
  story,
  onNewStory,
  onSpeak,
  speaking,
  speakLang,
  ttsLoading
}) {
  const [activeTab, setActiveTab] = useState('bilingual'); // 'bilingual' | 'en' | 'hi'

  if (!story) return null;

  const isSpeakingEn = speaking && speakLang === 'en';
  const isSpeakingHi = speaking && speakLang === 'hi';
  const isEnLoading = ttsLoading && speakLang === 'en';
  const isHiLoading = ttsLoading && speakLang === 'hi';

  return (
    <article className="story-card">
      <header className="story-header-bar">
        <div className="story-meta-col">
          <div className="story-tag-row">
            {story.skillType && (
              <span className="meta-badge badge-category">{story.skillType}</span>
            )}
            {story.skill && (
              <span className="meta-badge badge-skill">{story.skill}</span>
            )}
            {Array.isArray(story.words) && story.words.length > 0 && (
              <span className="meta-badge badge-words">
                {story.words.join(' · ')}
              </span>
            )}
          </div>
          <h2 className="story-display-title">
            {story.title}
          </h2>
        </div>

        <div className="story-header-actions">
          <div className="view-toggle" role="tablist" aria-label="Language view mode">
            <button
              type="button"
              className={`toggle-tab ${activeTab === 'bilingual' ? 'active' : ''}`}
              onClick={() => setActiveTab('bilingual')}
            >
              Side by Side
            </button>
            <button
              type="button"
              className={`toggle-tab ${activeTab === 'en' ? 'active' : ''}`}
              onClick={() => setActiveTab('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`toggle-tab ${activeTab === 'hi' ? 'active' : ''}`}
              onClick={() => setActiveTab('hi')}
            >
              हिंदी
            </button>
          </div>

          <button
            type="button"
            className="btn-outline-sm"
            onClick={onNewStory}
          >
            New Story
          </button>
        </div>
      </header>

      <div className={`story-content-layout layout-${activeTab}`}>
        {(activeTab === 'bilingual' || activeTab === 'en') && (
          <section className="story-text-pane en-pane">
            <div className="pane-header">
              <span className="pane-lang-label">English</span>
              <button
                type="button"
                className={`audio-btn ${isSpeakingEn ? 'playing' : ''}`}
                onClick={() => onSpeak(story.english || '', 'en')}
                disabled={ttsLoading && !isSpeakingEn}
              >
                <span className={`audio-dot ${isSpeakingEn ? 'pulse' : ''}`}></span>
                {isEnLoading ? 'Loading Audio...' : isSpeakingEn ? 'Pause Narration' : 'Read Aloud'}
              </button>
            </div>
            <p className="narrative-body en-text">
              {story.english}
            </p>
          </section>
        )}

        {(activeTab === 'bilingual' || activeTab === 'hi') && (
          <section className="story-text-pane hi-pane">
            <div className="pane-header">
              <span className="pane-lang-label">हिंदी अनुवाद (Hindi)</span>
              <button
                type="button"
                className={`audio-btn ${isSpeakingHi ? 'playing' : ''}`}
                onClick={() => onSpeak(story.hindi || '', 'hi')}
                disabled={ttsLoading && !isSpeakingHi}
              >
                <span className={`audio-dot ${isSpeakingHi ? 'pulse' : ''}`}></span>
                {isHiLoading ? 'लोड हो रहा है...' : isSpeakingHi ? 'रोकें' : 'सुनें (Listen)'}
              </button>
            </div>
            <p className="narrative-body hi-text">
              {story.hindi}
            </p>
          </section>
        )}
      </div>

      {(story.question?.en || story.question?.hi) && (
        <aside className="reflection-card">
          <h3 className="reflection-title">Reflection Question</h3>
          {story.question?.en && (
            <p className="reflection-text en">{story.question.en}</p>
          )}
          {story.question?.hi && (
            <p className="reflection-text hi">{story.question.hi}</p>
          )}
        </aside>
      )}
    </article>
  );
}
