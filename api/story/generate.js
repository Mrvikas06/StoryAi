// api/story/generate.js - Story generation endpoint
import StoryRouter from '../../backend/routes/story.js';

const router = StoryRouter;

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words, childId = 'guest' } = req.body;
    
    if (!words || !words.length) {
      return res.status(400).json({ error: 'No words provided' });
    }

    // Call the story generation logic
    const Groq = (await import('groq-sdk')).default;
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are a master storyteller writing for children aged 6-12.
Create a meaningful, emotionally rich bilingual story using these words: ${words.join(', ')}.

FORMAT (follow exactly):
Title: [2-3 emojis + title]
Emoji: [one emoji]
English: [ONE paragraph, 7-9 sentences]
Hindi: [Full Hindi translation]
Question: [One reflection question]
QuestionHindi: [Question in Hindi]`;

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: 'You are a master bilingual storyteller for children.' },
        { role: 'user', content: prompt }
      ]
    });

    const story = {
      title: 'Story',
      emoji: '🌟',
      english: completion.choices[0].message.content,
      hindi: completion.choices[0].message.content,
      words,
      childId
    };

    res.status(200).json({ success: true, story });
  } catch (e) {
    console.error('Story error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
