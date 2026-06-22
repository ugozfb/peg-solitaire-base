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
  const HOLE_SIZE = "33px";
  const GAP = "8px";

  return (
    <div
      className={[
        "relative mx-auto aspect-square p-4",
        "rounded-full",
        "bg-[radial-gradient(circle_at_35%_25%,#9a6a3f,#6B4423_55%,#4a2f17_100%)]",
        "shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-4px_10px_rgba(0,0,0,0.4),0_0_30px_rgba(0,82,255,0.25),0_0_60px_rgba(0,82,255,0.15)]",
        "border-4 border-[#3a2310]",
      ].join(" ")}
      style={{ width: "min(76vw, 330px)" }}
    >
      <div
        className="grid w-full h-full place-content-center"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${HOLE_SIZE})`,
          gap: GAP,
        }}
      >
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const pos: Position = { row: rowIdx, col: colIdx };

            if (cell === "blocked") {
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  style={{ width: HOLE_SIZE, height: HOLE_SIZE }}
                />
              );
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className="flex items-center justify-center"
                style={{ width: HOLE_SIZE, height: HOLE_SIZE }}
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
