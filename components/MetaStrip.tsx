// Başlık altındaki ince şerit: iki yana solan çizgi + iki nokta, ortada içerik.
//
// Değerler eski "• BASE NETWORK •" satırından (app/page.tsx) BİREBİR alındı —
// yeni bir görsel dil icat edilmedi, mevcut idiom bileşene çıkarıldı. Şerit
// artık cüzdan aksiyonunu taşıyor ama tipografisi (font-mono, 11px, 0.25em,
// gap-3) ve süslemeleri değişmedi.
//
// Süslemeler aria-hidden ve tıklanamaz: aksiyon HER ZAMAN children'a bağlanır.
// Böylece şerit interaktif olduğunda da görsel ritim aynı kalıyor.
//
// Board-adı şeridi ("• ENGLISH BOARD •") farklı ölçüler kullanıyor (text-xs,
// tracking-0.3em, uppercase, w-8 çizgi, <p> tag'i, mt-10). Tek kaynağa
// çıkarmak için tipografi/sarmalayıcı/çizgi ayrı prop'lar üzerinden esnetildi;
// default'lar WalletStrip'in mevcut görünümünü birebir korur.

import type { ElementType, ReactNode } from "react";

const DEFAULT_TEXT_CLASSNAME = "text-[11px] tracking-[0.25em]";
const DEFAULT_LINE_WIDTH = "w-10";

function Dot() {
  return (
    <span
      aria-hidden
      className="h-1 w-1 rounded-full bg-brand-muted [box-shadow:0_0_4px_rgba(107,140,206,0.8)]"
    />
  );
}

export default function MetaStrip({
  children,
  as: Tag = "span",
  textClassName = DEFAULT_TEXT_CLASSNAME,
  wrapperClassName = "",
  lineWidth = DEFAULT_LINE_WIDTH,
}: {
  children: ReactNode;
  as?: ElementType;
  textClassName?: string;
  wrapperClassName?: string;
  lineWidth?: string;
}) {
  return (
    <Tag
      className={[
        "flex items-center gap-3 font-mono text-brand-muted",
        textClassName,
        wrapperClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden className={`h-px ${lineWidth} bg-gradient-to-r from-transparent to-[#3b5a99]`} />
      <Dot />
      {children}
      <Dot />
      <span aria-hidden className={`h-px ${lineWidth} bg-gradient-to-l from-transparent to-[#3b5a99]`} />
    </Tag>
  );
}
