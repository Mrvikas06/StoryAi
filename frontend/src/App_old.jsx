import { useState, useRef, useEffect } from 'react';
import './App.css';

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
  const [words, setWords]               = useState(['', '', '']);
  const [inputMode, setInputMode]       = useState('words');
  const [freeText, setFreeText]         = useState('');
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [story, setStory]               = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [speaking, setSpeaking]         = useState(false);
  const [speakLang, setSpeakLang]       = useState('');
  const [listening, setListening]       = useState(false);
  const [history, setHistory]           = useState([]);
  const [showHistory, setShowHistory]   = useState(false);
  const [showHindi, setShowHindi]       = useState(true);
  const [fontSize, setFontSize]         = useState('md');
  const [copied, setCopied]             = useState(false);
  const [ttsLoading, setTtsLoading]     = useState(false);

  const recRef      = useRef(null);
  const storyRef    = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef    = useRef(null);

  useEffect(() => {
    const h = localStorage.getItem('story_history');
    if (h) {
      try { setHistory(JSON.parse(h)); } catch(e) {}
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
    const w = [...words]; w[i] = val; setWords(w);
  };

  const saveToHistory = (s) => {
    const updated = [s, ...history].slice(0, 15);
    setHistory(updated);
    localStorage.setItem('story_history', JSON.stringify(updated));
  };

  // ── Generate from words ────────────────────────────
  const generate = async () => {
    let wordList = [];
    if (inputMode === 'words') {
      wordList = words.filter(w => w.trim());
    } else {
      wordList = freeText.split(/[\s,]+/).filter(Boolean).slice(0, 6);
    }
    if (!wordList.length) {
      setError('Please enter at least one word to begin.');
      return;
    }
    setError(''); setStory(null); setLoading(true);
    stopAudio();
    try {
      const res = await fetch('http://localhost:4000/api/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: wordList, childId: 'guest' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStory(data.story);
      saveToHistory(data.story);
    } catch (e) {
      console.error(e);
      setError('Story generation failed. Make sure the backend is running on port 4000.');
    } finally {
      setLoading(false);
    }
  };

  // ── Generate from image ────────────────────────────
  const generateFromImage = async () => {
    if (!imageFile) { setError('Please select a photo first.'); return; }
    setError(''); setStory(null); setLoading(true);
    stopAudio();
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('childId', 'guest');
      const res = await fetch('http://localhost:4000/api/story/generate-from-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStory(data.story);
      saveToHistory(data.story);
    } catch (e) {
      console.error(e);
      setError('Could not generate story from image. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Stop audio ─────────────────────────────────────
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
    setSpeakLang('');
    setTtsLoading(false);
  };

  // ── Browser Web Speech TTS (FREE) with Deep Indian Narrator ────
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
      console.log('🎤 TTS request:', { lang, chars: clean.length });

      const { speakText } = await import('./api.js');
      const blob = await speakText(clean, lang === 'hi-IN' ? 'hi' : 'en');
      
      if (!blob || blob.size < 100) {
        throw new Error('Audio generation failed');
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
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        stopAudio();
        setError('Audio playback error');
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (e) {
      console.error('TTS error:', e.message);
      setTtsLoading(false);
      setSpeaking(false);
      setError(`Voice error: ${e.message}`);
    }
  };

  // ── Voice input ────────────────────────────────────
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice input requires Chrome or Edge browser.');
      return;
    }
    if (listening) { recRef.current?.stop(); return; }
    const r = new SR();
    r.lang = 'en-IN';
    r.continuous = false;
    r.interimResults = false;
    r.onstart  = () => { setListening(true); setError(''); };
    r.onend    = () => setListening(false);
    r.onerror  = (e) => {
      setListening(false);
      if (e.error === 'not-allowed')
        setError('Microphone access denied. Click the lock icon in browser address bar to allow.');
      else if (e.error === 'no-speech')
        setError('No speech detected. Please speak clearly and try again.');
      else
        setError('Voice input failed. Please type instead.');
    };
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      console.log('Voice heard:', transcript);
      if (inputMode === 'words') {
        const heard = transcript.split(/[\s,]+/).filter(Boolean).slice(0, 3);
        const nw = ['', '', ''];
        heard.forEach((w, i) => { nw[i] = w; });
        setWords(nw);
      } else if (inputMode === 'free') {
        setFreeText(transcript);
      }
    };
    recRef.current = r;
    r.start();
  };

  // ── Image select ───────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ── Copy story ─────────────────────────────────────
  const copyStory = () => {
    if (!story) return;
    const text = [
      stripEmoji(story.title),
      '',
      story.english,
      '',
      story.hindi,
      '',
      `Q: ${story.question?.en}`,
      `Q: ${story.question?.hi}`
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setWords(['', '', '']);
    setFreeText('');
    setImageFile(null);
    setImagePreview(null);
    setStory(null);
    setError('');
    stopAudio();
  };

  const fontClass = { sm: 'font-sm', md: 'font-md', lg: 'font-lg' }[fontSize];

  return (
    <div className="app">

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${showHistory ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">📚 Story History</span>
          <button className="sidebar-close" onClick={() => setShowHistory(false)}>✕</button>
        </div>
        <div className="sidebar-list">
          {history.length === 0 && (
            <div className="sidebar-empty">
              No stories yet.<br />Generate your first story!
            </div>
          )}
          {history.map((s, i) => (
            <div key={i} className="sidebar-item"
              onClick={() => { setStory(s); setShowHistory(false); stopAudio(); }}>
              <span className="si-emoji">{s.emoji || '📖'}</span>
              <div className="si-info">
                <div className="si-title">{stripEmoji(s.title || 'Story')}</div>
                <div className="si-words">
                  {s.fromImage ? '📷 From photo' : s.words?.slice(0,3).join(' · ')}
                </div>
              </div>
              <svg className="si-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
        {history.length > 0 && (
          <div className="sidebar-footer">
            <button className="sidebar-clear"
              onClick={() => { setHistory([]); localStorage.removeItem('story_history'); }}>
              Clear all history
            </button>
          </div>
        )}
      </aside>

      {showHistory && <div className="overlay" onClick={() => setShowHistory(false)} />}

      {/* ── Main ── */}
      <div className="main">

        {/* Navbar */}
        <nav className="navbar">
          <div className="nav-left">
            <button className="nav-icon-btn" onClick={() => setShowHistory(true)} title="Story history">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="nav-brand">
              <span className="brand-dot"></span>
              StoryAI
            </div>
          </div>
          <div className="nav-right">
            <div className="font-controls">
              {[['sm',11],['md',14],['lg',18]].map(([s, sz]) => (
                <button key={s}
                  className={`font-btn ${fontSize === s ? 'active' : ''}`}
                  style={{ fontSize: sz + 'px' }}
                  onClick={() => setFontSize(s)}>A</button>
              ))}
            </div>
            <div className="nav-sep"></div>
            <div className="live-pill">
              <span className="live-dot"></span>
              Live
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="content">

          {/* Hero */}
          {!story && !loading && (
            <div className="hero">
              <div className="hero-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <h1 className="hero-title">StoryAI</h1>
              <p className="hero-sub">
                Enter words or upload a photo — get a meaningful bilingual story in English and Hindi, narrated by a human-like voice.
              </p>
              <div className="hero-pills">
                <span className="pill">🎙 Voice Input</span>
                <span className="pill">🔊 Human Narration</span>
                <span className="pill">🇮🇳 English + Hindi</span>
                <span className="pill">📷 Photo Stories</span>
                <span className="pill">📚 Story History</span>
              </div>
            </div>
          )}

          {/* Input panel */}
          <div className="input-panel">

            {/* Tabs */}
            <div className="input-tabs">
              <button className={`itab ${inputMode==='words'?'active':''}`}
                onClick={() => setInputMode('words')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Word Mode
              </button>
              <button className={`itab ${inputMode==='free'?'active':''}`}
                onClick={() => setInputMode('free')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                Sentence Mode
              </button>
              <button className={`itab ${inputMode==='image'?'active':''}`}
                onClick={() => setInputMode('image')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Photo Story
              </button>
            </div>

            {/* Word mode */}
            {inputMode === 'words' && (
              <div className="word-grid">
                {words.map((w, i) => (
                  <div key={i} className="word-field">
                    <label className="field-label">
                      Word {i+1}{i===2?' — optional':''}
                    </label>
                    <input className="text-input"
                      placeholder={['e.g. ocean','e.g. brave','e.g. secret'][i]}
                      value={w} maxLength={24}
                      onChange={e => update(i, e.target.value)}
                      onKeyDown={e => e.key==='Enter' && generate()}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Sentence mode */}
            {inputMode === 'free' && (
              <div className="free-field">
                <label className="field-label">Describe your story idea</label>
                <textarea className="text-input textarea"
                  placeholder="e.g. A little girl who finds a dragon hidden in a mountain cave..."
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Image mode */}
            {inputMode === 'image' && (
              <div className="image-field">
                <input type="file" accept="image/*"
                  ref={fileInputRef} onChange={handleImageSelect}
                  style={{ display:'none' }}
                />
                {!imagePreview ? (
                  <div className="upload-zone"
                    onClick={() => fileInputRef.current.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p className="upload-title">Click or drag a photo here</p>
                    <p className="upload-hint">JPG, PNG, WEBP — max 5MB</p>
                  </div>
                ) : (
                  <div className="preview-wrap">
                    <img src={imagePreview} className="preview-img" alt="Selected" />
                    <div className="preview-overlay">
                      <button className="preview-remove"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}>
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action row */}
            <div className="action-row">
              <button className="btn-generate" disabled={loading}
                onClick={inputMode==='image' ? generateFromImage : generate}>
                {loading
                  ? <><span className="spin"></span>
                      {inputMode==='image' ? 'Analyzing photo...' : 'Generating story...'}</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {inputMode==='image' ? 'Create Story from Photo' : 'Generate Story'}</>}
              </button>

              {inputMode !== 'image' && (
                <button className={`btn-icon ${listening?'btn-mic-active':''}`}
                  onClick={startVoice}
                  title={listening?'Stop':'Voice input'}>
                  {listening
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
                </button>
              )}

              <button className="btn-icon btn-trash" onClick={clearAll} title="Clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
            </div>

            {listening && (
              <div className="mic-bar">
                <span className="mic-dot"></span>
                Listening... speak your words clearly
              </div>
            )}
            {error && <div className="error-bar">{error}</div>}
          </div>

          {/* Skeleton */}
          {loading && (
            <div className="story-card skeleton-card">
              <div className="sk sk-title"></div>
              <div className="sk sk-line"></div>
              <div className="sk sk-line sk-short"></div>
              <div className="sk sk-line"></div>
              <div className="sk sk-line sk-med"></div>
              <div className="sk sk-line sk-short"></div>
              <div className="sk sk-line"></div>
            </div>
          )}

          {/* Story output */}
          {story && !loading && (
            <div className={`story-card ${fontClass}`} ref={storyRef}>

              {/* Story header */}
              <div className="story-head">
                <div className="story-char-wrap">
                  <span className="story-char">{story.emoji || '📖'}</span>
                </div>
                <div className="story-meta">
                  <h2 className="story-title-text">
                    {stripEmoji(story.title || 'Your Story')}
                  </h2>
                  <div className="story-tags">
                    {story.fromImage
                      ? <span className="tag tag-photo">📷 From photo</span>
                      : story.words?.map((w,i) => (
                          <span key={i} className="tag">{w}</span>
                        ))}
                  </div>
                </div>
                <button
                  className={`toggle-btn ${showHindi?'on':''}`}
                  onClick={() => setShowHindi(!showHindi)}>
                  {showHindi ? '🇮🇳 Hindi on' : '🇬🇧 English only'}
                </button>
              </div>

              <div className="story-divider"></div>

              {/* English */}
              <div className="lang-block en-block">
                <div className="lang-top">
                  <span className="lang-label">🇬🇧 English</span>
                  <button
                    className={`speak-btn ${speaking&&speakLang==='en-IN'?'speaking':''} ${ttsLoading&&speakLang!=='hi-IN'?'loading':''}`}
                    onClick={() => speak(story.english||'', 'en-IN')}
                    disabled={ttsLoading && speakLang !== 'en-IN'}>
                    {ttsLoading && speakLang !== 'hi-IN' && !speaking
                      ? <><span className="spin-sm"></span>Loading...</>
                      : speaking && speakLang==='en-IN'
                        ? <><span className="wave-dot"></span>Stop</>
                        : <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>Play story</>}
                  </button>
                </div>
                <p className="story-text">{story.english}</p>
              </div>

              {/* Hindi */}
              {showHindi && story.hindi && (
                <div className="lang-block hi-block">
                  <div className="lang-top">
                    <span className="lang-label">🇮🇳 हिंदी</span>
                    <button
                      className={`speak-btn ${speaking&&speakLang==='hi-IN'?'speaking':''} ${ttsLoading&&speakLang!=='en-IN'?'loading':''}`}
                      onClick={() => speak(story.hindi||'', 'hi-IN')}
                      disabled={ttsLoading && speakLang !== 'hi-IN'}>
                      {ttsLoading && speakLang !== 'en-IN' && !speaking
                        ? <><span className="spin-sm"></span>Loading...</>
                        : speaking && speakLang==='hi-IN'
                          ? <><span className="wave-dot"></span>रोकें</>
                          : <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>सुनें</>}
                    </button>
                  </div>
                  <p className="story-text hindi-text">{story.hindi}</p>
                </div>
              )}

              {/* Question */}
              {story.question?.en && (
                <div className="question-block">
                  <div className="q-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="q-body">
                    <p className="q-en">{story.question.en}</p>
                    {showHindi && story.question.hi && (
                      <p className="q-hi">{story.question.hi}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="out-actions">
                <button className="oa-btn" disabled={loading}
                  onClick={inputMode==='image' ? generateFromImage : generate}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-5.5"/></svg>
                  Regenerate
                </button>
                <button className="oa-btn" onClick={copyStory}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
                <button className="oa-btn" onClick={clearAll}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Story
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="footer">
          StoryAI — Bilingual AI storytelling for children with special needs &nbsp;·&nbsp; Powered by Groq + ElevenLabs
        </footer>

      </div>
    </div>
  );
}