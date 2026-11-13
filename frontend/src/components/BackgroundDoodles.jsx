export default function BackgroundDoodles() {
  return (
    <div className="bg-decorations-container" aria-hidden="true">
      {/* Top Left: Smiling Sun & Soft Cloud */}
      <div className="doodle-item doodle-sun">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
          {/* Sun Rays */}
          <g stroke="#FCD34D" strokeWidth="3" strokeLinecap="round">
            <line x1="50" y1="10" x2="50" y2="20" />
            <line x1="50" y1="80" x2="50" y2="90" />
            <line x1="10" y1="50" x2="20" y2="50" />
            <line x1="80" y1="50" x2="90" y2="50" />
            <line x1="22" y1="22" x2="30" y2="30" />
            <line x1="70" y1="70" x2="78" y2="78" />
            <line x1="22" y1="78" x2="30" y2="70" />
            <line x1="70" y1="30" x2="78" y2="22" />
          </g>
          {/* Sun Core */}
          <circle cx="50" cy="50" r="24" fill="#FDE68A" />
          <circle cx="43" cy="46" r="2.5" fill="#B45309" />
          <circle cx="57" cy="46" r="2.5" fill="#B45309" />
          <path d="M44 54 Q50 60 56 54" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      <div className="doodle-item doodle-cloud-1">
        <svg width="140" height="70" viewBox="0 0 140 70" fill="none">
          <path
            d="M25 55 A18 18 0 0 1 35 22 A24 24 0 0 1 75 16 A28 28 0 0 1 115 28 A18 18 0 0 1 120 55 Z"
            fill="#E0F2FE"
            fillOpacity="0.75"
          />
        </svg>
      </div>

      {/* Top Right: Hot Air Balloon */}
      <div className="doodle-item doodle-balloon">
        <svg width="90" height="120" viewBox="0 0 90 120" fill="none">
          {/* Balloon Body */}
          <path
            d="M45 10 C22 10 12 30 12 50 C12 70 35 85 40 92 L50 92 C55 85 78 70 78 50 C78 30 68 10 45 10 Z"
            fill="#FED7AA"
            fillOpacity="0.85"
          />
          {/* Balloon Stripes */}
          <path
            d="M34 13 C26 25 24 55 36 90"
            stroke="#FB923C"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M56 13 C64 25 66 55 54 90"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Ropes */}
          <line x1="38" y1="92" x2="35" y2="105" stroke="#9A3412" strokeWidth="1.5" />
          <line x1="52" y1="92" x2="55" y2="105" stroke="#9A3412" strokeWidth="1.5" />
          {/* Basket */}
          <rect x="33" y="105" width="24" height="14" rx="3" fill="#D97706" fillOpacity="0.8" />
        </svg>
      </div>

      {/* Mid Left: Friendly Rocket & Small Planet */}
      <div className="doodle-item doodle-rocket">
        <svg width="80" height="90" viewBox="0 0 80 90" fill="none">
          {/* Fins */}
          <path d="M22 62 L12 75 L30 68 Z" fill="#F87171" fillOpacity="0.8" />
          <path d="M58 62 L68 75 L50 68 Z" fill="#F87171" fillOpacity="0.8" />
          {/* Rocket Body */}
          <path
            d="M40 15 C30 30 26 50 26 66 L54 66 C54 50 50 30 40 15 Z"
            fill="#E0E7FF"
            fillOpacity="0.9"
            stroke="#818CF8"
            strokeWidth="2"
          />
          {/* Window */}
          <circle cx="40" cy="40" r="7" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
          {/* Flame */}
          <path d="M34 66 Q40 85 46 66 Z" fill="#FBBF24" />
        </svg>
      </div>

      <div className="doodle-item doodle-planet">
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
          <ellipse cx="35" cy="35" rx="30" ry="10" stroke="#DDD6FE" strokeWidth="3" transform="rotate(-20 35 35)" />
          <circle cx="35" cy="35" r="16" fill="#C4B5FD" fillOpacity="0.75" />
        </svg>
      </div>

      {/* Mid Right: Rainbow & Floating Stars */}
      <div className="doodle-item doodle-rainbow">
        <svg width="120" height="70" viewBox="0 0 120 70" fill="none">
          <path d="M10 65 A50 50 0 0 1 110 65" stroke="#FCA5A5" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M20 65 A40 40 0 0 1 100 65" stroke="#FDE047" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M30 65 A30 30 0 0 1 90 65" stroke="#86EFAC" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 65 A20 20 0 0 1 80 65" stroke="#93C5FD" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Floating Magic Stars */}
      <div className="doodle-item doodle-star-1">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M15 0 L18 11 L29 15 L18 19 L15 30 L12 19 L1 15 L12 11 Z" fill="#FCD34D" fillOpacity="0.8" />
        </svg>
      </div>

      <div className="doodle-item doodle-star-2">
        <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
          <path d="M15 0 L18 11 L29 15 L18 19 L15 30 L12 19 L1 15 L12 11 Z" fill="#F472B6" fillOpacity="0.7" />
        </svg>
      </div>

      <div className="doodle-item doodle-star-3">
        <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
          <path d="M15 0 L18 11 L29 15 L18 19 L15 30 L12 19 L1 15 L12 11 Z" fill="#38BDF8" fillOpacity="0.75" />
        </svg>
      </div>

      {/* Bottom Floating Storybook & Paper Airplane */}
      <div className="doodle-item doodle-book">
        <svg width="70" height="50" viewBox="0 0 70 50" fill="none">
          {/* Left Page */}
          <path d="M35 15 C25 8 10 12 5 15 L5 42 C10 39 25 35 35 42 Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
          {/* Right Page */}
          <path d="M35 15 C45 8 60 12 65 15 L65 42 C60 39 45 35 35 42 Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
          {/* Spine */}
          <line x1="35" y1="15" x2="35" y2="42" stroke="#D97706" strokeWidth="2" />
        </svg>
      </div>

      <div className="doodle-item doodle-airplane">
        <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
          <path d="M5 25 L55 5 L35 45 L25 30 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />
          <path d="M25 30 L55 5 L35 30 Z" fill="#7DD3FC" stroke="#0284C7" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
