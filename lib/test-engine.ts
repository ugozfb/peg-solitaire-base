// Game Engine test script (framework gerektirmez).
// Çalıştırma:
//   npx tsx lib/test-engine.ts
//   (veya derleyip node ile)
//
// Vitest/Jest kurulu olmadığı için basit bir assert mekanizması kullanılır.

import {
  applyMove,
  countPegs,
  getValidMoves,
  initializeGame,
  isGameOver,
  isValidMove,
  selectPeg,
  undoLastMove,
} from "./gameEngine";
import { englishBoard } from "./boards/english";
import type { Move } from "./types";

const RULE = englishBoard.ruleSet;

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

function eq<T>(name: string, actual: T, expected: T): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    console.error(`    beklenen: ${JSON.stringify(expected)}`);
    console.error(`    gerçek:   ${JSON.stringify(actual)}`);
  }
  check(name, ok);
}

console.log("Peg Solitaire - Game Engine Testleri\n");

// ---------------------------------------------------------------------------
// 1) Initialize
// ---------------------------------------------------------------------------
console.log("1) initializeGame");
{
  const state = initializeGame(englishBoard);
  eq("32 peg ile başlar", countPegs(state), 32);
  eq("merkez (3,3) boştur", state.board[3][3], "empty");
  eq("hamle geçmişi boş", state.moves.length, 0);
  eq("seçili peg yok", state.selectedPeg, null);
  eq("oyun tamamlanmamış", state.status, "playing");
  // Toplam delik (peg + empty) = 33.
  let holes = 0;
  for (const r of state.board) for (const c of r) if (c !== "blocked") holes++;
  eq("toplam 33 delik", holes, 33);
}

// ---------------------------------------------------------------------------
// 2) Merkez etrafındaki ilk geçerli hamleler
// ---------------------------------------------------------------------------
console.log("\n2) getValidMoves (ilk hamleler)");
{
  const state = initializeGame(englishBoard);

  // (3,3) boş. Onu doldurabilecek 4 peg: (1,3) yukarı, (5,3) aşağı,
  // (3,1) sol, (3,5) sağ. Bu peg'lerin hedefi (3,3) olmalı.
  const upMoves = getValidMoves(state, { row: 1, col: 3 }, RULE);
  check(
    "(1,3) peg'i (3,3)'e atlayabilir",
    upMoves.some((p) => p.row === 3 && p.col === 3)
  );

  const leftMoves = getValidMoves(state, { row: 3, col: 1 }, RULE);
  check(
    "(3,1) peg'i (3,3)'e atlayabilir",
    leftMoves.some((p) => p.row === 3 && p.col === 3)
  );

  // Başlangıçta sadece bu 4 peg hareket edebilir; örn. (0,2) hareket edemez.
  eq("(2,2) peg'inin hamlesi yok", getValidMoves(state, { row: 2, col: 2 }, RULE), []);

  // blocked bir hücre için hamle yok.
  eq("(0,0) blocked, hamle yok", getValidMoves(state, { row: 0, col: 0 }, RULE), []);
}

// ---------------------------------------------------------------------------
// 3) Geçerli / geçersiz hamle kontrolü
// ---------------------------------------------------------------------------
console.log("\n3) isValidMove");
{
  const state = initializeGame(englishBoard);

  const validMove: Move = {
    from: { row: 1, col: 3 },
    over: { row: 2, col: 3 },
    to: { row: 3, col: 3 },
  };
  check("yukarıdan merkeze atlama geçerli", isValidMove(state, validMove, RULE));

  // Hedef boş değil (üzerine atlanacak yer dolu).
  const targetOccupied: Move = {
    from: { row: 1, col: 2 },
    over: { row: 2, col: 2 },
    to: { row: 3, col: 2 }, // dolu
  };
  check("dolu hedefe atlama geçersiz", !isValidMove(state, targetOccupied, RULE));

  // over peg değil (mesafe yanlış / aradaki boş).
  const noPegOver: Move = {
    from: { row: 3, col: 0 },
    over: { row: 3, col: 1 },
    to: { row: 3, col: 2 },
  };
  check("aradaki peg dolu değilse de hedef doluysa geçersiz", !isValidMove(state, noPegOver, RULE));

  // Diagonal hamle orthogonal kuralda geçersiz.
  const diagonal: Move = {
    from: { row: 1, col: 1 },
    over: { row: 2, col: 2 },
    to: { row: 3, col: 3 },
  };
  check("diagonal hamle orthogonal kuralda geçersiz", !isValidMove(state, diagonal, RULE));

  // Tek adımlık (atlamasız) hamle geçersiz.
  const singleStep: Move = {
    from: { row: 2, col: 3 },
    over: { row: 2, col: 3 },
    to: { row: 3, col: 3 },
  };
  check("atlamasız hamle geçersiz", !isValidMove(state, singleStep, RULE));
}

