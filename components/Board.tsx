"use client";

// Generic tahta render'ı: BoardLayout'un grid'ini alır, her hücreyi Peg
// component'i ile render eder. "blocked" hücreler boşluk olarak gösterilir.

import { useEffect, useRef, useState } from "react";
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
  pendingMove?: { from: Position; over: Position; to: Position } | null;
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
  pendingMove = null,
}: BoardProps) {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const HOLE_SIZE = "33px";
  const GAP = "8px";

  const CELL = 33;
  const CELL_GAP = 8;
  const PAD = 32; // p-4 × 2
  const BORDER = 4; // border-4
  const MAX_BOARD_SIZE = 420; // Üst güvenlik sınırı, tasarım hedefi değil.

  const gridW = cols * CELL + (cols - 1) * CELL_GAP;
  const gridH = rows * CELL + (rows - 1) * CELL_GAP;
  const idealSize =
    ruleSet === "triangular"
      ? Math.max(gridW, gridH) * 1.18 + PAD
      : Math.max(gridW, gridH) + PAD;
  const size = Math.min(idealSize, MAX_BOARD_SIZE);

  // Kayan peg overlay'inin hücre merkezleri (yalnız ortogonal grid).
  // Grid `place-content-center` ile ortalandığı için origin, PAD'den değil
  // ortalama offset'inden gelir: simetrik p-4 sadeleşir, geriye padding-box
  // (= size − 2×BORDER; box-sizing: border-box) içinde ortalama kalır.
  // Absolute konumlandırma da bu padding-box'a göre ölçüldüğü için eşleşir.
  const originX = (size - 2 * BORDER - gridW) / 2;
  const originY = (size - 2 * BORDER - gridH) / 2;
  const cx = (col: number) => originX + col * (CELL + CELL_GAP) + CELL / 2;
  // cy iki tahta tipinde de geçerli: grid'in `align-content: center`'ı ile
  // üçgenin `flex-col + justify-content: center`'ı aynı satır yığınını
  // (gridH) aynı content box'ta ortalıyor → aynı origin.
  const cy = (row: number) => originY + row * (CELL + CELL_GAP) + CELL / 2;

  // Üçgende her satır "flex justify-center" ile KENDİ genişliğine göre ayrı
  // ortalandığı için yatay origin satır-bağımlı. Sol-hizalı üçgende blocked
  // hücreler hep satır sonunda olduğundan görünür sıra = col.
  const triRowW = (row: number) => (row + 1) * CELL + row * CELL_GAP;
  const triCx = (row: number, col: number) =>
    (size - 2 * BORDER - triRowW(row)) / 2 + col * (CELL + CELL_GAP) + CELL / 2;

  const showSlide = !!pendingMove;
  const slideCx = (p: Position) =>
    ruleSet === "triangular" ? triCx(p.row, p.col) : cx(p.col);
  const slideCy = (p: Position) => cy(p.row);

  // TEMP DIAGNOSTIC — REMOVE AFTER BUG B DEBUG
  // Statik ölçüm için ilk boş-olmayan hücreyi bul (blocked değil).
  let diagRow = -1;
  let diagCol = -1;
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== "blocked") {
        diagRow = r;
        diagCol = c;
        break outer;
      }
    }
  }
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scaledRef = useRef<HTMLDivElement | null>(null);
  const diagHoleRef = useRef<HTMLDivElement | null>(null);
  const pegSlideRef = useRef<HTMLDivElement | null>(null);
  const [diagText, setDiagText] = useState<string[]>([]);

  useEffect(() => {
    function measure() {
      const scaledEl = scaledRef.current;
      const containerEl = containerRef.current;
      const holeEl = diagHoleRef.current;
      const pegEl = pegSlideRef.current;
      if (!scaledEl || !containerEl) return;

      const scaledBox = scaledEl.getBoundingClientRect();
      const cs = getComputedStyle(scaledEl);
      const boardScaleVal = cs.getPropertyValue("--board-scale").trim();
      const transformVal = cs.transform;
      const computedHeight = cs.height;
      const containerBox = containerEl.getBoundingClientRect();

      const lines: string[] = [];
      lines.push(
        `vw:${window.innerWidth} scale:${boardScaleVal} tf:${transformVal.slice(
          0,
          20
        )}`
      );
      lines.push(
        `boardBox:${scaledBox.width.toFixed(1)}x${scaledBox.height.toFixed(
          1
        )} h:${computedHeight}`
      );
      lines.push(`containerBox.w:${containerBox.width.toFixed(1)}`);

      if (holeEl && diagRow >= 0) {
        const holeBox = holeEl.getBoundingClientRect();
        const gx = holeBox.left + holeBox.width / 2;
        const gy = holeBox.top + holeBox.height / 2;
        const jx =
          (ruleSet === "triangular" ? triCx(diagRow, diagCol) : cx(diagCol));
        const jy = cy(diagRow);
        // js cx/cy, scaledEl'in padding-box origin'ine göre local; ekrana
        // yansıtmak için scaledBox origin + scale uygulanmalı.
        const scaleNum = parseFloat(boardScaleVal) || 1;
        const jxScreen = scaledBox.left + BORDER + jx * scaleNum;
        const jyScreen = scaledBox.top + BORDER + jy * scaleNum;
        lines.push(
          `hole${diagRow},${diagCol} grid:(${gx.toFixed(1)},${gy.toFixed(
            1
          )}) js:(${jxScreen.toFixed(1)},${jyScreen.toFixed(
            1
          )}) Δ:(${(gx - jxScreen).toFixed(1)},${(gy - jyScreen).toFixed(1)})`
        );
      } else {
        lines.push(`hole${diagRow},${diagCol}: not found`);
      }

      if (pegEl) {
        const pegBox = pegEl.getBoundingClientRect();
        lines.push(
          `pegOverlay:(${(pegBox.left + pegBox.width / 2).toFixed(
            1
          )},${(pegBox.top + pegBox.height / 2).toFixed(1)})`
        );
      }

      setDiagText(lines);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  return (
    <div
      className="w-full"
      style={{ containerType: "inline-size" }}
      ref={containerRef}
    >
      <div
        style={{
          height: `calc(${size}px * var(--board-scale))`,
          ["--board-scale" as string]: `min(1, calc(100cqw / ${size}))`,
        }}
      >
        <div
          ref={scaledRef}
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
                        ref={
                          rowIdx === diagRow && colIdx === diagCol
                            ? diagHoleRef
                            : undefined
                        }
                        className="flex items-center justify-center"
                        style={{ width: HOLE_SIZE, height: HOLE_SIZE }}
                      >
                        <Peg
                          hasPeg={cell === "peg"}
                          isSelected={isSamePosition(selectedPeg, pos)}
                          isValidTarget={validTargets.some(
                            (t) => t.row === pos.row && t.col === pos.col
                          )}
                          isDissolving={isSamePosition(
                            pendingMove?.over ?? null,
                            pos
                          )}
                          isHidden={
                            showSlide &&
                            isSamePosition(pendingMove?.from ?? null, pos)
                          }
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
                      ref={
                        rowIdx === diagRow && colIdx === diagCol
                          ? diagHoleRef
                          : undefined
                      }
                      className="flex items-center justify-center"
                      style={{ width: HOLE_SIZE, height: HOLE_SIZE }}
                    >
                      <Peg
                        hasPeg={cell === "peg"}
                        isSelected={isSamePosition(selectedPeg, pos)}
                        isValidTarget={validTargets.some(
                          (t) => t.row === pos.row && t.col === pos.col
                        )}
                        isDissolving={isSamePosition(
                          pendingMove?.over ?? null,
                          pos
                        )}
                        isHidden={
                          showSlide &&
                          isSamePosition(pendingMove?.from ?? null, pos)
                        }
                        onClick={() => onCellClick(pos)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Kayan kaynak peg (her iki tahta tipi). Grid'in kardeşi: --board-scale
              transform'unun içinde yaşadığı için ölçek otomatik uygulanır.
              Gerçek from peg'i isHidden ile gizlendiğinden çakışma olmaz. */}
          {showSlide && pendingMove && (
            <div
              ref={pegSlideRef}
              key={`${pendingMove.from.row}-${pendingMove.from.col}-${pendingMove.to.row}-${pendingMove.to.col}`}
              className="peg-slide absolute z-20 flex items-center justify-center pointer-events-none"
              style={{
                width: HOLE_SIZE,
                height: HOLE_SIZE,
                left: `${slideCx(pendingMove.from)}px`,
                top: `${slideCy(pendingMove.from)}px`,
                ["--slide-dx" as string]: `${
                  slideCx(pendingMove.to) - slideCx(pendingMove.from)
                }px`,
                ["--slide-dy" as string]: `${
                  slideCy(pendingMove.to) - slideCy(pendingMove.from)
                }px`,
              }}
            >
              {/* Peg.tsx'teki mat siyah küre ile birebir aynı görsel. */}
              <span
                className={[
                  "relative rounded-full w-[68%] h-[68%]",
                  "bg-[radial-gradient(circle_at_34%_28%,#5a5f6b_0%,#33373f_28%,#16181d_62%,#050608_100%)]",
                  "shadow-[0_4px_8px_rgba(0,0,0,0.65),inset_0_2px_3px_rgba(255,255,255,0.25),inset_0_-3px_5px_rgba(0,0,0,0.5)]",
                ].join(" ")}
              >
                <span className="absolute top-[14%] left-[22%] w-[26%] h-[20%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55)_0%,transparent_70%)] pointer-events-none" />
              </span>
            </div>
          )}
        </div>
      </div>
      {/* TEMP DIAGNOSTIC — REMOVE AFTER BUG B DEBUG */}
      <div
        style={{
          position: "fixed",
          bottom: 4,
          left: 4,
          zIndex: 9999,
          pointerEvents: "none",
          background: "rgba(0,0,0,0.75)",
          color: "#39ff6a",
          fontSize: "9px",
          lineHeight: 1.3,
          fontFamily: "monospace",
          padding: "4px 6px",
          maxWidth: "96vw",
          whiteSpace: "pre-wrap",
        }}
      >
        {diagText.join("\n")}
      </div>
    </div>
  );
}
