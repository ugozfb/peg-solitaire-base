// Wiegleb (German) Peg Solitaire tahtası (45 delik, geniş kollu haç).
//
// 9x9 grid; English haçının kolları uzatılmış hali (J.C. Wiegleb, 1779).
// Dikey kol col 3-5, yatay kol row 3-5, tüm kollar 3 uzunlukta (simetrik).
// Merkez (4,4) başlangıçta boş.
//
//   Grid (B=blocked, P=peg, merkez başlangıçta empty):
//     B B B P P P B B B
//     B B B P P P B B B
//     B B B P P P B B B
//     P P P P P P P P P
//     P P P P . P P P P   <- (4,4) initialEmpty
//     P P P P P P P P P
//     B B B P P P B B B
//     B B B P P P B B B
//     B B B P P P B B B
//
// Toplam: 3+3+3+9+9+9+3+3+3 = 45 delik; 45 - 1 (boş) = 44 peg.

import type { BoardCell, BoardLayout } from "../types";

const B: BoardCell = "blocked";
const P: BoardCell = "peg";

const grid: BoardCell[][] = [
  [B, B, B, P, P, P, B, B, B],
  [B, B, B, P, P, P, B, B, B],
  [B, B, B, P, P, P, B, B, B],
  [P, P, P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P, P, P],
  [B, B, B, P, P, P, B, B, B],
  [B, B, B, P, P, P, B, B, B],
  [B, B, B, P, P, P, B, B, B],
];

export const wieglebBoard: BoardLayout = {
  id: "wiegleb",
  name: "Wiegleb",
  grid,
  initialEmpty: { row: 4, col: 4 },
  ruleSet: "orthogonal",
};
