// Başlık altındaki ince şerit: iki yana solan çizgi + iki nokta, ortada içerik.
//
// Değerler eski "• BASE NETWORK •" satırından (app/page.tsx) BİREBİR alındı —
// yeni bir görsel dil icat edilmedi, mevcut idiom bileşene çıkarıldı. Şerit
// artık cüzdan aksiyonunu taşıyor ama tipografisi (font-mono, 11px, 0.25em,
// gap-3) ve süslemeleri değişmedi.
//
// Süslemeler aria-hidden ve tıklanamaz: aksiyon HER ZAMAN children'a bağlanır.
// Böylece şerit interaktif olduğunda da görsel ritim aynı kalıyor.

import type { ReactNode } from "react";

function Dot() {
  return (
    <span
      aria-hidden
      className="h-1 w-1 rounded-full bg-brand-muted [box-shadow:0_0_4px_rgba(107,140,206,0.8)]"
    />
  );
}

export default function MetaStrip({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-3 text-[11px] font-mono tracking-[0.25em] text-brand-muted">
      <span aria-hidden className="h-px w-10 bg-gradient-to-r from-transparent to-[#3b5a99]" />
      <Dot />
      {children}
      <Dot />
      <span aria-hidden className="h-px w-10 bg-gradient-to-l from-transparent to-[#3b5a99]" />
    </span>
  );
}
