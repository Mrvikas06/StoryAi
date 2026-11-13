const Groq = require('groq-sdk');
const { buildPrompt, parseStory, generateLocalStory } = require('../../backend/routes/story');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words, childId = 'guest' } = req.body || {};

    if (!words || !Array.isArray(words) || !words.filter(Boolean).length) {
      return res.status(400).json({ error: 'No words provided' });
    }

    const cleanWords = words.map((w) => String(w).trim()).filter(Boolean);
    let story = null;

    if (process.env.GROQ_API_KEY) {
      try {
        const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
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
        story = { ...parsed, words: cleanWords, childId };
        if (!story.english) story.english = raw;
        if (!story.hindi) story.hindi = raw;
      } catch (apiErr) {
        console.warn('Groq API failed, using fallback generator:', apiErr.message);
        story = generateLocalStory(cleanWords, childId);
      }
    } else {
      story = generateLocalStory(cleanWords, childId);
    }

    const storyPayload = {
      _id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...story,
      createdAt: new Date().toISOString()
    };

    return res.status(200).json({ success: true, story: storyPayload });
  } catch (e) {
    console.error('Story endpoint error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
