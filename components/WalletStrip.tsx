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

import { useEffect, useRef, useState } from "react";
import type { Connector } from "wagmi";
import { useAccount, useConnect, useConnectors, useDisconnect, useReconnect } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { FARCASTER_CONNECTOR_TYPE } from "@/lib/wagmi";
import { shortenAddress } from "@/lib/format";
import MetaStrip from "./MetaStrip";

const INJECTED_TYPE = "injected";
const COINBASE_TYPE = "coinbaseWallet";
const BASE_ACCOUNT_TYPE = "baseAccount";

// Config'e elle eklenen genel injected() connector'ının sabit id'si. EIP-6963
// ile KEŞFEDİLEN cüzdanlarda id rdns olur (io.metamask.mobile, app.phantom,
// com.okex.wallet ...). Bu tek id kontrolü şart: genel connector cüzdan olsa da
// olmasa da listede durur, keşfedilen ise yalnızca gerçek cüzdan varsa oluşur —
// üstelik wagmi config connector'larını keşfedilenlerden ÖNCE sıralıyor, yani
// yalnızca type'a bakan bir find() her ortamda genel olanı yakalardı.
const GENERIC_INJECTED_ID = "injected";

// Disconnect iki aşamalı: bir dokunuş "kur", ikincisi uygular. Kurulu hal bu
// süre sonunda kendiliğinden geri döner — mobilde hover olmadığı için tek
// dokunuşla yanlışlıkla bağlantı kesilmesin.
const ARM_TIMEOUT_MS = 3000;

// Gerçek Farcaster host'unda: farcaster connector'ı (host cüzdanı).
// Geri kalan HER yerde — Base App dahil, çünkü o artık standard web app —
// sıra şu:
//   1) EIP-6963 ile KEŞFEDİLEN injected cüzdan (MetaMask/Phantom/OKX in-app)
//   2) baseAccount (Base App + masaüstünde cüzdansız tarayıcı)
//   3) genel injected() — 6963 duyurmayan cüzdanlar için window.ethereum
//   4) coinbaseWallet — eski fallback
// farcaster connector'ı web'de ASLA seçilmez: getProvider() koşulsuz
// MiniAppSDK.wallet.ethProvider döndürdüğü için patlar. Eski koddaki
// `type !== FARCASTER_TYPE` fallback'i bunu SAĞLAMIYORDU (bkz. aşağıdaki not).
// Birden fazla keşfedilen cüzdan varsa ilki alınıyor; seçim modal'ı yok (YAGNI).
function isDiscoveredInjected(connector: Connector): boolean {
  return connector.type === INJECTED_TYPE && connector.id !== GENERIC_INJECTED_ID;
}