// ---------------------------------------------------------------------------
// 4) applyMove sonrası state
// ---------------------------------------------------------------------------
console.log("\n4) applyMove");
{
  const state = initializeGame(englishBoard);
  const move: Move = {
    from: { row: 1, col: 3 },
    over: { row: 2, col: 3 },
    to: { row: 3, col: 3 },
  };
  const next = applyMove(state, move, RULE);

  eq("from artık boş", next.board[1][3], "empty");
  eq("over (atlanan) artık boş", next.board[2][3], "empty");
  eq("to artık peg", next.board[3][3], "peg");
  eq("peg sayısı 31'e düştü", countPegs(next), 31);
  eq("hamle geçmişine eklendi", next.moves.length, 1);
  eq("seçim temizlendi", next.selectedPeg, null);

  // Immutability: orijinal state değişmedi.
  eq("orijinal state değişmedi (from)", state.board[1][3], "peg");
  eq("orijinal state değişmedi (peg sayısı)", countPegs(state), 32);

  // Geçersiz hamle uygulanınca state aynen döner.
  const badMove: Move = {
    from: { row: 0, col: 0 },
    over: { row: 1, col: 0 },
    to: { row: 2, col: 0 },
  };
  const same = applyMove(state, badMove, RULE);
  check("geçersiz hamle state'i değiştirmez", same === state);
}

// ---------------------------------------------------------------------------
// 5) Undo
// ---------------------------------------------------------------------------
console.log("\n5) undoLastMove");
{
  const state = initializeGame(englishBoard);
  const move: Move = {
    from: { row: 1, col: 3 },
    over: { row: 2, col: 3 },
    to: { row: 3, col: 3 },
  };
  const next = applyMove(state, move, RULE);
  const undone = undoLastMove(next);

  eq("from geri geldi", undone.board[1][3], "peg");
  eq("over (atlanan) geri geldi", undone.board[2][3], "peg");
  eq("to tekrar boş", undone.board[3][3], "empty");
  eq("peg sayısı 32'ye döndü", countPegs(undone), 32);
  eq("hamle geçmişi boşaldı", undone.moves.length, 0);

  // Hamle yokken undo state'i aynen döner.
  check("boş geçmişte undo aynı state'i döner", undoLastMove(state) === state);
}

// ---------------------------------------------------------------------------
// 6) countPegs
// ---------------------------------------------------------------------------
console.log("\n6) countPegs");
{
  let state = initializeGame(englishBoard);
  eq("başlangıç 32", countPegs(state), 32);

  state = applyMove(
    state,
    { from: { row: 1, col: 3 }, over: { row: 2, col: 3 }, to: { row: 3, col: 3 } },
    RULE
  );
  eq("bir hamle sonrası 31", countPegs(state), 31);
}

// ---------------------------------------------------------------------------
// 7) selectPeg (UI yardımcı)
// ---------------------------------------------------------------------------
console.log("\n7) selectPeg");
{
  const state = initializeGame(englishBoard);

  const sel = selectPeg(state, { row: 2, col: 2 });
  eq("peg seçildi", sel.selectedPeg, { row: 2, col: 2 });

  const toggled = selectPeg(sel, { row: 2, col: 2 });
  eq("aynı peg tekrar tıklanınca seçim kalkar", toggled.selectedPeg, null);

  const onEmpty = selectPeg(state, { row: 3, col: 3 });
  eq("boş hücre seçilemez", onEmpty.selectedPeg, null);
}

// ---------------------------------------------------------------------------
// 8) isGameOver
// ---------------------------------------------------------------------------
console.log("\n8) isGameOver");
{
  const state = initializeGame(englishBoard);
  check("başlangıçta oyun bitmemiş", isGameOver(state, RULE) === false);
}

// ---------------------------------------------------------------------------
// Özet
// ---------------------------------------------------------------------------
console.log(`\n${"-".repeat(40)}`);
console.log(`Toplam: ${passed + failed} | Geçti: ${passed} | Kaldı: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
