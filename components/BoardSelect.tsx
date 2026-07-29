"use client";

// Tahta seçim ekranı — overlay, board'un doğal devamı (GameOverPanel ile aynı stil dili).

import { useEffect, useRef, useState } from "react";
import { formatEther } from "viem";
import { BOARDS } from "@/lib/boards";
import type { BoardLayout } from "@/lib/types";
import { useIsUnlocked } from "@/lib/hooks/useIsUnlocked";
import { useUnlockBoard, type UnlockErrorKind } from "@/lib/hooks/useUnlockBoard";
import WalletStatus from "./WalletStatus";

type BoardSelectProps = {
  selectedId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
};

// "Unlocked ✓" ne kadar görünsün — sadece görsel geçiş, akış kararı değil.
const SUCCESS_FLASH_MS = 400;

// errorKind -> kısa kullanıcı metni. Ham RPC/contract error'u asla gösterilmez.
// AlreadyUnlocked burada YOK: o hata değil, başarı yolu (board zaten senin).
const ERROR_MESSAGES: Record<Exclude<UnlockErrorKind, "AlreadyUnlocked">, string> = {
  UserRejected: "Transaction cancelled",
  IncorrectPayment: "Wrong amount",
  InsufficientFunds: "Not enough ETH",
  InvalidBoardId: "Board unavailable",
  // "above": connect aksiyonu artık başlıktaki şeritte ve panel header'ı
  // kapatmıyor, kullanıcı oraya bakmalı.
  NotConnected: "Connect wallet above",
  WrongNetwork: "Switch to Base Sepolia",
  Unknown: "Unlock failed",
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

// note: fiyat veya hata satırı. Sağ sütuna DEĞİL sol bilgi sütununa yazılıyor —
// LOCKED + UNLOCK satırının genişliğine dokunmuyoruz (Asymmetrical taşması 6c'nin işi).
function BoardInfo({
  board,
  isSelected,
  note,
  noteTone,
}: {
  board: BoardLayout;
  isSelected: boolean;
  note?: string | null;
  noteTone?: "price" | "error";
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
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
      {note && (
        <span
          role={noteTone === "error" ? "alert" : undefined}
          className={[
            "text-[10px] font-mono tracking-wide",
            noteTone === "error" ? "text-red-400/90" : "text-brand-primary/80",
          ].join(" ")}
        >
          {note}
        </span>
      )}
    </div>
  );
}

// Her kart AYRI bir bileşen: useIsUnlocked/useUnlockBoard'ı map içinde çağırmak
// hook kurallarını ihlal ederdi (kart sayısı/sırası değişince hook
// sırası bozulur). Kart başına bir bileşen = kart başına sabit hook seti.
function BoardCard({
  contractId,
  board,
  isSelected,
  onPick,
  isUnlockLocked,
  onUnlockStart,
  onUnlockSettled,
}: {
  contractId: number;
  board: BoardLayout;
  isSelected: boolean;
  onPick: (contractId: number) => void;
  isUnlockLocked: boolean;
  onUnlockStart: (contractId: number) => void;
  onUnlockSettled: () => void;
}) {
  const { isUnlocked, isLoading, refetch } = useIsUnlocked(contractId);
  const {
    unlock,
    isBusy,
    isWalletConnecting,
    isSuccess,
    errorKind,
    txHash,
    unlockPrice,
    reset,
  } = useUnlockBoard();

  const [justUnlocked, setJustUnlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Tek guard, iki effect onu paylaşıyor: bir denemenin sonucu (başarı VEYA
  // hata) yalnızca bir kez işlenir. wagmi flag'leri re-render'lar arası
  // dalgalansa da ikinci tetik buradan geçemez.
  const settledRef = useRef(false);

  // Parent (page.tsx) oyun timer'ı yüzünden saniyede bir yeniden render
  // olabiliyor; o zaman onPick/onUnlockSettled kimliği değişiyor. Bunları
  // effect deps'ine koysaydık 400 ms'lik geçiş iptal olup navigasyon hiç
  // gerçekleşmezdi. En güncel referansları ref'te tutuyoruz.
  const latest = useRef({ onPick, onUnlockSettled, refetch, contractId });
  useEffect(() => {
    latest.current = { onPick, onUnlockSettled, refetch, contractId };
  });

  // Terminal durum 1: başarı. AlreadyUnlocked da buraya düşer — board zaten
  // açık demektir, kullanıcıya hata göstermenin anlamı yok.
  useEffect(() => {
    const unlocked = isSuccess || errorKind === "AlreadyUnlocked";
    if (!unlocked || settledRef.current) return;
    settledRef.current = true;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      await latest.current.refetch(); // kilit durumunu tazele
      if (cancelled) return;
      setJustUnlocked(true);
      timer = setTimeout(() => {
        latest.current.onUnlockSettled();
        latest.current.onPick(latest.current.contractId); // seç + overlay kapat
      }, SUCCESS_FLASH_MS);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isSuccess, errorKind]);

  // Terminal durum 2: gerçek hata. Aynı settledRef'i tüketiyor.
  useEffect(() => {
    if (!errorKind || errorKind === "AlreadyUnlocked" || settledRef.current) return;
    settledRef.current = true;

    setMessage(ERROR_MESSAGES[errorKind]);
    latest.current.onUnlockSettled(); // kilidi bırak, aynı board tekrar denenebilir
  }, [errorKind]);

  function handleUnlockClick() {
    // isWalletConnecting: F5 sonrası reconnect sürerken tıklama yutulur —
    // "Connect wallet first" demek o an yanlış olurdu.
    if (isUnlockLocked || isBusy || justUnlocked || isWalletConnecting) return;

    settledRef.current = false;
    setMessage(null);
    setJustUnlocked(false); // hatadan sonraki denemede eski ✓ bir an görünmesin
    reset(); // write hatası + guard hatası (NotConnected/WrongNetwork) birlikte temizlenir

    onUnlockStart(contractId);
    unlock(contractId);
  }

  // Kilit durumu belirsizken rozet gösterme — yanlış bilgi vermektense boş dur.
  if (isLoading && !isBusy && !justUnlocked) {
    return (
      <div className={[CARD_SHELL, "border-white/10 bg-white/5 opacity-60"].join(" ")}>
        <BoardInfo board={board} isSelected={isSelected} />
        <span className="text-[11px] font-mono text-brand-muted tracking-widest shrink-0">
          …
        </span>
      </div>
    );
  }

  // isBusy/justUnlocked de bu dala sokuluyor: refetch başarıyı yazdığı anda
  // kart "açık" görünümüne atlarsa "Unlocked ✓" hiç görünmezdi.
  if (!isUnlocked || isBusy || justUnlocked) {
    const priceLabel = unlockPrice != null ? `${formatEther(unlockPrice)} ETH` : null;

    // Sıra korunuyor: isBusy dalları önce (mevcut davranış), "Connecting…"
    // yalnızca boştaki butonun yerine geçiyor.
    const label = justUnlocked
      ? "Unlocked ✓"
      : isBusy && !txHash
        ? "Confirm in wallet…"
        : isBusy
          ? "Unlocking…"
          : isWalletConnecting
            ? "Connecting…"
            : "Unlock";

    return (
      <div className={[CARD_SHELL, "border-white/10 bg-black/20"].join(" ")}>
        <BoardInfo
          board={board}
          isSelected={false}
          note={message ?? priceLabel}
          noteTone={message ? "error" : "price"}
        />

        <div className="flex items-center gap-2 shrink-0">
          {/* Rozet işlem sırasında gizleniyor: hem "LOCKED" o an yanlış bilgi,
              hem de buton metni uzarken satıra yer açıyor. */}
          {!isBusy && !justUnlocked && (
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
          )}

          <button
            type="button"
            onClick={handleUnlockClick}
            disabled={isUnlockLocked || isBusy || justUnlocked || isWalletConnecting}
            className={[
              "px-2.5 py-1 rounded-full shrink-0",
              "border border-brand-primary/40 bg-brand-primary/10 text-brand-primary",
              "text-[10px] font-led tracking-wider",
              "active:scale-95 transition-transform",
              "disabled:opacity-50 disabled:active:scale-100",
            ].join(" ")}
          >
            {label}
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

  // Aynı anda tek unlock — ikinci bir cüzdan popup'ı açılmasın.
  const [activeUnlockId, setActiveUnlockId] = useState<number | null>(null);

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

        {/* Sadece durum — connect/disconnect aksiyonu header'daki WalletStrip'te. */}
        <WalletStatus />

        <div className="flex flex-col gap-2">
          {entries.map(([contractId, board]) => (
            <BoardCard
              key={board.id}
              contractId={contractId}
              board={board}
              isSelected={contractId === selectedId}
              onPick={handlePick}
              isUnlockLocked={activeUnlockId !== null && activeUnlockId !== contractId}
              onUnlockStart={setActiveUnlockId}
              onUnlockSettled={() => setActiveUnlockId(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
