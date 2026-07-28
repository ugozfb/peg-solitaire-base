"use client";

// Cüzdan bağlantı satırı — BoardSelect başlığının altında duruyor.
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

const FARCASTER_TYPE = "farcasterMiniApp";
const INJECTED_TYPE = "injected";
const COINBASE_TYPE = "coinbaseWallet";

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

function shortenAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletBar() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const connectors = useConnectors();
  const { mutate: connect, isPending: isConnectPending, error: connectError } = useConnect();
  const { mutate: disconnect } = useDisconnect();

  // null = tespit sürüyor. isInMiniApp() async: SSR'da ve top-level
  // pencerede anında false döner, iframe/RN WebView'da host'a sorup
  // 1sn timeout ile karar verir.
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

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

  if (isConnected && address) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
        <span className="flex items-center gap-2 min-w-0">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(91,155,255,0.9)] shrink-0" />
          <span className="text-[11px] font-mono tracking-wide text-brand-core truncate">
            {shortenAddress(address)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="text-[10px] font-mono tracking-wider text-brand-muted hover:text-brand-core active:scale-95 transition-transform shrink-0"
        >
          DISCONNECT
        </button>
      </div>
    );
  }

  const connector = isMiniApp === null ? undefined : pickConnector(connectors, isMiniApp);
  const isBusy = isConnectPending || isConnecting || isReconnecting;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={!connector || isBusy}
        onClick={() => {
          if (connector) connect({ connector });
        }}
        className={[
          "w-full px-3 py-2 rounded-xl text-center",
          "border border-brand-primary/50 bg-brand-primary/10",
          "font-led text-xs tracking-[0.12em] text-brand-primary",
          "active:scale-[0.98] transition-transform",
          "disabled:opacity-50 disabled:active:scale-100",
        ].join(" ")}
      >
        {isBusy ? "CONNECTING…" : "CONNECT WALLET"}
      </button>

      {/* Sessiz bağlanma hatası bırakma — ham RPC mesajını değil, kısa bir
          satır göster. Bu debug değil, kalıcı UI. */}
      {connectError && (
        <span
          role="alert"
          className="text-[10px] font-mono tracking-wide text-red-400/90 text-center"
        >
          Connection failed — try again
        </span>
      )}

      {isMiniApp === false && connectors.length > 0 && !connector && (
        <span className="text-[10px] font-mono tracking-wide text-brand-muted text-center">
          No wallet detected
        </span>
      )}
    </div>
  );
}
