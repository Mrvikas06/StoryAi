const buildPrompt = (words) => `You are a master storyteller writing for children aged 6-12.
Create a meaningful, emotionally rich bilingual story using these words: ${words.join(', ')}.

FORMAT (follow exactly):
Title: [2-3 emojis + title]
Emoji: [one emoji]
English: [ONE paragraph, 7-9 sentences]
Hindi: [Full Hindi translation]
Question: [One reflection question]
QuestionHindi: [Question in Hindi]`;

function parseStory(raw) {
  const result = {
    title: '',
    emoji: '🌟',
    english: '',
    hindi: '',
    question: { en: '', hi: '' }
  };

  const lines = raw.trim().split('\n').filter((line) => line.trim());

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('title:')) {
      result.title = line.replace(/^title:\s*/i, '').trim();
    } else if (lower.startsWith('emoji:')) {
      result.emoji = line.replace(/^emoji:\s*/i, '').trim();
    } else if (lower.startsWith('english:')) {
      result.english = line.replace(/^english:\s*/i, '').trim();
    } else if (lower.startsWith('hindi:')) {
      result.hindi = line.replace(/^hindi:\s*/i, '').trim();
    } else if (lower.startsWith('question:')) {
      result.question.en = line.replace(/^question:\s*/i, '').trim();
    } else if (lower.startsWith('questionhindi:')) {
      result.question.hi = line.replace(/^questionhindi:\s*/i, '').trim();
    }
  }

  return result;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words, childId = 'guest' } = req.body || {};

    if (!words || !words.length) {
      return res.status(400).json({ error: 'No words provided' });
    }

    // Try calling Groq; if it fails we fall back to a local generator.
    let story = null;

    try {
      const Groq = (await import('groq-sdk')).default;
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
            content: buildPrompt(words)
          }
        ]
      });

      const raw = completion?.choices?.[0]?.message?.content || '';
      const parsed = parseStory(raw);
      story = { ...parsed, words, childId };

      if (!story.english) story.english = raw;
      if (!story.hindi) story.hindi = raw;
    } catch (apiErr) {
      console.warn('Groq API failed, using local fallback:', apiErr && apiErr.message ? apiErr.message : apiErr);
      // Local fallback generator
      const generateLocal = (wordsList, cid) => {
        const emojis = ['🌟','✨','🌙','🐱','🦊','🐻','🪄','🦋','🌈','🚀'];
        const emoji = emojis[Math.min(wordsList.length, emojis.length - 1)];
        const titleCore = (wordsList[0] || 'Story').toString();
        const title = `${emoji} ${titleCore.charAt(0).toUpperCase() + titleCore.slice(1)} and Friends`;

        // Build 7-9 short sentences using the words
        const sentences = [];
        const templates = [
          w => `Once upon a time, there was a ${w} who loved to explore.`,
          w => `Every day the ${w} would look for new adventures in the garden.`,
          w => `One day, the ${w} met a friendly friend and they played together.`,
          w => `They learned that being kind made the ${w} very happy.`,
          w => `At night the ${w} would look at the stars and dream big dreams.`,
          w => `Together they solved a small mystery using courage and curiosity.`,
          w => `In the end, the ${w} found a place where they belonged.`,
          w => `The ${w} taught others that small steps can change everything.`,
          w => `And from that day, the ${w} smiled every morning.`
        ];

        // Shuffle words to vary sentences
        const shuffled = [...wordsList];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        for (let i = 0; i < 8; i++) {
          const w = shuffled[i % shuffled.length] || 'friend';
          const tmpl = templates[i % templates.length];
          sentences.push(tmpl(w));
        }

        const english = sentences.join(' ');
        const questionEn = `What would you do if you met the ${shuffled[0]}?`;
        const hindi = english; // fallback: reuse English when translation not available
        const questionHi = questionEn;

        return {
          title,
          emoji,
          english,
          hindi,
          question: { en: questionEn, hi: questionHi },
          words: wordsList,
          childId: cid
        };
      };

      story = generateLocal(words, childId);
    }

    try {
      if (process.env.MONGODB_URI) {
        const { default: Story } = await import('../../backend/models/Story.js');
        await Story.create(story);
      }
    } catch (dbError) {
      console.warn('Story persistence skipped:', dbError.message);
    }

    return res.status(200).json({ success: true, story });
  } catch (e) {
    console.error('Story error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
