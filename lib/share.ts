// Oyun sonu paylaşım metni — X ve Farcaster aynı builder'ı kullanır.
// URL builder DIŞINDA tutulur: X'te metne gömülür, Farcaster'da ayrı embed olarak gider.

import { APP_URL, X_HANDLE, FC_HANDLE } from "@/lib/config";
import type { Rank } from "@/lib/ranks";

type Platform = "x" | "farcaster";

type ShareArgs = {
  rank: Rank;
  pegsLeft: number;
  platform: Platform;
};

export function buildShareText({ rank, pegsLeft, platform }: ShareArgs): string {
  const handle = platform === "x" ? `@${X_HANDLE}` : `@${FC_HANDLE}`;
  const pegLabel = pegsLeft === 1 ? "1 peg" : `${pegsLeft} pegs`;
  return [
    `Peg Solitaire on ${handle}`,
    `🏆 ${rank.name}`,
    `${pegLabel} remaining.`,
    `Can you beat me?`,
  ].join("\n");
}

export { APP_URL };
