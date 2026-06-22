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
    <div className="flex flex-col flex-1 min-h-screen bg-[#020817] text-white">
      <main className="flex-1 flex flex-col gap-6 px-4 py-6 max-w-[420px] w-full mx-auto">
        {/* Üst başlık */}
        <header className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-mono font-bold tracking-[0.15em] text-[#2563EB] [text-shadow:0_0_12px_rgba(37,99,235,0.7)]">
            PEG SOLITAIRE
          </h1>
          <span className="text-xs font-mono text-[#2563EB]/50">
            Connect Wallet
          </span>
        </header>

        {/* Stats panel */}
        <StatsPanel
          pegs={countPegs(game)}
          moves={game.moves.length}
          time={timer.formatted}
        />

        {/* Aktif tahta adı */}
        <p className="text-center text-xs font-mono text-[#2563EB]/60 tracking-wider">
          {LAYOUT.name} Board
        </p>

        {/* Board */}
        <Board
          board={game.board}
          selectedPeg={game.selectedPeg}
          validTargets={validTargets}
          onCellClick={handleCellClick}
        />

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
