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
        "bg-[repeating-linear-gradient(-18deg,rgba(0,0,0,0.10)_0px,rgba(0,0,0,0.10)_2px,transparent_2px,transparent_7px),repeating-linear-gradient(-14deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_11px),radial-gradient(circle_at_32%_22%,rgba(255,220,180,0.35)_0%,transparent_38%),radial-gradient(circle_at_50%_42%,#6b4226_0%,#5a3620_38%,#3f2415_72%,#2a1810_100%)]",
        "shadow-[inset_0_3px_8px_rgba(255,220,180,0.18),inset_0_-12px_30px_rgba(0,0,0,0.55),inset_0_0_40px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.5),0_0_30px_rgba(0,82,255,0.25),0_0_60px_rgba(0,82,255,0.15)]",
        "border-4 border-[#2a1810]",
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
