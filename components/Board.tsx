// Generic tahta render'ı: BoardLayout'un grid'ini alır, her hücreyi Peg
// component'i ile render eder. "blocked" hücreler boşluk olarak gösterilir.

import type { BoardCell, Position } from "@/lib/types";
import Peg from "./Peg";

type BoardProps = {
  board: BoardCell[][];
  selectedPeg: Position | null;
  validTargets: Position[];
  onCellClick: (pos: Position) => void;
};

function isSamePosition(a: Position | null, b: Position): boolean {
  return !!a && a.row === b.row && a.col === b.col;
}

export default function Board({
  board,
  selectedPeg,
  validTargets,
  onCellClick,
}: BoardProps) {
  const cols = board[0]?.length ?? 0;

  return (
    <div
      className={[
        "relative mx-auto w-full max-w-[380px] aspect-square p-4",
        "rounded-full",
        "bg-[radial-gradient(circle_at_35%_25%,#9a6a3f,#6B4423_55%,#4a2f17_100%)]",
        "shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-4px_10px_rgba(0,0,0,0.4),0_0_30px_rgba(0,82,255,0.25),0_0_60px_rgba(0,82,255,0.15)]",
        "border-4 border-[#3a2310]",
      ].join(" ")}
    >
      <div
        className="grid w-full h-full"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const pos: Position = { row: rowIdx, col: colIdx };

            if (cell === "blocked") {
              return (
                <div key={`${rowIdx}-${colIdx}`} className="aspect-square" />
              );
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className="aspect-square flex items-center justify-center"
              >
                <Peg
                  hasPeg={cell === "peg"}
                  isSelected={isSamePosition(selectedPeg, pos)}
                  isValidTarget={validTargets.some(
                    (t) => t.row === pos.row && t.col === pos.col
                  )}
                  onClick={() => onCellClick(pos)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
