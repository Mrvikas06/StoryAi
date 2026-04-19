const router = require('express').Router();
const Story  = require('../models/Story');
const Groq   = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Prompts ──────────────────────────────────────────
function buildPrompt(words) {
  return `You are a master storyteller writing for special needs children aged 6-12.
Create a meaningful, emotionally rich bilingual story using these words: ${words.join(', ')}.

The story must naturally teach ONE real-life skill woven into the plot. Choose the most fitting skill type based on the words given:

SKILL TYPES (pick one that fits best):
- Daily Living (ADL): brushing teeth, getting dressed, washing hands, eating, tidying up
- Emotions & Feelings: naming feelings, calming down, dealing with anger/fear/jealousy
- Social Skills: sharing, taking turns, making friends, saying sorry, asking for help
- Thinking Skills: solving a problem, making a choice, remembering steps, staying focused
- Brave Moments: trying something new, going to school, doctor visit, dark room, loud place
- Body & Movement: balance, fine motor (buttoning, holding pencil), gross motor (running, jumping)
- Communication: asking for what you need, saying no, expressing love, using words not hands
- Self-Care & Safety: crossing road safely, stranger safety, knowing your name/address, hot/cold awareness

FORMAT (follow exactly, plain text only, no markdown):
Title: [2-3 emojis + creative compelling title]
Emoji: [one main character emoji only]
SkillType: [which skill type from above is being taught]
Skill: [specific skill, e.g. "Calming Down When Angry" or "Buttoning a Shirt"]
English: [ONE rich paragraph. 7-9 sentences. Give the main character a unique name and vivid personality. They face a real relatable problem. The solution naturally involves doing or learning the skill — show it through concrete sensory action in the story. Use simple but powerful words, light repetition of key moments. End with pride, warmth, or discovery.]
Hindi: [Full natural Hindi translation. Conversational, warm, short sentences a child understands.]
Question: [One thought-provoking question connecting the story to the child's own life]
QuestionHindi: [Same question in Hindi]

CHARACTER BANK (rotate, never repeat same name twice):
Boys: Arjun, Zaid, Leo, Kabir, Milo, Rohan, Finn, Veer, Oscar, Aarav
Girls: Mira, Aisha, Nora, Priya, Zara, Leila, Tara, Sofia, Ananya, Ruby
Animals/helpers: Bruno the dog, Cheeku the squirrel, Meow the cat, Biscuit the rabbit

RULES:
- Skill must feel like a natural story moment, NOT a lesson or instruction
- Character must have a name, quirk, and emotional arc
- Show skill through story action — "his hands shook but he pushed the button through the hole" not "he learned to button"
- Sensory language: textures, sounds, smells, temperatures, feelings in the body
- Simple words, no abstract ideas, no confusing metaphors
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