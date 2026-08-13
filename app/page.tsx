"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyMove,
  countPegs,
  getValidMoves,
  initializeGame,
  selectPeg,
  undoLastMove,
} from "@/lib/gameEngine";
import { BOARDS } from "@/lib/boards";
import { getRank } from "@/lib/ranks";
import { useGameTimer } from "@/lib/useGameTimer";
import type { GameState, Position } from "@/lib/types";
import Board from "@/components/Board";
import GameOverPanel from "@/components/GameOverPanel";
import StatsPanel from "@/components/StatsPanel";
import GameButtons from "@/components/GameButtons";
import BottomNav from "@/components/BottomNav";
import BoardSelect from "@/components/BoardSelect";
import WalletStrip from "@/components/WalletStrip";
import MetaStrip from "@/components/MetaStrip";

// Hamle animasyonu süresi (ms). TEK KAYNAK: globals.css'teki
// --move-duration bu değerle birebir aynı olmalı (220ms).
const MOVE_DURATION = 220;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function Home() {
  const [selectedBoardId, setSelectedBoardId] = useState(1);
  const [boardSelectOpen, setBoardSelectOpen] = useState(false);
  const LAYOUT = BOARDS[selectedBoardId];
  const [game, setGame] = useState<GameState>(() => initializeGame(LAYOUT));
  // Oynanan hamle; animasyon bitince commit edilir. Tek state: kaynak peg'in
  // kayması (from→to) ve yakalanan peg'in erimesi (over) aynı timeout'a bağlı.
  const [pendingMove, setPendingMove] = useState<{
    from: Position;
    over: Position;
    to: Position;
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRunning = game.moves.length > 0 && game.status === "playing";
  const timer = useGameTimer(timerRunning);

  const validTargets: Position[] = game.selectedPeg
    ? getValidMoves(game, game.selectedPeg, LAYOUT.ruleSet)
    : [];

  // Unmount'ta bekleyen hamle timeout'unu temizle.
  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    };
  }, []);

  // Animasyon ortasında restart/undo/board-switch güvenli olsun diye.
  function cancelPendingMove() {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = null;
    }
    setPendingMove(null);
    setIsAnimating(false);
  }

  function handleCellClick(pos: Position) {
    if (isAnimating) return;
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
        // Hamleyi şimdi sabitle: timeout içinde game.selectedPeg bayatlar.
        const move = { from: game.selectedPeg, over, to: pos };

        if (prefersReducedMotion()) {
          setGame((g) => applyMove(g, move, LAYOUT.ruleSet));
          return;
        }

        // Önce kaynak peg kaysın + yakalanan peg erisin, sonra gerçek commit.
        setPendingMove(move);
        setIsAnimating(true);
        moveTimeoutRef.current = setTimeout(() => {
          moveTimeoutRef.current = null;
          setGame((g) => applyMove(g, move, LAYOUT.ruleSet));
          setPendingMove(null);
          setIsAnimating(false);
        }, MOVE_DURATION);
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
    cancelPendingMove();
    setGame((g) => undoLastMove(g));
  }

  function handleRestart() {
    cancelPendingMove();
    setGame(initializeGame(LAYOUT));
    timer.reset();
  }

  function handleBoardSelect(id: number) {
    cancelPendingMove();
    setSelectedBoardId(id);
    setGame(initializeGame(BOARDS[id]));
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
          {/* Eski "• BASE NETWORK •" şeridi — aynı şerit, artık cüzdan
              aksiyonunu taşıyor. Süsleme/tipografi MetaStrip'te birebir duruyor. */}
          <WalletStrip />
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
        <MetaStrip
          as="p"
          textClassName="text-xs uppercase tracking-[0.3em]"
          wrapperClassName="justify-center mt-10"
          lineWidth="w-8"
        >
          {LAYOUT.name} Board
        </MetaStrip>

        {/* Board */}
        <div className="mt-2 relative">
          <Board
            board={game.board}
            selectedPeg={game.selectedPeg}
            validTargets={validTargets}
            onCellClick={handleCellClick}
            ruleSet={LAYOUT.ruleSet}
            pendingMove={pendingMove}
          />

          {game.status !== "playing" && (
            <GameOverPanel
              status={game.status}
              pegsLeft={countPegs(game)}
              onPlayAgain={handleRestart}
              rank={getRank(countPegs(game))}
            />
          )}

          {boardSelectOpen && (
            <BoardSelect
              selectedId={selectedBoardId}
              onSelect={handleBoardSelect}
              onClose={() => setBoardSelectOpen(false)}
            />
          )}
        </div>

        {/* Butonlar */}
        <GameButtons
          onUndo={handleUndo}
          onRestart={handleRestart}
          canUndo={game.moves.length > 0}
          canRestart={game.moves.length > 0}
        />
      </main>

      {/* Alt navigasyon */}
      <BottomNav onBoardsClick={() => setBoardSelectOpen(true)} />
    </div>
  );
}
