// English Peg Solitaire tahtası (33 delik, klasik haç).
//
// 7x7 grid; dört köşede 2x2 "blocked" bölgeler haç şeklini oluşturur.
// Merkez (row 3, col 3) başlangıçta boştur.
//
//   Grid (B=blocked, P=peg, merkez başlangıçta empty):
//     B B P P P B B
//     B B P P P B B
//     P P P P P P P
//     P P P . P P P   <- (3,3) initialEmpty
//     P P P P P P P
//     B B P P P B B
//     B B P P P B B
//
// Toplam: 49 - 16 (blocked) = 33 delik; 33 - 1 (boş) = 32 peg.

import type { BoardCell, BoardLayout } from "../types";

const B: BoardCell = "blocked";
const P: BoardCell = "peg";

const grid: BoardCell[][] = [
  [B, B, P, P, P, B, B],
  [B, B, P, P, P, B, B],
  [P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P],
  [B, B, P, P, P, B, B],
  [B, B, P, P, P, B, B],
];

export const englishBoard: BoardLayout = {
  id: "english",
  name: "English",
  grid,
  initialEmpty: { row: 3, col: 3 },
  ruleSet: "orthogonal",
};
