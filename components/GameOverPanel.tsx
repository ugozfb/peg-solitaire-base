// Board üzerinde beliren oyun sonu paneli (overlay) — modal değil, board'un doğal devamı.

import { useEffect, useState } from "react";

type GameOverPanelProps = {
  status: "won" | "lost";
  pegsLeft: number;
  onPlayAgain: () => void;
  accentColor?: string;
};

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

export default function GameOverPanel({
  status,
  pegsLeft,
  onPlayAgain,
  accentColor = "#5b9bff",
}: GameOverPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const title = status === "won" ? "YOU WIN" : "GAME OVER";
  const subtitle = pegsLeft === 1 ? "1 PEG LEFT" : `${pegsLeft} PEGS LEFT`;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      {/* Arka karartma */}
      <div
        className={[
          "absolute inset-0 bg-black/55 transition-opacity duration-250 ease-out",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* Panel kutusu */}
      <div
        className={[
          "relative w-full max-w-[280px] mx-4 rounded-2xl",
          "bg-[rgba(10,18,40,0.96)] backdrop-blur-md",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          "flex flex-col items-center gap-4 px-6 py-6",
          "transition-all duration-250 ease-out",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        ].join(" ")}
        style={{ border: `1px solid ${accentColor}4d` }}
      >
        {/* Başlık */}
        <div className="flex flex-col items-center gap-2">
          <span className="flex items-center gap-3 text-[10px] font-mono tracking-[0.25em] text-brand-muted">
            <span aria-hidden className="h-px w-6 bg-gradient-to-r from-transparent to-[#3b5a99]" />
            <span aria-hidden className="h-1 w-1 rounded-full bg-brand-muted [box-shadow:0_0_4px_rgba(107,140,206,0.8)]" />
            <span aria-hidden className="h-px w-6 bg-gradient-to-l from-transparent to-[#3b5a99]" />
          </span>
          <h2
            className="text-2xl font-led tracking-[0.15em]"
            style={{
              color: accentColor,
              textShadow: `0 0 6px ${accentColor}e6, 0 0 16px ${accentColor}8c`,
            }}
          >
            {title}
          </h2>
        </div>

        {/* Alt bilgi */}
        <p className="text-xs font-mono tracking-[0.15em] text-brand-muted">
          {subtitle}
        </p>

        {/* 5b: rank buraya */}
        <div className="min-h-[40px] w-full" />

        {/* Play again */}
        <button
          type="button"
          onClick={onPlayAgain}
          className={[
            "w-full py-3 rounded-full font-mono text-sm tracking-wider",
            "flex items-center justify-center gap-2",
            "border border-brand-primary/50 bg-black/40 text-brand-primary",
            "shadow-[0_0_12px_rgba(59,130,246,0.25),inset_0_0_8px_rgba(59,130,246,0.08)]",
            "active:scale-95 transition-transform",
          ].join(" ")}
        >
          <RestartIcon />
          PLAY AGAIN
        </button>

        {/* 5d: X + Farcaster share */}
        <div className="flex gap-3 w-full">
          <div className="flex-1 h-9 rounded-full border border-brand-dim/30" />
          <div className="flex-1 h-9 rounded-full border border-brand-dim/30" />
        </div>
      </div>
    </div>
  );
}
