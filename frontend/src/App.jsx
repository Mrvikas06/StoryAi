import { useState, useRef, useEffect } from 'react';
import './App.css';
import { getApiUrl, speakText } from './api.js';

function stripEmoji(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function App() {
  const [words, setWords] = useState(['', '', '']);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [speakLang, setSpeakLang] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);

  const storyRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const h = localStorage.getItem('story_history');
    if (h) {
      try { setHistory(JSON.parse(h)); } catch { /* ignore parse errors */ }
    }
  }, []);

  useEffect(() => {
    if (story && storyRef.current) {
      setTimeout(() => {
        storyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [story]);

  const update = (i, val) => {
    const w = [...words];
    w[i] = val;
    setWords(w);
  };

  const saveToHistory = (s) => {
    const updated = [s, ...history].slice(0, 15);
    setHistory(updated);
    localStorage.setItem('story_history', JSON.stringify(updated));
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setSpeakLang('');
    setTtsLoading(false);
  };

  const speakWithBrowser = (text, lang) => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Browser speech synthesis is not available'));
        return;
      }

      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = lang === 'hi-IN' ? 'hi-IN' : 'en-US';
      utterance.lang = targetLang;
      utterance.rate = 0.95;
      utterance.pitch = 1;

      let triedFallback = false;

      const selectVoice = () => {
        const voices = synth.getVoices() || [];
        if (!voices.length) return false;
        // prefer exact language match, then prefix match, then first available
        const exact = voices.find(v => v.lang === targetLang);
        const prefix = voices.find(v => v.lang && v.lang.startsWith(targetLang.split('-')[0]));
        utterance.voice = exact || prefix || voices[0] || null;
        return true;
      };

      const startSpeak = () => {
        utterance.onstart = () => {
          setSpeaking(true);
          setSpeakLang(lang);
          setTtsLoading(false);
        };

        utterance.onend = () => {
          setSpeaking(false);
          setSpeakLang('');
          setTtsLoading(false);
          resolve();
        };

        utterance.onerror = (ev) => {
          console.error('SpeechSynthesis error', ev);
          if (!triedFallback) {
            triedFallback = true;
            // Retry with a more generic language/voice
            utterance.lang = 'en-US';
            const voices = synth.getVoices() || [];
            utterance.voice = voices[0] || null;
            synth.cancel();
            synth.speak(utterance);
            return;
          }
          setSpeaking(false);
          setSpeakLang('');
          setTtsLoading(false);
          reject(new Error('Browser speech synthesis failed'));
        };

        try {
          synth.cancel();
          synth.speak(utterance);
        } catch (err) {
          console.error('synth.speak error', err);
          reject(new Error('Browser speech synthesis failed'));
        }
      };

      // Try to select a voice; if none are loaded yet, wait for voiceschanged
      if (selectVoice()) {
        startSpeak();
      } else {
        const onVoicesChanged = () => {
          if (selectVoice()) {
            synth.removeEventListener('voiceschanged', onVoicesChanged);
            startSpeak();
          }
        };
        synth.addEventListener('voiceschanged', onVoicesChanged);
        // Fallback: start speaking after short timeout even if voices didn't load
        setTimeout(() => {
          synth.removeEventListener('voiceschanged', onVoicesChanged);
          selectVoice();
          startSpeak();
        }, 600);
      }
    });
  };

  const generateStory = async () => {
    const wordList = words.filter(w => w.trim());
    if (!wordList.length) {
      setError('✨ Please enter at least one magic word! ✨');
      return;
    }
    setError('');
    setStory(null);
    setLoading(true);
    stopAudio();

    try {
      const apiUrl = `${getApiUrl()}/story/generate`;
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: wordList, childId: 'guest' })
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const story = data.story || data;
      setStory(story);
      saveToHistory(story);
      console.log('✅ Story saved:', story);
    } catch (e) {
      console.error('Story generation error:', e);
      setError('🚨 Story generation failed. Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  const speak = async (text, lang) => {
    if (speaking && speakLang === lang) {
      stopAudio();
      return;
    }
    if (ttsLoading) return;

    stopAudio();
    setTtsLoading(true);

    try {
      const clean = stripEmoji(text);
      let blob = await speakText(clean, lang === 'hi-IN' ? 'hi' : 'en');

      if (!blob) {
        throw new Error('No audio data received');
      }

      // If blob is too small, might be error response - try English as fallback for Hindi
      if (blob.size < 50 && lang === 'hi-IN') {
        console.warn('Hindi audio too small, trying English fallback...');
        blob = await speakText(clean, 'en');
        if (!blob || blob.size < 50) {
          throw new Error('Audio generation failed in both languages');
        }
      }

      if (blob.size < 50) {
        throw new Error(`Audio generation failed - got ${blob.size} bytes`);
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setSpeaking(true);
        setSpeakLang(lang);
        setTtsLoading(false);
      };
      audio.onended = () => {
        stopAudio();
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        stopAudio();
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (e) {
      try {
        const clean = stripEmoji(text);
        await speakWithBrowser(clean, lang);
      } catch (browserError) {
        console.error('TTS error:', e.message);
        console.error('Browser TTS error:', browserError.message);
        setTtsLoading(false);
        setSpeaking(false);
        setError(`🔊 Voice error: ${browserError.message}`);
      }
    }
  };

  const clearAll = () => {
    setWords(['', '', '']);
    setStory(null);
    setError('');
    stopAudio();
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to delete all stories? This cannot be undone.')) {
      setHistory([]);
      localStorage.removeItem('story_history');
      setStory(null);
      console.log('✨ Story history cleared');
    }
  };

  return (
    <div className="app child-friendly">
      {/* ── Overlay when sidebar open ── */}
      {showHistory && (
        <div className="sidebar-overlay" onClick={() => setShowHistory(false)} />
      )}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-content">
          <h1 className="title">🎭 StoryTime Magic ✨</h1>
          <p className="subtitle">Turn your words into amazing stories!</p>
        </div>
        <button 
          className="history-btn"
          onClick={() => setShowHistory(!showHistory)}>
          📖 {history.length > 0 ? `Stories (${history.length})` : 'No Stories Yet'}
        </button>
      </header>

      {/* ── Sidebar History ── */}
      <aside className={`sidebar ${showHistory ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>📚 Your Stories</h2>
          <div className="sidebar-buttons">
            {history.length > 0 && (
              <button className="sidebar-clear" onClick={clearHistory} title="Delete all stories">
                🗑️
              </button>
            )}
            <button className="sidebar-close" onClick={() => setShowHistory(false)}>✕</button>
          </div>
        </div>
        <div className="sidebar-list">
          {history.length === 0 && (
            <div className="sidebar-empty">
              No stories yet. Generate your first one! 🌟
            </div>
          )}
          {history.map((s, i) => (
            <div 
              key={i} 
              className="sidebar-item"
              onClick={() => { setStory(s); setShowHistory(false); stopAudio(); }}>
              <span className="si-emoji">{s.emoji || '📖'}</span>
              <div className="si-info">
                <div className="si-title">{stripEmoji(s.title || 'Untitled')}</div>
                <div className="si-words">{s.words?.slice(0, 3).join(' • ')}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="container">
        {/* ── Word Input Section ── */}
        <section className="input-section">
          <div className="word-inputs">
            <div className="words-label">🎯 Enter 3 Magic Words:</div>
            <div className="words-grid">
              {words.map((word, i) => (
                <div key={i} className="word-input-wrapper">
                  <input
                    type="text"
                    className="word-input"
                    placeholder={['🌟 Word 1', '✨ Word 2', '🎪 Word 3'][i]}
                    value={word}
                    onChange={(e) => update(i, e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && generateStory()}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className={`generate-btn ${loading ? 'loading' : ''}`}
            onClick={generateStory}
            disabled={loading}>
            {loading ? (
              <><span className="spin"></span> Creating Story...</>
            ) : (
              <>🎬 Create My Story!</>
            )}
          </button>
        </section>

        {/* ── Story Display Section ── */}
        {story && (
          <section className="story-section" ref={storyRef}>
            <div className="story-header">
              <div className="story-title-block">
                <span className="story-emoji">{story.emoji || '📖'}</span>
                <h2 className="story-title">{story.title}</h2>
              </div>
              <button className="clear-btn" onClick={clearAll}>✨ New Story</button>
            </div>

            {/* English Story */}
            <div className="lang-block en-block">
              <div className="lang-header">
                <span className="lang-emoji">🇬🇧</span>
                <span className="lang-name">English</span>
                <button
                  className={`speak-btn ${speaking && speakLang === 'en-IN' ? 'speaking' : ''} ${ttsLoading && speakLang !== 'hi-IN' ? 'loading' : ''}`}
                  onClick={() => speak(story.english || '', 'en-IN')}
                  disabled={ttsLoading && speakLang !== 'en-IN'}>
                  {ttsLoading && speakLang !== 'hi-IN' && !speaking
                    ? <><span className="spin-sm"></span>...</>
                    : speaking && speakLang === 'en-IN'
                      ? <>⏸️ Stop</>
                      : <>🔊 Play</>}
                </button>
              </div>
              <p className="story-text">{story.english}</p>
            </div>

            {/* Hindi Story */}
            {story.hindi && (
              <div className="lang-block hi-block">
                <div className="lang-header">
                  <span className="lang-emoji">🇮🇳</span>
                  <span className="lang-name">हिंदी</span>
                  <button
                    className={`speak-btn ${speaking && speakLang === 'hi-IN' ? 'speaking' : ''} ${ttsLoading && speakLang !== 'en-IN' ? 'loading' : ''}`}
                    onClick={() => speak(story.hindi || '', 'hi-IN')}
                    disabled={ttsLoading && speakLang !== 'en-IN'}>
                    {ttsLoading && speakLang !== 'en-IN' && !speaking
                      ? <><span className="spin-sm"></span>...</>
                      : speaking && speakLang === 'hi-IN'
                        ? <>⏸️ रुको</>
                        : <>🔊 चलाएं</>}
                  </button>
                </div>
                <p className="story-text">{story.hindi}</p>
              </div>
            )}

            {/* Question */}
            {story.question?.en && (
              <div className="question-section">
                <div className="question-label">🤔 Think About It:</div>
                <p className="question-text">{story.question.en}</p>
                {story.question?.hi && (
                  <p className="question-text hindi">{story.question.hi}</p>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>✨ Made with Love for Young Storytellers ✨</p>
      </footer>
    </div>
  );
}
