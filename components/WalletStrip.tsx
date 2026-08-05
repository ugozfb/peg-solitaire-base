"use client";

// Cüzdan bağlantısı — başlığın altındaki şeritte. Eski "• BASE NETWORK •"
// satırının yerini alıyor: aynı şerit, artık bilgi yerine aksiyon taşıyor.
// (Bağlantı DURUMU her yerde görünür — BoardSelect'teki gösterge gibi — ama
// connect/disconnect AKSİYONU tek yerde: burada.)
//
// Connector seçimi ORTAMA BAĞLI. farcaster connector'ı config'de her zaman
// duruyor ve kendi hazır-olma sinyali yok (getProvider() koşulsuz
// MiniAppSDK.wallet.ethProvider döndürüyor), o yüzden normal tarayıcıda
// seçilirse connect() "Cannot read properties of undefined" ile patlıyor.
// Bağlamı SDK'ya soruyoruz: sdk.isInMiniApp().
//
// wagmi v3: useAccount, useConnection'ın alias'ı. useConnect'in connect/
// connectors alanları deprecated -> mutate + useConnectors().
// (wagmi.sh/react/api/hooks/useConnect)

import { useEffect, useState } from "react";
import type { Connector } from "wagmi";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { shortenAddress } from "@/lib/format";
import MetaStrip from "./MetaStrip";

const FARCASTER_TYPE = "farcasterMiniApp";
const INJECTED_TYPE = "injected";
const COINBASE_TYPE = "coinbaseWallet";

// Disconnect iki aşamalı: bir dokunuş "kur", ikincisi uygular. Kurulu hal bu
// süre sonunda kendiliğinden geri döner — mobilde hover olmadığı için tek
// dokunuşla yanlışlıkla bağlantı kesilmesin.
const ARM_TIMEOUT_MS = 3000;

// Mini App içinde: farcaster (host cüzdanı).
// Web'de: EIP-6963 ile keşfedilen injected cüzdan (io.metamask gibi),
// yoksa Coinbase Wallet. farcaster web'de ASLA seçilmez — patlar.
// Birden fazla injected varsa ilki alınıyor; connector seçim modal'ı
// şimdilik yok (YAGNI).
function pickConnector(
  connectors: readonly Connector[],
  isMiniApp: boolean,
): Connector | undefined {
  if (isMiniApp) {
    return connectors.find((c) => c.type === FARCASTER_TYPE) ?? connectors[0];
  }

  return (
    connectors.find((c) => c.type === INJECTED_TYPE) ??
    connectors.find((c) => c.type === COINBASE_TYPE) ??
    connectors.find((c) => c.type !== FARCASTER_TYPE)
  );
}

// Şerit tipografisi MetaStrip'ten miras alınıyor; buradaki class'lar yalnızca
// duruma göre RENK/GLOW değiştiriyor. px/py + negatif margin: görsel ritim
// bozulmadan dokunma hedefini ~11px'ten ~32px'e çıkarır (mobil-first).
const LABEL_BASE =
  "px-1 -mx-1 py-2 -my-2 whitespace-nowrap transition-[color,transform] active:scale-95 disabled:active:scale-100";

export default function WalletStrip() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const connectors = useConnectors();
  const { mutate: connect, isPending: isConnectPending, error: connectError } = useConnect();
  const { mutate: disconnect } = useDisconnect();

  // null = tespit sürüyor. isInMiniApp() async: SSR'da ve top-level
  // pencerede anında false döner, iframe/RN WebView'da host'a sorup
  // 1sn timeout ile karar verir.
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

  // Disconnect'in "kurulu" hali — adres yerine DISCONNECT gösteriliyor.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    sdk
      .isInMiniApp()
      .then((result) => {
        if (!cancelled) setIsMiniApp(result);
      })
      .catch(() => {
        if (!cancelled) setIsMiniApp(false); // tespit edemediysek web varsay
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Kurulu hal kendiliğinden geri döner. Timer effect'te kuruluyor ki unmount
  // olduğunda (başka ekrana geçiş) cleanup ile temizlensin — sızıntı yok.
  useEffect(() => {
    if (!armed) return;

    const timer = setTimeout(() => setArmed(false), ARM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  const connector = isMiniApp === null ? undefined : pickConnector(connectors, isMiniApp);
  const isBusy = isConnectPending || isConnecting || isReconnecting;

  function handleClick() {
    if (isConnected) {
      if (armed) disconnect();
      else setArmed(true);
      return;
    }

    // Bağlı değilken kurulu hal görünmüyor zaten (aşağıdaki dal isConnected'a
    // bakıyor); yeni bağlantıda bayat kalmasın diye burada temizleniyor.
    // Geri kalan bayatlama ihtimalini ARM_TIMEOUT_MS zaten kapatıyor: timer
    // bağlantı kopsa da çalışmaya devam edip kurulu hali düşürüyor.
    setArmed(false);
    if (connector) connect({ connector });
  }

  // Bağlıyken: adres (bağlı olmanın kendisi rengiyle anlatılıyor, ekstra rozet
  // yok) <-> kurulu halde DISCONNECT. Adreste letter-spacing 0.16em: 0.25em'de
  // hex okunaksızlaşıyor. Etiket metinleri şeridin 0.25em'ini koruyor.
  if (isConnected && address) {
    return (
      <MetaStrip>
        <button
          type="button"
          onClick={handleClick}
          aria-label={armed ? "Confirm disconnect wallet" : "Disconnect wallet"}
          className={[
            LABEL_BASE,
            armed
              ? "text-brand-primary [text-shadow:0_0_8px_rgba(91,155,255,0.55)]"
              : "tracking-[0.16em] text-brand-core [text-shadow:0_0_8px_rgba(91,155,255,0.35)] hover:text-brand-primary",
          ].join(" ")}
        >
          {armed ? "DISCONNECT" : shortenAddress(address)}
        </button>
      </MetaStrip>
    );
  }

  // Sessiz bağlanma hatası bırakma. Ham RPC mesajı değil, şeridin kendi
  // metni değişiyor: alt satır eklemediğimiz için layout hiç kaymıyor ve
  // buton tıklanabilir kalıyor -> tekrar dene.
  const hasError = Boolean(connectError);
  const noWallet = isMiniApp === false && !connector;

  const label = isBusy
    ? "CONNECTING…"
    : hasError
      ? "CONNECT FAILED"
      : noWallet
        ? "NO WALLET"
        : "CONNECT WALLET";

  const disabled = !connector || isBusy;

  return (
    <MetaStrip>
      <span aria-live="polite" aria-atomic="true">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-label="Connect wallet"
          className={[
            LABEL_BASE,
            hasError ? "text-red-400/90" : "text-brand-muted",
            disabled
              ? "opacity-50"
              : "hover:text-brand-primary hover:[text-shadow:0_0_8px_rgba(91,155,255,0.5)]",
          ].join(" ")}
        >
          {label}
        </button>
      </span>
    </MetaStrip>
  );
}
