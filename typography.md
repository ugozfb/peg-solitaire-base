# Peg Solitaire — Typography System

Tek kaynak. Yeni ekran/bileşen eklerken bu tablodaki rollere uy.

## Fontlar
- **font-led** (DotGothic16) — dot-matrix LED. SADECE: ana başlık + sayı/counter değerleri. Marka kimliği.
- **font-mono** (Geist Mono) — gövde. Etiketler, alt yazılar, board adı, butonlar, açıklamalar.

## Renk token'ları
- **text-brand-primary** (#5b9bff) — parlak vurgu: başlık, counter sayıları
- **text-brand-muted** (#6b8cce) — ikincil: etiketler, board adı
- **text-brand-dim** (#3b5a99) — en soluk: pasif/dekoratif, alt yazı

## Tipografi kademesi

| Rol | Kullanım | Font | Boyut | Tracking | Renk | Glow |
|-----|----------|------|-------|----------|------|------|
| Display / H1 | başlık | font-led | text-2xl (24px) | tracking-[0.2em] | brand-primary | neon text-shadow |
| Subtitle | alt yazı | font-mono | text-[11px] | tracking-[0.25em] | brand-dim | yok |
| Section | board adı | font-mono | text-xs (12px) | tracking-[0.15em] | brand-muted | yok |
| Label | stats etiket | font-mono | text-[10px] | tracking-[0.2em] | brand-muted | yok |
| Counter | stats sayı | font-led | text-xl (20px) | tracking-[0.05em] | brand-primary | hafif text-shadow |
| Button | buton | font-mono | text-sm (14px) | tracking-[0.1em] | duruma göre | yok |

## Glow reçetesi
- Neon (başlık): [text-shadow:0_0_10px_rgba(91,155,255,0.6),0_0_20px_rgba(91,155,255,0.3)]
- Hafif (counter): [text-shadow:0_0_6px_rgba(91,155,255,0.35)]
- Sönük (tertiary/quaternary): glow YOK

## Kurallar
- font-led dekoratiftir; asla uzun metin/paragraf için kullanma.
- Tracking kademesi: 0.05 (sıkı sayı) → 0.1 (başlık/buton) → 0.15 (section) → 0.2 (label) → 0.25 (subtitle, en ferah).
- Yeni renk gerekiyorsa önce token ekle (globals.css @theme), inline hex kullanma.
- Opacity hiyerarşisi: primary %100, secondary %100, tertiary ~%70 (opacity-70), quaternary ~%50 (opacity-50). Glow sadece primary (güçlü-yumuşak) ve secondary (hafif); tertiary/quaternary glow yok.
