// Wagmi config — her iki chain (base, baseSepolia) burada tanımlı.
// NEXT_PUBLIC_CHAIN env'i (base -> mainnet, aksi halde baseSepolia) henüz
// kullanılmıyor; başlangıç chain hedefleme adımına geldiğimizde eklenecek.
//
// Base App artık Mini App host'u değil, STANDARD WEB APP olarak açıyor
// (docs.base.org/apps/guides/migrate-to-standard-web-app). Docs'un önerdiği
// stack: injected() + baseAccount({ appName }). İkisi de aşağıda.
//
// multiInjectedProviderDiscovery (default true) EIP-6963 ile gerçek cüzdanları
// ZATEN keşfedip connector'a çeviriyor; keşfedilenlerin id'si rdns oluyor
// (io.metamask.mobile, app.phantom, com.okex.wallet ...). Buradaki injected()
// onların yerine geçmez — 6963 duyurmayan cüzdanlar için window.ethereum
// fallback'idir ve cüzdan olsa da olmasa da HER ortamda listede durur.
// Seçim mantığı bu ayrımı bilerek yapıyor (bkz. WalletStrip/pickConnector).

import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { baseAccount, coinbaseWallet, injected } from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

// Connector'ın GERÇEK type'ı elle yazılmıyor, paketten türetiliyor.
// @farcaster/miniapp-wagmi-connector@2.0.0 geriye dönük uyumluluk için
//   export const farcasterFrame = farcasterMiniApp   <- AYNI fonksiyon nesnesi
//   farcasterFrame.type = 'farcasterFrame'           <- type'ı EZİYOR
// yapıyor. Sonuç: farcasterMiniApp() çağrısı type: "farcasterFrame" olan bir
// connector üretiyor. Sabiti türetmek bu sürprizi tek yerde kapatıyor.
export const FARCASTER_CONNECTOR_TYPE = farcasterMiniApp.type;

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    farcasterMiniApp(),
    coinbaseWallet({ appName: "Peg Solitaire" }),
    baseAccount({ appName: "Peg Solitaire" }),
    injected(),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
