import { useTTS } from "../hooks/useTTS";

const StoryDisplay = ({ story }) => {
  const { speaking, speak } = useTTS();

  return (
    <div>
      <h2>Story</h2>
      
      {story.title && <h3>{story.title}</h3>}
      
      <div className="story-content">
        {story.lines && story.lines.map((line, i) => (
          <p key={i}>
            <strong>{line.en}</strong><br />
            <em>{line.hi}</em>
          </p>
        ))}
        {story.question && (
          <div className="question">
            <p><strong>Question:</strong> {story.question.en}</p>
            <p><em>{story.question.hi}</em></p>
          </div>
        )}
      </div>

      <button onClick={() => speak(story)} disabled={speaking}>
        {speaking ? '⏸️ Stop' : '🔊 Play Story'}
      </button>
    </div>
  );
};

export default StoryDisplay;
