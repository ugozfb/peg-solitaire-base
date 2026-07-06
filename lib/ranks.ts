// Oyun sonu rank tablosu — kalan peg sayısına göre performans derecelendirmesi.

export type Rank = {
  peg: number;
  name: string;
  color: string;
  glow: number;
  message: string;
  icon: string;
};

const RANKS: Rank[] = [
  { peg: 1, name: "BASE MASTER", color: "#FFD54A", glow: 1.0, message: "A flawless performance.", icon: "crown" },
  { peg: 2, name: "DIAMOND HANDS", color: "#6EE7FF", glow: 0.9, message: "Almost perfect execution.", icon: "diamond" },
  { peg: 3, name: "ONCHAIN", color: "#4DA3FF", glow: 0.8, message: "Built different.", icon: "up" },
  { peg: 4, name: "BASED", color: "#3B82F6", glow: 0.6, message: "A solid run.", icon: "bolt" },
  { peg: 5, name: "BUILDER", color: "#8B5CF6", glow: 0.5, message: "Building momentum.", icon: "block" },
  { peg: 6, name: "APPRENTICE", color: "#94A3B8", glow: 0.4, message: "Learning the craft.", icon: "circle" },
  { peg: 7, name: "PAPER HANDS", color: "#FBBF24", glow: 0.3, message: "Lost momentum.", icon: "down" },
  { peg: 8, name: "NGMI", color: "#F97316", glow: 0.2, message: "Needs another attempt.", icon: "minus" },
  { peg: 9, name: "EXIT LIQUIDITY", color: "#EF4444", glow: 0.15, message: "Everyone else profited.", icon: "downdown" },
  { peg: 10, name: "REKT", color: "#B91C1C", glow: 0.0, message: "Back to the drawing board.", icon: "cross" },
];

export function getRank(pegsLeft: number): Rank {
  if (pegsLeft <= 1) return RANKS[0];
  if (pegsLeft >= 10) return RANKS[RANKS.length - 1];
  return RANKS[pegsLeft - 1];
}
