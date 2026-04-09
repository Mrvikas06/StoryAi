function parseStory(raw) {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  let title = '', pairs = [], question = { en: '', hi: '' };
  let i = 0;

  if (lines[0]?.toLowerCase().startsWith('title:')) {
    title = lines[0].replace(/^title:\s*/i, '').trim();
    i = 1;
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    const isHindi = /[\u0900-\u097F]/.test(line);
    const isQuestion = line.endsWith('?') && !isHindi;

    if (isQuestion) {
      question.en = line; i++;
      if (i < lines.length && /[\u0900-\u097F]/.test(lines[i])) {
        question.hi = lines[i]; i++;
      }
    } else if (!isHindi) {
      let hiLine = '';
      if (i+1 < lines.length && /[\u0900-\u097F]/.test(lines[i+1])) {
        hiLine = lines[i+1]; i += 2;
      } else i++;
      pairs.push({ en: line, hi: hiLine });
    } else i++;
  }
  return { title, lines: pairs, question };
}
module.exports = parseStory;