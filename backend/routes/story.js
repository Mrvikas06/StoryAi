const router = require('express').Router();
const Story  = require('../models/Story');
const Groq   = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Prompts ──────────────────────────────────────────
function buildPrompt(words) {
  return `You are a master storyteller writing for special needs children aged 6-12.
Create a meaningful, emotionally rich bilingual story using these words: ${words.join(', ')}.
The story must naturally include ONE activity of daily living (ADL) — like brushing teeth, getting dressed, washing hands, eating a meal, or tidying up — woven into the plot, NOT listed as steps.

FORMAT (follow exactly, plain text only, no markdown):
Title: [2-3 emojis + creative compelling title]
Emoji: [one main character emoji only]
ADL: [name of the daily living skill secretly taught, e.g. "Washing Hands"]
English: [ONE rich paragraph. 7-9 sentences. Give the main character a unique, culturally diverse name and a vivid personality (curious, stubborn, dreamy, brave). They face a real relatable problem. The solution naturally involves doing the ADL — show each action concretely as part of the story (what they pick up, what they feel, what they do). Use sensory details, simple but powerful words, light repetition of key actions. End with pride, warmth, or discovery. Think Roald Dahl meets an occupational therapist — magical but grounded.]
Hindi: [Full natural Hindi translation. Conversational, warm, short sentences a child understands.]
Question: [One thought-provoking question connecting the story to the child's own daily life]
QuestionHindi: [Same question in Hindi]

CHARACTER BANK (rotate, never repeat same name twice in a session):
Boys: Arjun, Zaid, Leo, Kabir, Milo, Rohan, Finn, Veer, Oscar, Aarav
Girls: Mira, Aisha, Nora, Priya, Zara, Leila, Tara, Sofia, Ananya, Ruby
Animals/helpers: Bruno the dog, Cheeku the squirrel, Meow the cat, Biscuit the rabbit

RULES:
- ADL must feel like a natural story moment, NOT a lesson or instruction
- Character must have a name, quirk, and emotional arc
- Show the ADL through story action: "she squeezed the blue toothpaste slowly onto the brush" not "she brushed her teeth"
- Sensory language: textures, sounds, smells, temperatures
- Simple words, no abstract ideas, no metaphors that confuse
- Struggle then success arc — child sees themselves in the win
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