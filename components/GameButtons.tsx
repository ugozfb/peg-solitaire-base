// Undo + Restart butonları (yan yana, retro stil).

type GameButtonsProps = {
  onUndo: () => void;
  onRestart: () => void;
  canUndo: boolean;
};

export default function GameButtons({
  onUndo,
  onRestart,
  canUndo,
}: GameButtonsProps) {
  return (
    <div className="flex gap-3 w-full max-w-[380px] mx-auto">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={[
          "flex-1 py-2.5 rounded-md font-mono text-sm tracking-wider",
          "border border-[#2563EB]/40 bg-black/40 text-[#2563EB]",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "active:scale-95 transition-transform",
        ].join(" ")}
      >
        UNDO
      </button>
      <button
        type="button"
        onClick={onRestart}
        className={[
          "flex-1 py-2.5 rounded-md font-mono text-sm tracking-wider",
          "border border-[#2563EB]/40 bg-black/40 text-[#2563EB]",
          "active:scale-95 transition-transform",
        ].join(" ")}
      >
        RESTART
      </button>
    </div>
  );
}
