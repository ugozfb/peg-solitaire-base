"use client";

// Cüzdan DURUM göstergesi — BoardSelect başlığının altında.
//
// Bilinçli olarak TIKLANAMAZ: connect/disconnect aksiyonu tek yerde, header'daki
// WalletStrip'te. Burada yalnızca "hangi cüzdan bağlı" bilgisi duruyor, çünkü
// kilitli tahtaların unlock akışı bu bilgiye bakıyor (bkz. useUnlockBoard'ın
// NotConnected guard'ı). Durum wagmi'den global okunuyor, iki bileşen arasında
// prop taşımaya gerek yok.
//
// Not: BoardSelect overlay'i board kabının içinde (absolute inset-0), header'ı
// KAPLAMIYOR — panel açıkken bile yukarıdaki şeritten bağlanılabiliyor ve bu
// gösterge anında güncelleniyor.

import { useAccount } from "wagmi";
import { shortenAddress } from "@/lib/format";

export default function WalletStatus() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();

  // F5 sonrası reconnect sürerken "Not connected" demek yanlış olurdu —
  // henüz bilinmiyor. Unlock butonu da aynı anda "Connecting…" gösteriyor.
  const isBusy = isConnecting || isReconnecting;
  const isLive = isConnected && address !== undefined;

  // address ternary'de doğrudan kullanılıyor: isLive üzerinden TS daralması
  // olmuyor, non-null assertion da yazmak istemiyoruz.
  const label =
    isConnected && address
      ? shortenAddress(address)
      : isBusy
        ? "Connecting…"
        : "Not connected";

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
      <span
        aria-hidden
        className={[
          "h-1.5 w-1.5 rounded-full shrink-0",
          isLive
            ? "bg-brand-primary shadow-[0_0_6px_rgba(91,155,255,0.9)]"
            : "bg-brand-dim",
        ].join(" ")}
      />
      <span
        className={[
          "text-[11px] font-mono tracking-wide truncate",
          isLive ? "text-brand-core" : "text-brand-muted",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}
