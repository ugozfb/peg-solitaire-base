// Ad-hoc doğrulama: buildShareText'in beklenen alanları içerdiğini kontrol eder.
// Çalıştır: npx tsx lib/test-share.ts

import { buildShareText } from "./share";
import { X_HANDLE, FC_HANDLE } from "./config";
import type { Rank } from "./ranks";

const mockRank: Rank = {
  peg: 3,
  name: "ONCHAIN",
  color: "#4DA3FF",
  glow: 0.8,
  message: "Built different.",
  icon: "up",
};

const xText = buildShareText({ rank: mockRank, pegsLeft: 3, platform: "x" });
const fcText = buildShareText({ rank: mockRank, pegsLeft: 3, platform: "farcaster" });

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

assert(xText.includes(mockRank.name), "X text should include rank name");
assert(xText.includes(`@${X_HANDLE}`), "X text should include X handle");
assert(fcText.includes(mockRank.name), "Farcaster text should include rank name");
assert(fcText.includes(`@${FC_HANDLE}`), "Farcaster text should include Farcaster handle");

console.log("--- X ---");
console.log(xText);
console.log("\n--- Farcaster ---");
console.log(fcText);
console.log("\nAll assertions passed.");
