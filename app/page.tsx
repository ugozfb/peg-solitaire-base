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
import GameOverPanel from "@/components/GameOverPanel";
import StatsPanel from "@/components/StatsPanel";
import GameButtons from "@/components/GameButtons";
import BottomNav from "@/components/BottomNav";

const LAYOUT = englishBoard;

export default function Home() {
  const [game, setGame] = useState<GameState>(() => initializeGame(LAYOUT));
  const timerRunning = game.moves.length > 0 && game.status === "playing";
  const timer = useGameTimer(timerRunning);

  const validTargets: Position[] = game.selectedPeg
    ? getValidMoves(game, game.selectedPeg, LAYOUT.ruleSet)
    : [];

  function handleCellClick(pos: Position) {
    if (game.status !== "playing") return;

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
          <h1 className="text-3xl sm:text-4xl font-led tracking-[0.2em] text-brand-core [text-shadow:0_0_6px_rgba(223,238,255,0.9),0_0_16px_rgba(59,130,246,0.55),0_0_34px_rgba(59,130,246,0.3)]">
            PEG SOLITAIRE
          </h1>
          <span className="flex items-center gap-3 text-[11px] font-mono tracking-[0.25em] text-brand-muted">
            <span aria-hidden className="h-px w-10 bg-gradient-to-r from-transparent to-[#3b5a99]" />
            <span aria-hidden className="h-1 w-1 rounded-full bg-brand-muted [box-shadow:0_0_4px_rgba(107,140,206,0.8)]" />
            BASE NETWORK
            <span aria-hidden className="h-1 w-1 rounded-full bg-brand-muted [box-shadow:0_0_4px_rgba(107,140,206,0.8)]" />
            <span aria-hidden className="h-px w-10 bg-gradient-to-l from-transparent to-[#3b5a99]" />
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
        <p className="flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-brand-muted mt-10">
          <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-[#3b5a99]" />
          <span aria-hidden className="h-1 w-1 rounded-full bg-brand-muted [box-shadow:0_0_4px_rgba(107,140,206,0.8)]" />
          {LAYOUT.name} Board
          <span aria-hidden className="h-1 w-1 rounded-full bg-brand-muted [box-shadow:0_0_4px_rgba(107,140,206,0.8)]" />
          <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-[#3b5a99]" />
        </p>

        {/* Board */}
        <div className="mt-2 relative">
          <Board
            board={game.board}
            selectedPeg={game.selectedPeg}
            validTargets={validTargets}
            onCellClick={handleCellClick}
          />

          {game.status !== "playing" && (
            <GameOverPanel
              status={game.status}
              pegsLeft={countPegs(game)}
              onPlayAgain={handleRestart}
            />
          )}
        </div>

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
