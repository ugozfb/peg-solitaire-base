"use client";

// Tahta seçim ekranı — overlay, board'un doğal devamı (GameOverPanel ile aynı stil dili).

import { BOARDS } from "@/lib/boards";
import type { BoardLayout } from "@/lib/types";
import { useIsUnlocked } from "@/lib/hooks/useIsUnlocked";
import WalletBar from "./WalletBar";

type BoardSelectProps = {
  selectedId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
};

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function countHoles(board: BoardLayout): number {
  return board.grid.reduce(
    (total, row) => total + row.filter((cell) => cell !== "blocked").length,
    0
  );
}

function ruleSetLabel(board: BoardLayout): string {
  return board.ruleSet === "triangular" ? "Triangular" : "Orthogonal";
}

// Kart kabuğu — üç durumda da (yükleniyor / kilitli / açık) aynı ölçüler.
const CARD_SHELL =
  "relative flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left border transition-colors";

function BoardInfo({
  board,
  isSelected,
}: {
  board: BoardLayout;
  isSelected: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={[
          "font-led text-base tracking-[0.08em]",
          isSelected ? "text-brand-primary" : "text-brand-core",
        ].join(" ")}
      >
        {board.name}
      </span>
      <span className="text-[11px] font-mono text-brand-muted tracking-wide">
        {countHoles(board)} holes · {ruleSetLabel(board)}
      </span>
    </div>
  );
}

// Her kart AYRI bir bileşen: useIsUnlocked'ı map içinde çağırmak
// hook kurallarını ihlal ederdi (kart sayısı/sırası değişince hook
// sırası bozulur). Kart başına bir bileşen = kart başına sabit hook seti.
function BoardCard({
  contractId,
  board,
  isSelected,
  onPick,
}: {
  contractId: number;
  board: BoardLayout;
  isSelected: boolean;
  onPick: (contractId: number) => void;
}) {
  const { isUnlocked, isLoading } = useIsUnlocked(contractId);

  // Kilit durumu belirsizken rozet gösterme — yanlış bilgi vermektense boş dur.
  if (isLoading) {
    return (
      <div className={[CARD_SHELL, "border-white/10 bg-white/5 opacity-60"].join(" ")}>
        <BoardInfo board={board} isSelected={isSelected} />
        <span className="text-[11px] font-mono text-brand-muted tracking-widest shrink-0">
          …
        </span>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className={[CARD_SHELL, "border-white/10 bg-black/20"].join(" ")}>
        <BoardInfo board={board} isSelected={false} />

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={[
              "flex items-center gap-1 px-2 py-1 rounded-full",
              "border border-brand-dim/50 bg-black/40 text-brand-muted",
              "text-[10px] font-mono tracking-wider",
            ].join(" ")}
          >
            <LockIcon />
            LOCKED
          </span>

          {/* CTA yer tutucu — gerçek unlock akışı Adım 6b'de bağlanacak. */}
          <button
            type="button"
            disabled
            className={[
              "px-2.5 py-1 rounded-full shrink-0",
              "border border-brand-primary/40 bg-brand-primary/10 text-brand-primary",
              "text-[10px] font-led tracking-wider",
              "disabled:opacity-50",
            ].join(" ")}
          >
            UNLOCK
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPick(contractId)}
      className={[
        CARD_SHELL,
        isSelected
          ? "border-brand-primary/60 bg-brand-primary/10 shadow-[0_0_12px_rgba(59,130,246,0.25),inset_0_0_8px_rgba(59,130,246,0.08)]"
          : "border-white/10 bg-white/5",
        "active:scale-[0.98]",
      ].join(" ")}
    >
      <BoardInfo board={board} isSelected={isSelected} />
    </button>
  );
}

export default function BoardSelect({
  selectedId,
  onSelect,
  onClose,
}: BoardSelectProps) {
  const entries = Object.entries(BOARDS).map(
    ([contractId, board]) => [Number(contractId), board] as const
  );

  function handlePick(contractId: number) {
    onSelect(contractId);
    onClose();
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      {/* Arka karartma */}
      <button
        type="button"
        aria-label="Close board select"
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />

      {/* Panel kutusu */}
      <div
        className={[
          "relative w-full max-w-[320px] mx-4 max-h-[85vh] rounded-2xl",
          "bg-[rgba(10,18,40,0.96)] backdrop-blur-md",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          "border border-brand-dim/40",
          "flex flex-col gap-3 px-5 py-5",
          "overflow-y-auto",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-led tracking-[0.1em] text-brand-core [text-shadow:0_0_6px_rgba(223,238,255,0.9),0_0_16px_rgba(59,130,246,0.55),0_0_34px_rgba(59,130,246,0.3)]">
            SELECT BOARD
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center h-8 w-8 rounded-full border border-white/15 bg-white/5 text-brand-muted active:scale-95 transition-transform"
          >
            <CloseIcon />
          </button>
        </div>

        <WalletBar />

        <div className="flex flex-col gap-2">
          {entries.map(([contractId, board]) => (
            <BoardCard
              key={board.id}
              contractId={contractId}
              board={board}
              isSelected={contractId === selectedId}
              onPick={handlePick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
