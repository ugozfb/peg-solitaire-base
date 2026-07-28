// Asymmetrical Peg Solitaire tahtası (39 delik, George Bell 3-2-3-2).
//
// 8x8 grid; kol uzunlukları dönüşümlü (üst 3, sol 2, alt 2, sağ 3) —
// bu yüzden simetrik değil. Dikey kol col 2-4, yatay kol row 3-5.
// Başlangıç boş deliği (4,3).
//
//   Grid (B=blocked, P=peg, (4,3) başlangıçta empty):
//     B B P P P B B B
//     B B P P P B B B
//     B B P P P B B B
//     P P P P P P P P
//     P P P . P P P P   <- (4,3) initialEmpty
//     P P P P P P P P
//     B B P P P B B B
//     B B P P P B B B
//
// Toplam: 3+3+3+8+8+8+3+3 = 39 delik; 39 - 1 (boş) = 38 peg.

import type { BoardCell, BoardLayout } from "../types";

const B: BoardCell = "blocked";
const P: BoardCell = "peg";

const grid: BoardCell[][] = [
  [B, B, P, P, P, B, B, B],
  [B, B, P, P, P, B, B, B],
  [B, B, P, P, P, B, B, B],
  [P, P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P, P],
  [B, B, P, P, P, B, B, B],
  [B, B, P, P, P, B, B, B],
];

export const asymmetricalBoard: BoardLayout = {
  id: "asymmetrical",
  name: "Asymmetrical",
  grid,
  initialEmpty: { row: 4, col: 3 },
  ruleSet: "orthogonal",
};
