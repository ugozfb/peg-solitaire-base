// Peg Solitaire - Çekirdek veri tipleri
// Bu dosya tüm tahta tiplerinin ortak veri yapısını tanımlar.
// UI veya blockchain bağımlılığı YOKTUR - saf tip tanımları.

/**
 * Bir tahta hücresinin durumu:
 * - "peg":     içinde peg (taş) olan delik
 * - "empty":   boş delik (peg buraya atlayabilir)
 * - "blocked": tahtanın parçası olmayan hücre (örn. haç tahtanın köşeleri)
 */
export type BoardCell = "peg" | "empty" | "blocked";

/** Grid üzerindeki bir konum (satır, sütun). */
export type Position = {
  row: number;
  col: number;
};

/**
 * Hamlede uygulanan kural seti:
 * - "orthogonal": yatay/dikey (4 yön) atlama  -> Tahta 1-5
 * - "triangular": yatay + diagonal (6 yön)    -> Tahta 6
 */
export type RuleSet = "orthogonal" | "triangular";

/**
 * Bir tahta düzeni (statik tanım).
 * grid: dikdörtgen bir matris; üçgen tahtalar da dikdörtgen grid içinde
 * "blocked" hücrelerle temsil edilir.
 */
export type BoardLayout = {
  id: string;
  name: string;
  grid: BoardCell[][]; // Dikdörtgen grid (satır x sütun)
  initialEmpty: Position; // Başlangıçta boş olan delik
  ruleSet: RuleSet;
};

/**
 * Tek bir hamle:
 * - from: atlayan peg'in başlangıç konumu
 * - over: atlanan (kaldırılacak) peg'in konumu (from ile to arasında)
 * - to:   peg'in ineceği boş delik
 */
export type Move = {
  from: Position;
  over: Position;
  to: Position;
};

/**
 * Oyunun anlık durumu (immutable olarak işlenir).
 * - board:       hücrelerin güncel durumu
 * - moves:       hamle geçmişi (undo için)
 * - selectedPeg: UI'da seçili olan peg (yoksa null)
 * - status:      oyun durumu — "won": tek peg kaldı, "lost": hamle kalmadı
 */
export type GameState = {
  board: BoardCell[][];
  moves: Move[];
  selectedPeg: Position | null;
  status: "playing" | "won" | "lost";
};
