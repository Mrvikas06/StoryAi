const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const { buildPrompt, parseStory, generateLocalStory } = require('../routes/story');
const { stripEmoji } = require('../routes/tts');
const { cleanOldTempFiles, splitIntoChunks, synthesizeWebAudio, VOICES } = require('../utils/ttsService');
const app = require('../server');

test('buildPrompt includes all supplied words', () => {
  const words = ['dragon', 'compass', 'forest'];
  const prompt = buildPrompt(words);
  assert.ok(prompt.includes('dragon, compass, forest'));
  assert.ok(prompt.includes('SKILL TYPES'));
});

test('parseStory correctly parses structured format', () => {
  const rawSample = `
Title: The Brave Little Squirrel
Emoji: 🐿️
SkillType: Social Skills
Skill: Asking for Help
English: Cheeku loved climbing the grand oak tree every single afternoon. One windy day, his acorn slipped into a narrow hollow. His paws could not reach deep enough to grasp it. Instead of crying, he remembered to look for his trusted friend Bruno. He called out softly and asked for a helping hand. Bruno nudged the branch gently until the acorn tumbled free. Cheeku smiled with relief and shared half of the prize.
Hindi: चीकू को हर दोपहर बड़े शाहबलूत के पेड़ पर चढ़ना बहुत पसंद था। एक दिन उसका बलूत का फल एक खोह में फिसल गया। उसने अपने दोस्त से मदद मांगी।
Question: When was the last time you asked a friend for help?
QuestionHindi: आपने पिछली बार किसी दोस्त से कब मदद मांगी थी?
  `;

  const parsed = parseStory(rawSample);
  assert.strictEqual(parsed.title, 'The Brave Little Squirrel');
  assert.strictEqual(parsed.emoji, '🐿️');
  assert.strictEqual(parsed.skill, 'Asking for Help');
  assert.ok(parsed.english.includes('Cheeku loved climbing'));
  assert.ok(parsed.hindi.includes('चीकू'));
  assert.strictEqual(parsed.question.en, 'When was the last time you asked a friend for help?');
  assert.strictEqual(parsed.question.hi, 'आपने पिछली बार किसी दोस्त से कब मदद मांगी थी?');
});

test('generateLocalStory produces valid bilingual story', () => {
  const story = generateLocalStory(['courage', 'lantern', 'meadow'], 'child_123');
  assert.ok(story.title.length > 0);
  assert.ok(story.emoji.length > 0);
  assert.ok(story.english.length > 50);
  assert.ok(story.hindi.length > 30);
  assert.ok(story.question.en.includes('breath'));
  assert.strictEqual(story.childId, 'child_123');
  assert.deepStrictEqual(story.words, ['courage', 'lantern', 'meadow']);
});

test('stripEmoji removes emoji and special symbols for clean TTS', () => {
  const textWithEmoji = '✨ Hello little star 🌟 and cute bear 🐻!';
  const cleaned = stripEmoji(textWithEmoji);
  assert.strictEqual(cleaned, 'Hello little star and cute bear !');
});

test('splitIntoChunks partitions long text into readable segments', () => {
  const text = 'First sentence here. Second sentence follows. Third sentence wraps up!';
  const chunks = splitIntoChunks(text, 'en');
  assert.ok(chunks.length >= 3);
  assert.ok(chunks[0].includes('First'));
});

test('synthesizeWebAudio produces valid MP3 audio buffers', async () => {
  const buffer = await synthesizeWebAudio('Hello brave friend!', 'en');
  assert.ok(buffer.length > 500);
});

test('cleanOldTempFiles runs safely without exceptions', () => {
  assert.doesNotThrow(() => {
    cleanOldTempFiles();
  });
});

test('VOICES dictionary contains English and Hindi neural voices', () => {
  assert.ok(VOICES.en.includes('Neural'));
  assert.ok(VOICES.hi.includes('Neural'));
});

test('GET /api/health responds with 200 ok', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
  } finally {
    server.close();
  }
});

test('POST /api/story/generate returns generated story with fallback', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/story/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: ['puzzle', 'river', 'kite'] })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.story.title);
    assert.ok(data.story.english);
    assert.ok(data.story.hindi);
  } finally {
    server.close();
  }
});

test('POST /api/tts/speak streams audio mpeg response', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tts/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Welcome to story time!', lang: 'en' })
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'audio/mpeg');
    const audioData = await res.arrayBuffer();
    assert.ok(audioData.byteLength > 500);
  } finally {
    server.close();
  }
});
