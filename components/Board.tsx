// Generic tahta render'ı: BoardLayout'un grid'ini alır, her hücreyi Peg
// component'i ile render eder. "blocked" hücreler boşluk olarak gösterilir.

import type { BoardCell, Position, RuleSet } from "@/lib/types";
import Peg from "./Peg";

// A/B test: tek satırı değiştirip iki dokuyu karşılaştır.
const WOOD = "/wood-walnut-a.webp";

type BoardProps = {
  board: BoardCell[][];
  selectedPeg: Position | null;
  validTargets: Position[];
  onCellClick: (pos: Position) => void;
  ruleSet: RuleSet;
};

function isSamePosition(a: Position | null, b: Position): boolean {
  return !!a && a.row === b.row && a.col === b.col;
}

export default function Board({
  board,
  selectedPeg,
  validTargets,
  onCellClick,
  ruleSet,
}: BoardProps) {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const HOLE_SIZE = "33px";
  const GAP = "8px";

  const CELL = 33;
  const CELL_GAP = 8;
  const PAD = 32; // p-4 × 2
  const MAX_BOARD_SIZE = 420; // Üst güvenlik sınırı, tasarım hedefi değil.

  const gridW = cols * CELL + (cols - 1) * CELL_GAP;
  const gridH = rows * CELL + (rows - 1) * CELL_GAP;
  const idealSize =
    ruleSet === "triangular"
      ? Math.max(gridW, gridH) * 1.18 + PAD
      : Math.max(gridW, gridH) + PAD;
  const size = Math.min(idealSize, MAX_BOARD_SIZE);

  return (
    <div className="w-full" style={{ containerType: "inline-size" }}>
      <div
        style={{
          height: `calc(${size}px * var(--board-scale))`,
          ["--board-scale" as string]: `min(1, calc(100cqw / ${size}))`,
        }}
      >
        <div
          className={[
            "relative mx-auto aspect-square p-4",
            "rounded-full",
            "shadow-[inset_0_3px_8px_rgba(255,220,180,0.18),inset_0_-12px_30px_rgba(0,0,0,0.55),inset_0_0_40px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.5),0_0_20px_rgba(0,82,255,0.45),0_0_38px_rgba(0,82,255,0.30),0_0_55px_rgba(99,66,255,0.35),0_0_80px_rgba(140,70,255,0.30),0_0_120px_rgba(160,80,255,0.20),0_0_160px_rgba(180,90,255,0.10)]",
            "border-4 border-[#2a1810]",
          ].join(" ")}
          style={{
            width: `${size}px`,
            backgroundImage: `radial-gradient(ellipse at 50% 18%, rgba(255,248,235,0.10) 0%, transparent 42%), radial-gradient(circle at 32% 22%, rgba(255,225,190,0.15) 0%, transparent 38%), radial-gradient(circle at 50% 42%, transparent 55%, rgba(0,0,0,0.45) 100%), url("${WOOD}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: "scale(var(--board-scale))",
            transformOrigin: "top center",
          }}
        >
          {ruleSet === "triangular" ? (
            <div
              className="flex flex-col w-full h-full place-content-center"
              style={{ gap: GAP }}
            >
              {board.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex justify-center"
                  style={{ gap: GAP }}
                >
                  {row.map((cell, colIdx) => {
                    if (cell === "blocked") {
                      return null;
                    }

                    const pos: Position = { row: rowIdx, col: colIdx };

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
                  })}
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
