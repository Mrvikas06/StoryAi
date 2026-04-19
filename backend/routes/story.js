const router = require('express').Router();
const Story  = require('../models/Story');
const Groq   = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Prompts ──────────────────────────────────────────
function buildPrompt(words) {
  return `You are a warm, patient storyteller creating therapeutic stories for special needs children aged 6-12.
Create a simple, repetitive, emotionally supportive bilingual story using these words: ${words.join(', ')}.
The story must teach or reinforce ONE activity of daily living (ADL) — like brushing teeth, getting dressed, washing hands, eating, or tidying up.

FORMAT (follow exactly, plain text only, no markdown):
Title: [2-3 emojis + simple welcoming title]
Emoji: [one main character emoji only]
ADL: [name of the daily living skill being taught, e.g. "Brushing Teeth"]
English: [ONE clear paragraph. 6-8 short sentences. Give the main character a name. Show them doing the ADL step by step in natural story flow. Use repetition of key action words. Include a moment of struggle (it's hard or boring), a helper or encouragement, and a proud/happy ending. Simple, concrete, sensory language — what they see, feel, hear. No metaphors.]
Hindi: [Full natural Hindi translation. Simple conversational Hindi. Short sentences. Same step-by-step feel.]
Steps: [3-5 plain text bullet steps of the ADL extracted from the story, e.g. "Pick up the brush. Put toothpaste on. Brush in circles."]
StepsHindi: [Same steps in Hindi]
Question: [One simple reflective question tied to the child's own routine, e.g. "What do YOU do after you wake up?"]
QuestionHindi: [Same question in Hindi]

RULES:
- ONE clear ADL skill per story
- Step-by-step action embedded naturally in story
- Short sentences, concrete words, no abstract ideas
- Repetition of key verbs (e.g. "scrub scrub scrub")
- Sensory details (warm water, soft towel, minty smell)
- Always show struggle then success — builds confidence
- Helper character optional but encouraged (parent, friend, pet)
- Happy proud ending always
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
  console.log('📝 Story request:', { words, childId });
  
  if (!words || !words.length)
    return res.status(400).json({ error: 'No words provided' });

  try {
    console.log('🤖 Calling Groq API...');
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
    console.log('📖 Story generated, parsing...');
    const parsed = parseStory(raw);
    console.log('💾 Saving to database...');
    const story  = await Story.create({ ...parsed, words, childId });
    console.log('✅ Story saved successfully:', story._id);
    res.json({ success: true, story });

  } catch (e) {
    console.error('❌ Generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;