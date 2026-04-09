const router = require('express').Router();
const Story  = require('../models/Story');
const Groq   = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Prompts ──────────────────────────────────────────
function buildPrompt(words) {
  return `You are a master storyteller writing for children aged 6-12 including special needs children.
Create a meaningful, emotionally rich bilingual story using these words: ${words.join(', ')}.

FORMAT (follow exactly, plain text only, no markdown):
Title: [2-3 emojis + creative compelling title]
Emoji: [one main character emoji only]
English: [ONE rich paragraph. 7-9 sentences. Give the main character a name and personality. Include a real problem they face, an emotional journey, vivid descriptions, and a satisfying ending with a lesson. Think Roald Dahl style — simple but powerful words.]
Hindi: [Full natural Hindi translation of the same paragraph. Simple conversational Hindi a child would understand.]
Question: [One thought-provoking question that makes the child reflect on the story or their own life]
QuestionHindi: [Same question in Hindi]

RULES:
- Story must feel REAL and EMOTIONAL
- Give the main character a name and personality
- Clear problem, struggle, resolution arc
- Use all given words naturally
- Simple words but rich imagery
- Happy or hopeful ending always
- No markdown, no asterisks, plain text only`;
}

function parseStory(raw) {
  const result = {
    title: '', emoji: '🌟',
    english: '', hindi: '',
    question: { en: '', hi: '' }
  };
  const lines = raw.trim().split('\n').filter(l => l.trim());
  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.startsWith('title:'))
      result.title = line.replace(/^title:\s*/i, '').trim();
    else if (low.startsWith('emoji:'))
      result.emoji = line.replace(/^emoji:\s*/i, '').trim();
    else if (low.startsWith('english:'))
      result.english = line.replace(/^english:\s*/i, '').trim();
    else if (low.startsWith('hindi:'))
      result.hindi = line.replace(/^hindi:\s*/i, '').trim();
    else if (low.startsWith('questionhindi:'))
      result.question.hi = line.replace(/^questionhindi:\s*/i, '').trim();
    else if (low.startsWith('question:'))
      result.question.en = line.replace(/^question:\s*/i, '').trim();
  }
  return result;
}

// ── Generate from words ──────────────────────────────
router.post('/generate', async (req, res) => {
  const { words, childId = 'guest' } = req.body;
  if (!words || !words.length)
    return res.status(400).json({ error: 'No words provided' });

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.85,
      messages: [
        {
          role: 'system',
          content: 'You are a master bilingual storyteller for children. Always follow the exact format. No markdown or asterisks.'
        },
        {
          role: 'user',
          content: buildPrompt(words)
        }
      ]
    });

    const raw    = completion.choices[0].message.content;
    const parsed = parseStory(raw);
    const story  = await Story.create({ ...parsed, words, childId });
    res.json({ success: true, story });

  } catch (e) {
    console.error('Generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;