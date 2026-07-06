// Board üzerinde beliren oyun sonu paneli (overlay) — modal değil, board'un doğal devamı.

import { useEffect, useState } from "react";
import type { Rank } from "@/lib/ranks";

type GameOverPanelProps = {
  status: "won" | "lost";
  pegsLeft: number;
  onPlayAgain: () => void;
  rank: Rank;
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

const RANK_ICON_PATHS: Record<string, React.ReactNode> = {
  crown: (
    <path d="m3 8 4 4 5-7 5 7 4-4-2 10H5L3 8Z" />
  ),
  diamond: <path d="M12 3 3 10l9 11 9-11-9-7Z" />,
  up: <path d="m5 15 7-6 7 6M5 9l7-6 7 6" />,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  block: <rect x="4" y="4" width="16" height="16" rx="2" />,
  circle: <circle cx="12" cy="12" r="8" />,
  down: <path d="m5 9 7 6 7-6" />,
  minus: <path d="M5 12h14" />,
  downdown: <path d="m5 6 7 6 7-6M5 12l7 6 7-6" />,
  cross: <path d="M6 6l12 12M18 6 6 18" />,
};

function RankIcon({ iconKey }: { iconKey: string }) {
  const path = RANK_ICON_PATHS[iconKey] ?? RANK_ICON_PATHS.circle;
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {path}
    </svg>
  );
}

export default function GameOverPanel({
  status,
  pegsLeft,
  onPlayAgain,
  rank,
}: GameOverPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const pegLabel = pegsLeft === 1 ? "1 PEG" : `${pegsLeft} PEGS`;
  const statusLabel = status === "won" ? "WON" : "RUN COMPLETE";

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
          "flex flex-col items-center gap-3 px-6 py-6",
          "transition-all duration-250 ease-out",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        ].join(" ")}
        style={{ border: `1px solid ${rank.color}4d` }}
      >
        {/* Sonuç bloğu: ikon + isim + mesaj, sıkı grup */}
        <div className="flex flex-col items-center gap-2">
          <span
            style={{
              color: rank.color,
              filter:
                rank.glow > 0
                  ? `drop-shadow(0 0 ${6 * rank.glow}px ${rank.color})`
                  : "none",
            }}
          >
            <RankIcon iconKey={rank.icon} />
          </span>
          <span
            className="text-2xl font-led tracking-[0.1em] text-center"
            style={{
              color: rank.color,
              textShadow:
                rank.glow > 0
                  ? `0 0 ${6 * rank.glow}px ${rank.color}, 0 0 ${16 * rank.glow}px ${rank.color}`
                  : "none",
            }}
          >
            {rank.name}
          </span>
          <span className="text-[11px] font-mono italic text-brand-muted text-center">
            {rank.message}
          </span>
        </div>

        {/* Ayırıcı */}
        <span
          aria-hidden
          className="flex items-center gap-2 w-full"
        >
          <span
            className="h-px flex-1"
            style={{ backgroundImage: `linear-gradient(to right, transparent, ${rank.color}66)` }}
          />
          <span
            className="h-1 w-1 rounded-full shrink-0"
            style={{ backgroundColor: rank.color, boxShadow: `0 0 4px ${rank.color}cc` }}
          />
          <span
            className="h-px flex-1"
            style={{ backgroundImage: `linear-gradient(to left, transparent, ${rank.color}66)` }}
          />
        </span>

        {/* Meta satır */}
        <p className="text-xs font-mono tracking-wider text-brand-muted text-center">
          {pegLabel} · {statusLabel}
        </p>

        {/* Play again */}
        <button
          type="button"
          onClick={onPlayAgain}
          className={[
            "w-full py-3 rounded-full font-mono text-sm tracking-wider mt-3",
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
      </div>
    </div>
  );
}
