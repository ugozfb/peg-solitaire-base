// Triangular Peg Solitaire tahtası (15 delik, 5-kenarlı üçgen).
//
// Sol-hizalı üçgen: satır r'de (r+1) delik, col 0..r doludur; sağ taraf blocked.
// gameEngine TRIANGULAR_STEPS bu sol-hizalı düzene göre 6 komşu tanımlar.
// Tepe (0,0) başlangıçta boştur (klasik Cracker Barrel açılışı).
//
//   Grid (B=blocked, P=peg, tepe başlangıçta empty):
//     P B B B B      <- (0,0) initialEmpty
//     P P B B B
//     P P P B B
//     P P P P B
//     P P P P P
//
// Toplam: 1+2+3+4+5 = 15 delik; 15 - 1 (boş) = 14 peg.
import type { BoardCell, BoardLayout } from "../types";

const B: BoardCell = "blocked";
const P: BoardCell = "peg";

const grid: BoardCell[][] = [
  [P, B, B, B, B],
  [P, P, B, B, B],
  [P, P, P, B, B],
  [P, P, P, P, B],
  [P, P, P, P, P],
];

export const triangularBoard: BoardLayout = {
  id: "triangular",
  name: "Triangular",
  grid,
  initialEmpty: { row: 0, col: 0 },
  ruleSet: "triangular",
};
