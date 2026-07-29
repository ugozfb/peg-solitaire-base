// Ortak biçimlendirme yardımcıları.

// 0x258Bf1c2…d078 -> 0x258B…d078. Header şeridi ve BoardSelect'teki durum
// göstergesi aynı kısaltmayı gösteriyor; iki yerde ayrı yazılmasın.
export function shortenAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
