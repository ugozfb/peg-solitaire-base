// Diamond Peg Solitaire tahtası (41 delik, elmas/baklava).
//
// 9x9 grid; elmas şekli köşeleri blocked bırakarak oluşturulur
// (9x9 kare grid'in köşegenleri). Merkez (4,4) başlangıçta boş.
//
//   Grid (B=blocked, P=peg, merkez başlangıçta empty):
//     B B B B P B B B B
//     B B B P P P B B B
//     B B P P P P P B B
//     B P P P P P P P B
//     P P P P . P P P P   <- (4,4) initialEmpty
//     B P P P P P P P B
//     B B P P P P P B B
//     B B B P P P B B B
//     B B B B P B B B B
//
// Toplam: 1+3+5+7+9+7+5+3+1 = 41 delik; 41 - 1 (boş) = 40 peg.

import type { BoardCell, BoardLayout } from "../types";

const B: BoardCell = "blocked";
const P: BoardCell = "peg";

const grid: BoardCell[][] = [
  [B, B, B, B, P, B, B, B, B],
  [B, B, B, P, P, P, B, B, B],
  [B, B, P, P, P, P, P, B, B],
  [B, P, P, P, P, P, P, P, B],
  [P, P, P, P, P, P, P, P, P],
  [B, P, P, P, P, P, P, P, B],
  [B, B, P, P, P, P, P, B, B],
  [B, B, B, P, P, P, B, B, B],
  [B, B, B, B, P, B, B, B, B],
];

export const diamondBoard: BoardLayout = {
  id: "diamond",
  name: "Diamond",
  grid,
  initialEmpty: { row: 4, col: 4 },
  ruleSet: "orthogonal",
};
