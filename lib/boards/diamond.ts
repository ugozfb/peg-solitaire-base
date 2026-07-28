// Diamond Peg Solitaire tahtası (41 delik, elmas/baklava).
//
// 9x9 grid; elmas şekli köşeleri blocked bırakarak oluşturulur
// (9x9 kare grid'in köşegenleri). Başlangıç boş deliği (1,3).
//
// Merkez (4,4) matematiksel olarak çözülemez (Diamond41 null-class
// değildir). (1,3) Bell'in d2 açılışı; 26 hamlede çözülür, son peg
// (1,5)'te biter.
// Kaynak: gibell.net/pegsolitaire/Catalogs/Diamond41
//
//   Grid (B=blocked, P=peg, (1,3) başlangıçta empty):
//     B B B B P B B B B
//     B B B . P P B B B   <- (1,3) initialEmpty
//     B B P P P P P B B
//     B P P P P P P P B
//     P P P P P P P P P
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
  initialEmpty: { row: 1, col: 3 },
  ruleSet: "orthogonal",
};
