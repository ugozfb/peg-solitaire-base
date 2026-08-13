// Board üzerinde beliren oyun sonu paneli (overlay) — modal değil, board'un doğal devamı.

import { useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import type { Rank } from "@/lib/ranks";
import { buildShareText, pickShareVariant, APP_URL } from "@/lib/share";

type GameOverPanelProps = {
  status: "won" | "lost";
  pegsLeft: number;
  onPlayAgain: () => void;
  onClose: () => void;
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

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FarcasterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724" />
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
  onClose,
  rank,
}: GameOverPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const pegLabel = pegsLeft === 1 ? "1 PEG" : `${pegsLeft} PEGS`;
  const statusLabel = status === "won" ? "WON" : "RUN COMPLETE";

  const shareTemplate = useMemo(() => pickShareVariant(rank), [rank]);

  const handleShareX = () => {
    const text = buildShareText({ rank, platform: "x", template: shareTemplate });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + "\n" + APP_URL)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareFarcaster = async () => {
    const text = buildShareText({ rank, platform: "farcaster", template: shareTemplate });
    try {
      const capabilities = await sdk.getCapabilities();
      if (capabilities.includes("actions.composeCast")) {
        await sdk.actions.composeCast({ text, embeds: [APP_URL] });
        return;
      }
    } catch {
      // Mini App host değil / SDK erişilemez — web fallback'e düş
    }
    const url = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(APP_URL)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
        {/* Kapat butonu */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className={[
            "absolute top-2 right-2 flex items-center justify-center",
            "w-7 h-7 rounded-full text-brand-muted",
            "hover:bg-white/10 hover:text-white active:scale-90 transition-colors",
          ].join(" ")}
        >
          <CloseIcon />
        </button>

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

        {/* 5d: Share */}
        <div className="flex items-center justify-center gap-3 w-full mt-1">
          <button
            type="button"
            onClick={handleShareX}
            aria-label="Share on X"
            className={[
              "flex items-center justify-center flex-1 py-2.5 rounded-full",
              "border border-white/15 bg-white/5 text-brand-muted",
              "active:scale-95 transition-transform",
            ].join(" ")}
          >
            <XIcon />
          </button>
          <button
            type="button"
            onClick={handleShareFarcaster}
            aria-label="Share on Farcaster"
            className={[
              "flex items-center justify-center flex-1 py-2.5 rounded-full",
              "border border-white/15 bg-white/5 text-brand-muted",
              "active:scale-95 transition-transform",
            ].join(" ")}
          >
            <FarcasterIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
