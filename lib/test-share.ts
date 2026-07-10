// Ad-hoc doğrulama: pickShareVariant + buildShareText'in beklenen alanları
// içerdiğini ve ham placeholder bırakmadığını kontrol eder.
// Çalıştır: npx tsx lib/test-share.ts

import { buildShareText, pickShareVariant } from "./share";
import { X_HANDLE, FC_HANDLE } from "./config";
import type { Rank } from "./ranks";

const RANKS: Rank[] = [
  { peg: 1, name: "BASE MASTER", color: "#FFD54A", glow: 1.0, message: "A flawless performance.", icon: "crown" },
  { peg: 6, name: "APPRENTICE", color: "#94A3B8", glow: 0.4, message: "Learning the craft.", icon: "circle" },
  { peg: 10, name: "REKT", color: "#B91C1C", glow: 0.0, message: "Back to the drawing board.", icon: "cross" },
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const RAW_PLACEHOLDERS = ["{handle}", "{message}", "{cta}"];

for (const rank of RANKS) {
  console.log(`\n=== ${rank.name} ===`);

  for (let i = 0; i < 3; i++) {
    const variant = pickShareVariant(rank);
    console.log(`variant[${i}]: ${JSON.stringify(variant)}`);
  }

  const xText = buildShareText({ rank, platform: "x" });
  const fcText = buildShareText({ rank, platform: "farcaster" });

  console.log("--- X ---");
  console.log(xText);
  console.log("--- Farcaster ---");
  console.log(fcText);

  for (const placeholder of RAW_PLACEHOLDERS) {
    assert(!xText.includes(placeholder), `X text should not contain raw ${placeholder}`);
    assert(!fcText.includes(placeholder), `Farcaster text should not contain raw ${placeholder}`);
  }
  assert(xText.includes(`@${X_HANDLE}`), "X text should include X handle");
  assert(fcText.includes(`@${FC_HANDLE}`), "Farcaster text should include Farcaster handle");
}

console.log("\nAll assertions passed.");
