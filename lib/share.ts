// Oyun sonu paylaşım metni — X ve Farcaster aynı builder'ı kullanır.
// URL builder DIŞINDA tutulur: X'te metne gömülür, Farcaster'da ayrı embed olarak gider.

import { APP_URL, X_HANDLE, FC_HANDLE } from "@/lib/config";
import type { Rank } from "@/lib/ranks";

type Platform = "x" | "farcaster";

type Tone = "bold" | "mid" | "humble";

const CTA_BOLD = [
  "Can you beat me?",
  "Beat my score.",
  "Think you're better?",
  "Show me what you've got.",
];
const CTA_MID = ["Your turn.", "Let's see your run.", "Give it a shot."];
const CTA_HUMBLE = [
  "One more run?",
  "Your turn.",
  "Try it yourself.",
  "Think you can do better?",
];

const CTA_POOLS: Record<Tone, string[]> = {
  bold: CTA_BOLD,
  mid: CTA_MID,
  humble: CTA_HUMBLE,
};

const RANK_TONE: Record<string, Tone> = {
  "BASE MASTER": "bold",
  "DIAMOND HANDS": "bold",
  ONCHAIN: "bold",
  BASED: "bold",
  BUILDER: "mid",
  APPRENTICE: "mid",
  "PAPER HANDS": "humble",
  NGMI: "humble",
  "EXIT LIQUIDITY": "humble",
  REKT: "humble",
};

const SHARE_TEMPLATES: Record<string, string[]> = {
  "BASE MASTER": [
    "🏆 Flawless. BASE MASTER. Peg Solitaire on {handle}. {cta}",
    "🏆 BASE MASTER. {message} Peg Solitaire on {handle}. {cta}",
    "🏆 Just played Peg Solitaire on {handle}. Went BASE MASTER. {cta}",
    "🏆 Flawless.\nBASE MASTER achieved.\nPeg Solitaire on {handle}.",
  ],
  "DIAMOND HANDS": [
    "💎 DIAMOND HANDS. Peg Solitaire on {handle}. {cta}",
    "💎 One peg away from perfect.\nDIAMOND HANDS. Peg Solitaire on {handle}. {cta}",
    "💎 DIAMOND HANDS. {message} Peg Solitaire on {handle}.",
    "💎 So close to flawless. DIAMOND HANDS. Peg Solitaire on {handle}. {cta}",
  ],
  ONCHAIN: [
    "🚀 Built different. ONCHAIN. Peg Solitaire on {handle}. {cta}",
    "🚀 ONCHAIN. Peg Solitaire on {handle}. {cta}",
    "🚀 Built different.\nONCHAIN.\nPeg Solitaire on {handle}.",
    "🚀 Just played Peg Solitaire on {handle}. Went ONCHAIN. {cta}",
  ],
  BASED: [
    "🔵 BASED. Peg Solitaire on {handle}. {cta}",
    "🔵 A solid run. BASED. Peg Solitaire on {handle}. {cta}",
    "🔵 BASED. {message} Peg Solitaire on {handle}.",
    "🔵 Clean run. BASED. Peg Solitaire on {handle}. {cta}",
  ],
  BUILDER: [
    "🛠️ Still building. BUILDER. Peg Solitaire on {handle}. {cta}",
    "🛠️ BUILDER. Peg Solitaire on {handle}. {cta}",
    "🛠️ BUILDER. {message} Peg Solitaire on {handle}.",
    "🛠️ Building momentum. BUILDER. Peg Solitaire on {handle}. {cta}",
  ],
  APPRENTICE: [
    "📘 APPRENTICE. Peg Solitaire on {handle}. {cta}",
    "📘 Still learning. APPRENTICE. Peg Solitaire on {handle}. {cta}",
    "📘 APPRENTICE. {message} Peg Solitaire on {handle}.",
    "📘 Learning the craft. APPRENTICE. Peg Solitaire on {handle}. {cta}",
  ],
  "PAPER HANDS": [
    "📉 Folded early. PAPER HANDS. Peg Solitaire on {handle}. {cta}",
    "📉 PAPER HANDS. Peg Solitaire on {handle}. I'll be back.",
    "📉 PAPER HANDS. {message} Peg Solitaire on {handle}. {cta}",
    "📉 Lost momentum. PAPER HANDS. Peg Solitaire on {handle}. {cta}",
  ],
  NGMI: [
    "😬 NGMI. Peg Solitaire on {handle}. {cta}",
    "😬 Not this time. NGMI. Peg Solitaire on {handle}. {cta}",
    "😬 NGMI. {message} Peg Solitaire on {handle}.",
    "😬 Almost. NGMI. Peg Solitaire on {handle}. {cta}",
  ],
  "EXIT LIQUIDITY": [
    "💸 EXIT LIQUIDITY. Peg Solitaire on {handle}. Don't be like me.",
    "💸 Got dumped on. EXIT LIQUIDITY. Peg Solitaire on {handle}. {cta}",
    "💸 EXIT LIQUIDITY. {message} Peg Solitaire on {handle}.",
    "💸 Everyone else profited. Don't be like me. Peg Solitaire on {handle}.",
  ],
  REKT: [
    "💀 REKT. Peg Solitaire on {handle}. {cta}",
    "💀 Absolutely REKT. Peg Solitaire on {handle}. {cta}",
    "💀 REKT. {message} Peg Solitaire on {handle}.",
    "💀 Back to the drawing board. REKT. Peg Solitaire on {handle}.",
  ],
};

const FALLBACK_TEMPLATE = "Peg Solitaire on {handle}. {cta}";

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickShareVariant(rank: Rank): string {
  const templates = SHARE_TEMPLATES[rank.name] ?? [FALLBACK_TEMPLATE];
  const template = pickOne(templates);

  if (!template.includes("{cta}")) {
    return template;
  }

  const tone = RANK_TONE[rank.name] ?? "mid";
  const cta = pickOne(CTA_POOLS[tone]);
  return template.replace("{cta}", cta);
}

type ShareArgs = {
  rank: Rank;
  platform: Platform;
  pegsLeft?: number;
  template?: string;
};

export function buildShareText({ rank, platform, template }: ShareArgs): string {
  const handle = platform === "x" ? `@${X_HANDLE}` : `@${FC_HANDLE}`;
  const variant = template ?? pickShareVariant(rank);
  return variant.replace("{handle}", handle).replace("{message}", rank.message);
}

export { APP_URL };
