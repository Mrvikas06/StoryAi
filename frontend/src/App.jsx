import { useState, useEffect, useRef } from 'react';
import './App.css';
import { generateStory as requestGenerateStory } from './api';
import { useTTS } from './hooks/useTTS';
import WordInput from './components/WordInput';
import StoryDisplay from './components/StoryDisplay';
import BackgroundDoodles from './components/BackgroundDoodles';

export default function App() {
  const [words, setWords] = useState(['', '', '']);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const storySectionRef = useRef(null);
  const {
    speaking,
    speakLang,
    loading: ttsLoading,
    speechRate,
    activeSentenceIndex,
    speak,
    stopAudio,
    toggleRate
  } = useTTS();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('story_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // ignore storage parse errors
    }
  }, []);

  useEffect(() => {
    if (story && storySectionRef.current) {
      setTimeout(() => {
        storySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [story]);

  const saveToHistory = (newStory) => {
    const updated = [newStory, ...history.filter((h) => h._id !== newStory._id)].slice(0, 20);
    setHistory(updated);
    try {
      localStorage.setItem('story_history', JSON.stringify(updated));
    } catch {
      // ignore quota errors
    }
  };

  const handleGenerateStory = async () => {
    const activeWords = words.map((w) => w.trim()).filter(Boolean);
    if (!activeWords.length) {
      setError('Please type or speak at least one magic word!');
      return;
    }

    setError('');
    setLoading(true);
    stopAudio();

    try {
      const result = await requestGenerateStory(activeWords, 'guest');
      setStory(result);
      saveToHistory(result);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Story generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewStory = () => {
    stopAudio();
    setWords(['', '', '']);
    setStory(null);
    setError('');
  };

  const handleSelectHistoryItem = (item) => {
    stopAudio();
    setStory(item);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    if (window.confirm('Delete all stories from your library?')) {
      stopAudio();
      setHistory([]);
      localStorage.removeItem('story_history');
    }
  };

  const handleDeleteHistoryItem = (e, index) => {
    e.stopPropagation();
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
    localStorage.setItem('story_history', JSON.stringify(updated));
    if (story && history[index]?._id === story._id) {
      setStory(null);
    }
  };

  return (
    <div className="app-shell">
      <BackgroundDoodles />
      {showHistory && (
        <div
          className="drawer-overlay"
          onClick={() => setShowHistory(false)}
          aria-hidden="true"
        />
      )}

      <header className="app-header">
        <div className="header-inner">
          <div className="brand-group">
            <span className="brand-icon">📖</span>
            <span className="brand-name">StoryAI</span>
            <span className="brand-tag">Magic Storybook</span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="drawer-toggle-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              📚 My Stories
              <span className="count-pill">{history.length}</span>
            </button>
          </div>
        </div>
      </header>

      <aside
        className={`history-drawer ${showHistory ? 'open' : ''}`}
        aria-label="Story library"
      >
        <div className="drawer-header">
          <div className="drawer-header-left">
            <h3 className="drawer-title">Story Library</h3>
            <span className="drawer-sub">{history.length} stories</span>
          </div>
          <div className="drawer-actions">
            {history.length > 0 && (
              <button
                type="button"
                className="btn-text-danger"
                onClick={handleClearHistory}
                title="Clear all stories"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              className="btn-icon-close"
              onClick={() => setShowHistory(false)}
              aria-label="Close library drawer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="drawer-content">
          {history.length === 0 ? (
            <div className="drawer-empty-state">
              <p className="empty-title">Your bookshelf is empty</p>
              <p className="empty-subtitle">
                Create a story to save it here and read or listen to it again!
              </p>
            </div>
          ) : (
            <ul className="history-list">
              {history.map((item, idx) => (
                <li
                  key={item._id || idx}
                  className={`history-item ${story?._id === item._id ? 'active' : ''}`}
                  onClick={() => handleSelectHistoryItem(item)}
                >
                  <div className="history-item-header">
                    <span className="item-title">{item.title || 'Untitled Story'}</span>
                    <button
                      type="button"
                      className="item-delete-btn"
                      onClick={(e) => handleDeleteHistoryItem(e, idx)}
                      title="Delete story"
                    >
                      ×
                    </button>
                  </div>
                  {item.words && item.words.length > 0 && (
                    <div className="item-tags">
                      {item.words.slice(0, 3).join(' · ')}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <main className="main-viewport">
        <div className="content-container">
          <WordInput
            words={words}
            setWords={setWords}
            onGenerate={handleGenerateStory}
            loading={loading}
            error={error}
            setError={setError}
          />

          <div ref={storySectionRef}>
            <StoryDisplay
              story={story}
              onNewStory={handleNewStory}
              onSpeak={speak}
              speaking={speaking}
              speakLang={speakLang}
              ttsLoading={ttsLoading}
              activeSentenceIndex={activeSentenceIndex}
              speechRate={speechRate}
              onToggleRate={toggleRate}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <p className="footer-copy">
            StoryAI — Joyful bilingual stories and read-along narration for young learners.
          </p>
        </div>
      </footer>
    </div>
  );
}
