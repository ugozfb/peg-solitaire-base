// French / European Peg Solitaire tahtası (37 delik, kademeli kollu haç).
//
// 7x7 grid; English haçına 4 kolun köşelerine birer delik eklenmiş.
// English'te blocked olan (1,1)(1,5)(5,1)(5,5) burada peg.
// Başlangıç boş deliği (2,3) — merkez (3,3) French'te çözülemez olduğu için
// merkez-dışı bir delik seçildi.
//
//   Grid (B=blocked, P=peg, (2,3) başlangıçta empty):
//     B B P P P B B
//     B P P P P P B
//     P P P . P P P   <- (2,3) initialEmpty
//     P P P P P P P
//     P P P P P P P
//     B P P P P P B
//     B B P P P B B
//
// Toplam: 3+5+7+7+7+5+3 = 37 delik; 37 - 1 (boş) = 36 peg.

import type { BoardCell, BoardLayout } from "../types";

const B: BoardCell = "blocked";
const P: BoardCell = "peg";

const grid: BoardCell[][] = [
  [B, B, P, P, P, B, B],
  [B, P, P, P, P, P, B],
  [P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P],
  [B, P, P, P, P, P, B],
  [B, B, P, P, P, B, B],
];

export const frenchBoard: BoardLayout = {
  id: "french",
  name: "French",
  grid,
  initialEmpty: { row: 2, col: 3 },
  ruleSet: "orthogonal",
};
