// Peg Solitaire - Game Engine
// Saf TypeScript, side-effect yok, immutable. UI/blockchain bağımlılığı yok.
//
// Tüm public fonksiyonlar mevcut state'i DEĞİŞTİRMEZ; yeni bir state döner.

import type {
  BoardCell,
  BoardLayout,
  GameState,
  Move,
  Position,
  RuleSet,
} from "./types";

// ---------------------------------------------------------------------------
// Yön tanımları
// ---------------------------------------------------------------------------
//
// Her yön bir "adım" vektörüdür (drow, dcol). Bir atlama hareketinde:
//   over = from + 1*adım
//   to   = from + 2*adım
//
// Orthogonal: 4 yön (yukarı/aşağı/sol/sağ).
// Triangular: sol-hizalı üçgen grid üzerinde 6 komşu yönü:
//
//        (0,0)
//      (1,0)(1,1)
//    (2,0)(2,1)(2,2)
//
//   sol            : (0,-1)
//   sağ            : (0,+1)
//   sol-üst        : (-1,-1)
//   sağ-üst        : (-1, 0)
//   sol-alt        : (+1, 0)
//   sağ-alt        : (+1,+1)

type Step = { dRow: number; dCol: number };

const ORTHOGONAL_STEPS: Step[] = [
  { dRow: -1, dCol: 0 }, // yukarı
  { dRow: 1, dCol: 0 }, // aşağı
  { dRow: 0, dCol: -1 }, // sol
  { dRow: 0, dCol: 1 }, // sağ
];

const TRIANGULAR_STEPS: Step[] = [
  { dRow: 0, dCol: -1 }, // sol
  { dRow: 0, dCol: 1 }, // sağ
  { dRow: -1, dCol: -1 }, // sol-üst
  { dRow: -1, dCol: 0 }, // sağ-üst
  { dRow: 1, dCol: 0 }, // sol-alt
  { dRow: 1, dCol: 1 }, // sağ-alt
];

/** Kural setine göre geçerli atlama yönlerini döner. */
function stepsForRuleSet(ruleSet: RuleSet): Step[] {
  return ruleSet === "triangular" ? TRIANGULAR_STEPS : ORTHOGONAL_STEPS;
}

// ---------------------------------------------------------------------------
// Yardımcı (private) fonksiyonlar
// ---------------------------------------------------------------------------

/** Board'un derin (immutable-safe) kopyasını döner. */
function cloneBoard(board: BoardCell[][]): BoardCell[][] {
  return board.map((row) => row.slice());
}

/** İki konum aynı mı? */
function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Konum grid sınırları içinde mi? */
function inBounds(board: BoardCell[][], pos: Position): boolean {
  return (
    pos.row >= 0 &&
    pos.row < board.length &&
    pos.col >= 0 &&
    pos.col < board[pos.row].length
  );
}

/** Konumdaki hücre değerini döner (sınır dışı ise undefined). */
function cellAt(board: BoardCell[][], pos: Position): BoardCell | undefined {
  if (!inBounds(board, pos)) return undefined;
  return board[pos.row][pos.col];
}

/**
 * State içindeki ruleSet'i bulmak için layout gerekir; ancak GameState layout
 * tutmaz. Bu yüzden ruleSet'i state'e gömmek yerine engine fonksiyonları
 * ruleSet'i parametre olarak alabilir... Ancak imza sade tutulduğundan,
 * ruleSet bilgisini board'dan türetemeyiz. Çözüm: ruleSet'i GameState'e
 * eklemeden, getValidMoves/isValidMove fonksiyonlarına ruleSet parametresi
 * vermek yerine board geometrisi sabit kabul edilir.
 *
 * NOT: Aşağıdaki public fonksiyonlar ruleSet'i opsiyonel parametre olarak
 * alır; verilmezse "orthogonal" varsayılır (Tahta 1-5).
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Board'u layout'a göre kurar; initialEmpty pozisyonunu boş yapar.
 * Layout grid'i "peg"/"blocked" içerebilir; initialEmpty hücresi "empty"
 * yapılır.
 */
export function initializeGame(layout: BoardLayout): GameState {
  const board = cloneBoard(layout.grid);

  // Başlangıç boşluğunu uygula (sınır içinde ve blocked değilse).
  const { initialEmpty } = layout;
  if (inBounds(board, initialEmpty)) {
    board[initialEmpty.row][initialEmpty.col] = "empty";
  }

  const state: GameState = {
    board,
    moves: [],
    selectedPeg: null,
    status: "playing",
  };

  return state;
}

/**
 * resetGame: initializeGame ile aynı davranır (semantik amaçlı ayrı isim).
 */
export function resetGame(layout: BoardLayout): GameState {
  return initializeGame(layout);
}

/**
 * Belirli bir peg için tüm geçerli HEDEF (to) pozisyonlarını döner.
 * Bir hedef geçerlidir eğer:
 *   - from konumunda bir peg varsa
 *   - over (aradaki) konumunda bir peg varsa
 *   - to konumu grid içinde, "empty" ise
 *
 * ruleSet verilmezse "orthogonal" varsayılır.
 */
