"use client";

import { useState } from "react";
import {
  applyMove,
  countPegs,
  getValidMoves,
  initializeGame,
  selectPeg,
  undoLastMove,
} from "@/lib/gameEngine";
import { englishBoard } from "@/lib/boards/english";
import { useGameTimer } from "@/lib/useGameTimer";
import type { GameState, Position } from "@/lib/types";
import Board from "@/components/Board";
import StatsPanel from "@/components/StatsPanel";
import GameButtons from "@/components/GameButtons";
import BottomNav from "@/components/BottomNav";

const LAYOUT = englishBoard;

export default function Home() {
  const [game, setGame] = useState<GameState>(() => initializeGame(LAYOUT));
  const timerRunning = game.moves.length > 0 && !game.isComplete;
  const timer = useGameTimer(timerRunning);

  const validTargets: Position[] = game.selectedPeg
    ? getValidMoves(game, game.selectedPeg, LAYOUT.ruleSet)
    : [];

  function handleCellClick(pos: Position) {
    if (game.isComplete) return;

    const cell = game.board[pos.row][pos.col];

    // Geçerli bir hedefe tıklandıysa hamleyi uygula.
    if (game.selectedPeg) {
      const isTarget = validTargets.some(
        (t) => t.row === pos.row && t.col === pos.col
      );
      if (isTarget) {
        const over = {
          row: (game.selectedPeg.row + pos.row) / 2,
          col: (game.selectedPeg.col + pos.col) / 2,
        };
        setGame((g) =>
          applyMove(g, { from: game.selectedPeg!, over, to: pos }, LAYOUT.ruleSet)
        );
        return;
      }
    }

    // Peg'e tıklandıysa seç/seçimi kaldır; aksi halde seçimi temizle.
    if (cell === "peg") {
      setGame((g) => selectPeg(g, pos));
    } else {
      setGame((g) => ({ ...g, selectedPeg: null }));
    }
  }

  function handleUndo() {
    setGame((g) => undoLastMove(g));
  }

  function handleRestart() {
    setGame(initializeGame(LAYOUT));
    timer.reset();
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-screen text-white"
      style={{
        background: [
          /* dots — 16 scattered points, varied opacity/size */
          "radial-gradient(circle at 12% 18%, rgba(90,155,255,0.06) 0%, transparent 1.5px)",
          "radial-gradient(circle at 27% 63%, rgba(90,155,255,0.05) 0%, transparent 1.5px)",
          "radial-gradient(circle at 41% 22%, rgba(120,180,255,0.10) 0%, transparent 2px)",
          "radial-gradient(circle at 58% 81%, rgba(90,155,255,0.04) 0%, transparent 1.5px)",
          "radial-gradient(circle at 73% 34%, rgba(90,155,255,0.06) 0%, transparent 1.5px)",
          "radial-gradient(circle at 84% 71%, rgba(120,180,255,0.09) 0%, transparent 2px)",
          "radial-gradient(circle at 19% 89%, rgba(90,155,255,0.05) 0%, transparent 1.5px)",
          "radial-gradient(circle at 91% 12%, rgba(90,155,255,0.05) 0%, transparent 1.5px)",
          "radial-gradient(circle at 33% 47%, rgba(90,155,255,0.04) 0%, transparent 1.5px)",
          "radial-gradient(circle at 64% 56%, rgba(90,155,255,0.06) 0%, transparent 1.5px)",
          "radial-gradient(circle at  8% 52%, rgba(90,155,255,0.05) 0%, transparent 1.5px)",
          "radial-gradient(circle at 47% 93%, rgba(90,155,255,0.04) 0%, transparent 1.5px)",
          "radial-gradient(circle at 78%  8%, rgba(90,155,255,0.05) 0%, transparent 1.5px)",
          "radial-gradient(circle at 55% 15%, rgba(90,155,255,0.05) 0%, transparent 1.5px)",
          "radial-gradient(circle at 36% 76%, rgba(90,155,255,0.04) 0%, transparent 1.5px)",
          "radial-gradient(circle at 88% 44%, rgba(120,180,255,0.07) 0%, transparent 2px)",
          /* vignette */
          "radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(0,0,0,0.35) 100%)",
          /* base color */
          "#020817",
        ].join(", "),
      }}
    >
      <main className="flex-1 flex flex-col px-4 py-6 max-w-[420px] w-full mx-auto">
        {/* Üst başlık */}
        <header className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-led tracking-[0.2em] text-brand-primary [text-shadow:0_0_10px_rgba(91,155,255,0.6),0_0_20px_rgba(91,155,255,0.3)]">
            PEG SOLITAIRE
          </h1>
          <span className="text-[11px] font-mono tracking-[0.25em] text-brand-dim opacity-50">
            BASE NETWORK
          </span>
        </header>

        {/* Stats panel */}
        <div className="mt-6">
          <StatsPanel
            pegs={countPegs(game)}
            moves={game.moves.length}
            time={timer.formatted}
          />
        </div>

        {/* Aktif tahta adı — board'a ait */}
        <p className="text-center text-xs font-mono tracking-[0.15em] text-brand-muted opacity-50 mt-10">
          {LAYOUT.name} Board
        </p>

        {/* Board */}
        <div className="mt-2">
          <Board
            board={game.board}
            selectedPeg={game.selectedPeg}
            validTargets={validTargets}
            onCellClick={handleCellClick}
          />
        </div>

        {game.isComplete && (
          <p className="text-center font-mono text-[#2563EB] tracking-wider [text-shadow:0_0_10px_rgba(37,99,235,0.8)]">
            YOU WIN!
          </p>
        )}

        {/* Butonlar */}
        <GameButtons
          onUndo={handleUndo}
          onRestart={handleRestart}
          canUndo={game.moves.length > 0}
        />
      </main>

      {/* Alt navigasyon */}
      <BottomNav />
    </div>
  );
}
