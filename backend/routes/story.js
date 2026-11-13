const router = require('express').Router();
const mongoose = require('mongoose');
const Story = require('../models/Story');
const Groq = require('groq-sdk');

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) return null;
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

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
Title: [creative compelling title]
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
- Show skill through story action
- Sensory language: textures, sounds, smells, temperatures, feelings in the body
- Simple words, no abstract ideas, no confusing metaphors
- Struggle then success arc
- Happy or hopeful ending always
- No markdown, no asterisks, plain text only`;
}

function parseStory(raw) {
  const result = {
    title: '',
    emoji: '🌟',
    skillType: '',
    skill: '',
    english: '',
    hindi: '',
    question: { en: '', hi: '' }
  };

  const lines = raw.trim().split('\n').filter((l) => l.trim());
  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.startsWith('title:')) {
      result.title = line.replace(/^title:\s*/i, '').trim();
    } else if (low.startsWith('emoji:')) {
      result.emoji = line.replace(/^emoji:\s*/i, '').trim();
    } else if (low.startsWith('skilltype:')) {
      result.skillType = line.replace(/^skilltype:\s*/i, '').trim();
    } else if (low.startsWith('skill:')) {
      result.skill = line.replace(/^skill:\s*/i, '').trim();
    } else if (low.startsWith('english:')) {
      result.english = line.replace(/^english:\s*/i, '').trim();
    } else if (low.startsWith('hindi:')) {
      result.hindi = line.replace(/^hindi:\s*/i, '').trim();
    } else if (low.startsWith('questionhindi:')) {
      result.question.hi = line.replace(/^questionhindi:\s*/i, '').trim();
    } else if (low.startsWith('question:')) {
      result.question.en = line.replace(/^question:\s*/i, '').trim();
    }
  }

  if (!result.title) result.title = 'The Magical Journey';
  return result;
}

function generateLocalStory(wordsList, childId = 'guest') {
  const emojis = ['🌟', '✨', '🌙', '🐱', '🦊', '🐻', '🪄', '🦋', '🌈', '🚀'];
  const emoji = emojis[Math.min(wordsList.length, emojis.length - 1)] || '🌟';
  const primaryWord = (wordsList[0] || 'Friend').toString();
  const capitalizedWord = primaryWord.charAt(0).toUpperCase() + primaryWord.slice(1);
  const title = `${capitalizedWord} and the Gentle Adventure`;

  const englishSentences = [
    `One bright morning, Leo packed his bag with a ${wordsList[0] || 'notebook'} and stepped outside.`,
    `The gentle breeze rustled through the tall green trees along the quiet winding path.`,
    `Along the way, he noticed a tiny ${wordsList[1] || 'butterfly'} fluttering softly near the garden gate.`,
    `Leo took three slow deep breaths to calm his racing thoughts before stepping forward.`,
    `He remembered how comforting it felt when his teacher taught him to pause and listen.`,
    `With careful fingers, he touched the soft edge of the ${wordsList[2] || 'pebble'} in his pocket.`,
    `Suddenly, his neighbor Mira came by and offered a cheerful wave and a shared smile.`,
    `Together, they celebrated their small courage and walked home with peaceful, happy hearts.`
  ];

  const hindiSentences = [
    `एक सुनहरी सुबह, लियो ने अपना बैग तैयार किया और बाहर की ओर कदम बढ़ाया।`,
    `शांत पगडंडी पर ऊंचे हरे पेड़ों के बीच से ठंडी हवा धीरे-धीरे बह रही थी।`,
    `रास्ते में उसने बगीचे के पास एक प्यारी सी तितली को उड़ते हुए देखा।`,
    `लियो ने आगे बढ़ने से पहले गहरी और शांत सांसें लीं।`,
    `उसे याद आया कि मुश्किल समय में रुकना और समझना कितना मददगार होता है।`,
    `उसने अपनी जेब में रखे छोटे से पत्थर को प्यार से महसूस किया।`,
    `तभी उसकी दोस्त मीरा ने मुस्कुराते हुए उसका स्वागत किया।`,
    `दोनों ने खुशी और आत्मविश्वास के साथ अपने कदम आगे बढ़ाए।`
  ];

  return {
    title,
    emoji,
    skillType: 'Emotions & Feelings',
    skill: 'Calming Down and Taking Deep Breaths',
    english: englishSentences.join(' '),
    hindi: hindiSentences.join(' '),
    question: {
      en: `When was a time you took a deep breath to feel calm and brave?`,
      hi: `आपने पिछली बार शांत और मजबूत महसूस करने के लिए गहरी सांस कब ली थी?`
    },
    words: wordsList,
    childId
  };
}

router.post('/generate', async (req, res) => {
  const { words, childId = 'guest' } = req.body || {};

  if (!words || !Array.isArray(words) || !words.filter(Boolean).length) {
    return res.status(400).json({ error: 'No words provided' });
  }

  const cleanWords = words.map((w) => String(w).trim()).filter(Boolean);
  let storyData = null;

  try {
    const client = getGroqClient();
    if (client) {
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
            content: buildPrompt(cleanWords)
          }
        ]
      });

      const raw = completion?.choices?.[0]?.message?.content || '';
      const parsed = parseStory(raw);
      storyData = { ...parsed, words: cleanWords, childId };
      if (!storyData.english) storyData.english = raw;
      if (!storyData.hindi) storyData.hindi = raw;
    } else {
      storyData = generateLocalStory(cleanWords, childId);
    }
  } catch (err) {
    console.warn('Groq generation fallback:', err.message);
    storyData = generateLocalStory(cleanWords, childId);
  }

  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const saved = await Story.create(storyData);
      return res.json({ success: true, story: saved });
    }
  } catch (dbErr) {
    console.warn('MongoDB persistence skipped:', dbErr.message);
  }

  const inMemoryStory = {
    _id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...storyData,
    createdAt: new Date().toISOString()
  };

  return res.json({ success: true, story: inMemoryStory });
});

module.exports = router;
module.exports.buildPrompt = buildPrompt;
module.exports.parseStory = parseStory;
module.exports.generateLocalStory = generateLocalStory;