function pickConnector(
  connectors: readonly Connector[],
  isMiniApp: boolean,
): Connector | undefined {
  if (isMiniApp) {
    return connectors.find((c) => c.type === FARCASTER_CONNECTOR_TYPE) ?? connectors[0];
  }

  return (
    connectors.find(isDiscoveredInjected) ??
    connectors.find((c) => c.type === BASE_ACCOUNT_TYPE) ??
    connectors.find((c) => c.type === INJECTED_TYPE) ??
    connectors.find((c) => c.type === COINBASE_TYPE)
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
  const { mutate: reconnect, isPending: isReconnectPending } = useReconnect();

  // null = tespit sürüyor. isInMiniApp() async: SSR'da ve top-level
  // pencerede anında false döner, iframe/RN WebView'da host'a sorup
  // 1sn timeout ile karar verir.
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

  // Reconnect tek atış. Ref, state değil: yeniden render tetiklemesine gerek
  // yok ve aşağıdaki effect'in deps'i (connectors) mipd keşfiyle değişince
  // ikinci bir reconnect başlatmasını engelliyor.
  const didReconnect = useRef(false);

  // TEMP DIAGNOSTIC — REMOVE AFTER CONNECTOR DEBUG
  useEffect(() => {
    console.log(
      "[CONNECTOR_DEBUG]",
      JSON.stringify(
        connectors.map((c) => ({ id: c.id, type: c.type, name: c.name, uid: c.uid })),
        null,
        2,
      ),
    );
    console.log("[ENV_DEBUG]", {
      isMiniApp,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "n/a",
    });
  }, [connectors, isMiniApp]);

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

  // Oturum geri yükleme. WagmiProvider'da reconnectOnMount={false} — çünkü
  // wagmi'nin mount reconnect'i config'teki TÜM connector'ları sırayla deniyor
  // (@wagmi/core actions/reconnect.js: for-await döngüsü, break yok) ve
  // farcaster connector'ının isAuthorized()'ı in-app WebView'da (RN host, ama
  // Farcaster host DEĞİL) hiç settle olmuyor: SDK oradan webViewEndpoint'e
  // düşüp cevabı FarcasterFrameCallback event'inde bekliyor, o event hiç
  // gelmiyor. Döngü asılınca status'u 'connected'/'disconnected' yapan son
  // blok da çalışmıyor -> kalıcı 'connecting' -> buton hep disabled.
  //
  // O yüzden reconnect'i buradan, ORTAM BİLİNDİKTEN SONRA başlatıyoruz:
  // web'de listeden farcaster düşüyor, gerçek Farcaster host'unda tam liste
  // gidiyor (orada comlink cevap verdiği için asılma yok — isMiniApp'in true
  // dönmesi zaten kanalın çalıştığının kanıtı).
  useEffect(() => {
    if (isMiniApp === null) return; // tespit bitmeden ASLA
    if (didReconnect.current) return;
    didReconnect.current = true;

    if (isMiniApp) reconnect({});
    else
      reconnect({
        connectors: connectors.filter((c) => c.type !== FARCASTER_CONNECTOR_TYPE),
      });
  }, [isMiniApp, reconnect, connectors]);

  // Kurulu hal kendiliğinden geri döner. Timer effect'te kuruluyor ki unmount
  // olduğunda (başka ekrana geçiş) cleanup ile temizlensin — sızıntı yok.
  useEffect(() => {
    if (!armed) return;

    const timer = setTimeout(() => setArmed(false), ARM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  const connector = isMiniApp === null ? undefined : pickConnector(connectors, isMiniApp);
  // isMiniApp === null: ortam henüz bilinmiyor, reconnect başlamadı bile.
  // Meşgul sayılıyor ki o pencerede buton "CONNECT WALLET (soluk)" değil
  // "CONNECTING…" göstersin — in-app WebView'da sdk.isInMiniApp() 1sn
  // timeout'a kadar bekliyor, bu görünür bir süre.
  const isBusy =
    isConnectPending || isConnecting || isReconnecting || isReconnectPending || isMiniApp === null;

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

  // TEMP DIAGNOSTIC — REMOVE AFTER CONNECTOR DEBUG
  const diagnosticOverlay = (
    <div
      style={{
        position: "fixed",
        bottom: 4,
        right: 4,
        zIndex: 9999,
        maxWidth: "45vw",
        fontSize: "10px",
        lineHeight: 1.3,
        color: "#0f0",
        background: "rgba(0,0,0,0.75)",
        padding: "4px",
        pointerEvents: "none",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      {`mini:${String(isMiniApp)} ua:${typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 40) : ""}\n` +
        `pick:${connector ? `${connector.type}|${connector.id}` : "none"}\n` +
        `pending:${String(isConnectPending)} conn:${String(isConnecting)} recon:${String(isReconnecting)} up:${String(isConnected)}\n` +
        `rnwv:${String(typeof window !== "undefined" && !!(window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView)} iframe:${String(typeof window !== "undefined" && window !== window.parent)}\n` +
        `err:${connectError ? connectError.message.slice(0, 60) : "none"}\n` +
        connectors.map((c) => `${c.type}|${c.id}`).join("\n")}
    </div>
  );

  // Bağlıyken: adres (bağlı olmanın kendisi rengiyle anlatılıyor, ekstra rozet
  // yok) <-> kurulu halde DISCONNECT. Adreste letter-spacing 0.16em: 0.25em'de
  // hex okunaksızlaşıyor. Etiket metinleri şeridin 0.25em'ini koruyor.
  if (isConnected && address) {
    return (
      <>
        {diagnosticOverlay}
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
      </>
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
    <>
      {diagnosticOverlay}
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
    </>
  );
}
