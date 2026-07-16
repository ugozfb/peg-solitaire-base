// Tüm tahta tanımlarının tek merkezden erişildiği registry.
// Key'ler contract'taki board ID'leriyle eşleşir.

import type { BoardLayout } from "../types";
import { englishBoard } from "./english";
import { triangularBoard } from "./triangular";
import { frenchBoard } from "./french";
import { diamondBoard } from "./diamond";
import { asymmetricalBoard } from "./asymmetrical";
import { wieglebBoard } from "./wiegleb";

export const BOARDS: Record<number, BoardLayout> = {
  1: englishBoard,
  2: triangularBoard,
  3: frenchBoard,
  4: diamondBoard,
  5: asymmetricalBoard,
  6: wieglebBoard,
};

export const BOARD_LIST: BoardLayout[] = Object.values(BOARDS);