export function getValidMoves(
  state: GameState,
  from: Position,
  ruleSet: RuleSet = "orthogonal"
): Position[] {
  const { board } = state;

  // from bir peg değilse hamle yok.
  if (cellAt(board, from) !== "peg") return [];

  const targets: Position[] = [];

  for (const step of stepsForRuleSet(ruleSet)) {
    const over: Position = {
      row: from.row + step.dRow,
      col: from.col + step.dCol,
    };
    const to: Position = {
      row: from.row + 2 * step.dRow,
      col: from.col + 2 * step.dCol,
    };

    if (cellAt(board, over) === "peg" && cellAt(board, to) === "empty") {
      targets.push(to);
    }
  }

  return targets;
}

/**
 * Bir hamlenin kurallara uygun olup olmadığını kontrol eder.
 * Kontrol edilenler:
 *   - from peg, over peg, to empty
 *   - over gerçekten from ile to ortasında (geometrik tutarlılık)
 *   - adım uzunluğu ruleSet'e uygun bir atlama (mesafe 2)
 */
export function isValidMove(
  state: GameState,
  move: Move,
  ruleSet: RuleSet = "orthogonal"
): boolean {
  const { board } = state;
  const { from, over, to } = move;

  // Hücre durumları doğru mu?
  if (cellAt(board, from) !== "peg") return false;
  if (cellAt(board, over) !== "peg") return false;
  if (cellAt(board, to) !== "empty") return false;

  // over, from ve to'nun tam ortasında olmalı.
  const midRow = (from.row + to.row) / 2;
  const midCol = (from.col + to.col) / 2;
  if (over.row !== midRow || over.col !== midCol) return false;

  // Atlama, ruleSet'in izin verdiği yönlerden biri olmalı.
  const step: Step = {
    dRow: (to.row - from.row) / 2,
    dCol: (to.col - from.col) / 2,
  };
  const allowed = stepsForRuleSet(ruleSet).some(
    (s) => s.dRow === step.dRow && s.dCol === step.dCol
  );

  return allowed;
}

/**
 * Hamleyi uygular ve YENİ state döner (mevcut state değişmez):
 *   - from -> empty
 *   - over -> empty (atlanan peg kaldırılır)
 *   - to   -> peg
 *   - moves listesine eklenir
 *   - selectedPeg temizlenir
 *   - status güncellenir (tek peg -> "won", hamle kalmadı -> "lost")
 *
 * Geçersiz hamlede state değiştirilmeden aynen döner.
 */
export function applyMove(
  state: GameState,
  move: Move,
  ruleSet: RuleSet = "orthogonal"
): GameState {
  if (!isValidMove(state, move, ruleSet)) {
    return state; // Geçersiz hamle -> değişiklik yok.
  }

  const board = cloneBoard(state.board);
  board[move.from.row][move.from.col] = "empty";
  board[move.over.row][move.over.col] = "empty";
  board[move.to.row][move.to.col] = "peg";

  const newState: GameState = {
    board,
    moves: [...state.moves, move],
    selectedPeg: null,
    status: "playing",
  };

  // Tek peg kaldıysa kazanıldı; hamle kalmadıysa kaybedildi.
  if (countPegs(newState) === 1) {
    newState.status = "won";
  } else if (isGameOver(newState, ruleSet)) {
    newState.status = "lost";
  }

  return newState;
}

/**
 * Son hamleyi geri alır ve YENİ state döner:
 *   - to   -> empty
 *   - over -> peg (geri eklenir)
 *   - from -> peg
 *   - moves listesinden son hamle çıkarılır
 *
 * Hamle yoksa state aynen döner.
 */
export function undoLastMove(state: GameState): GameState {
  if (state.moves.length === 0) return state;

  const lastMove = state.moves[state.moves.length - 1];
  const board = cloneBoard(state.board);

  board[lastMove.to.row][lastMove.to.col] = "empty";
  board[lastMove.over.row][lastMove.over.col] = "peg";
  board[lastMove.from.row][lastMove.from.col] = "peg";

  const newState: GameState = {
    board,
    moves: state.moves.slice(0, -1),
    selectedPeg: null,
    status: "playing", // Geri alma sonrası oyun tamamlanmış olamaz.
  };

  return newState;
}

/**
 * Tahtada hiçbir peg için geçerli hamle kalmadıysa true döner.
 * ruleSet verilmezse "orthogonal" varsayılır.
 */
export function isGameOver(
  state: GameState,
  ruleSet: RuleSet = "orthogonal"
): boolean {
  const { board } = state;

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] !== "peg") continue;
      if (getValidMoves(state, { row, col }, ruleSet).length > 0) {
        return false; // En az bir geçerli hamle var.
      }
    }
  }

  return true;
}

/** Tahtada kalan peg sayısını döner. */
export function countPegs(state: GameState): number {
  let count = 0;
  for (const row of state.board) {
    for (const cell of row) {
      if (cell === "peg") count++;
    }
  }
  return count;
}

/**
 * Seçili peg'i ayarlar (UI için). YENİ state döner.
 * - Verilen konumda peg yoksa seçim temizlenir (null).
 * - Aynı peg tekrar seçilirse seçim kaldırılır (toggle).
 */
export function selectPeg(state: GameState, pos: Position): GameState {
  // Peg değilse seçimi temizle.
  if (cellAt(state.board, pos) !== "peg") {
    return { ...state, selectedPeg: null };
  }

  // Aynı peg'e tekrar tıklanırsa seçimi kaldır (toggle).
  if (state.selectedPeg && positionsEqual(state.selectedPeg, pos)) {
    return { ...state, selectedPeg: null };
  }

  return { ...state, selectedPeg: { row: pos.row, col: pos.col } };
}
