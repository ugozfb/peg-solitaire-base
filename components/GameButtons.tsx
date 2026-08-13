// Undo + Restart butonları (yan yana, retro stil).

type GameButtonsProps = {
  onUndo: () => void;
  onRestart: () => void;
  canUndo: boolean;
  canRestart: boolean;
};

function UndoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export default function GameButtons({
  onUndo,
  onRestart,
  canUndo,
  canRestart,
}: GameButtonsProps) {
  return (
    <div className="flex gap-3 w-full max-w-[380px] mx-auto mt-8">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={[
          "flex-1 py-3 rounded-full font-mono text-sm tracking-wider",
          "flex items-center justify-center gap-2",
          "border border-brand-dim/50 bg-black/40 text-brand-muted",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "active:scale-95 transition-transform",
        ].join(" ")}
      >
        <UndoIcon />
        UNDO
      </button>
      <button
        type="button"
        onClick={onRestart}
        disabled={!canRestart}
        className={[
          "flex-1 py-3 rounded-full font-mono text-sm tracking-wider",
          "flex items-center justify-center gap-2",
          "border border-brand-primary/50 bg-black/40 text-brand-primary",
          "shadow-[0_0_12px_rgba(59,130,246,0.25),inset_0_0_8px_rgba(59,130,246,0.08)]",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "active:scale-95 transition-transform",
        ].join(" ")}
      >
        <RestartIcon />
        RESTART
      </button>
    </div>
  );
}
