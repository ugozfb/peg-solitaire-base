// Wagmi config — her iki chain (base, baseSepolia) burada tanımlı.
// NEXT_PUBLIC_CHAIN env'i (base -> mainnet, aksi halde baseSepolia) henüz
// kullanılmıyor; başlangıç chain hedefleme adımına geldiğimizde eklenecek.
//
// injected() connector'ı bilinçli olarak YOK: multiInjectedProviderDiscovery
// (default true) EIP-6963 ile tüm uyumlu cüzdanları (Coinbase dahil) otomatik
// keşfedip connector'a çeviriyor. injected() eklemek eski window.ethereum
// fallback'i devreye sokup Coinbase Wallet'ı hem 6963 keşfinde hem injected
// altında iki kez listeler. (wagmi.sh/react/api/createConfig,
// wagmi.sh/react/api/connectors/injected)

import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [farcasterMiniApp(), coinbaseWallet({ appName: "Peg Solitaire" })],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
