// Alt navigasyon yer tutucu: Play / Boards / Leaderboard / Profile.
// Henüz aktif değil — sadece görsel.

const ITEMS = ["Play", "Boards", "Leaderboard", "Profile"];

function PlayIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  );
}

function BoardsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

function LeaderboardIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5a2 2 0 0 0 2 4" />
      <path d="M16 5h3a2 2 0 0 1-2 4" />
      <path d="M12 14v3" />
      <path d="M9 20h6" />
      <path d="M10 17h4v3h-4z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

const ICONS = [PlayIcon, BoardsIcon, LeaderboardIcon, ProfileIcon];

export default function BottomNav() {
  return (
    <nav className="relative w-full bg-black/60">
      <span
        aria-hidden
        className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-brand-dim to-transparent"
      />
      <div className="grid grid-cols-4 max-w-[380px] mx-auto">
        {ITEMS.map((item, idx) => {
          const Icon = ICONS[idx];
          return (
            <div
              key={item}
              className={[
                "flex flex-col items-center justify-center gap-1 py-2",
                "text-center text-[10px] font-mono tracking-wider",
                idx === 0
                  ? "text-brand-primary [text-shadow:0_0_8px_rgba(59,130,246,0.5)]"
                  : "text-brand-dim",
              ].join(" ")}
            >
              <Icon />
              {item.toUpperCase()}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
