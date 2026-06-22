// Tek bir hücre: delik (hexagon) + içinde varsa peg (mat siyah küre).
// Tıklama davranışı parent (Board) tarafından yönetilir; bu component sadece
// görsel durumu (peg var mı, seçili mi, geçerli hedef mi) render eder.

type PegProps = {
  hasPeg: boolean;
  isSelected: boolean;
  isValidTarget: boolean;
  onClick: () => void;
};

export default function Peg({
  hasPeg,
  isSelected,
  isValidTarget,
  onClick,
}: PegProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={[
        "relative flex items-center justify-center",
        "w-full h-full",
        "transition-transform duration-200 ease-out",
      ].join(" ")}
    >
      {/* Hedef glow (clip-path olmayan katman, dışa taşan parlamayı keser) */}
      {isValidTarget && (
        <span className="absolute inset-0 animate-pulse-glow rounded-full" />
      )}

      {/* Delik (hexagon, içe gömük) */}
      <span
        className={[
          "absolute inset-0 [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0%_50%)]",
          "bg-[#3a2415] shadow-[inset_0_3px_6px_rgba(0,0,0,0.7),inset_0_-1px_2px_rgba(255,255,255,0.05)]",
        ].join(" ")}
      />

      {/* Peg (mat siyah küre) */}
      {hasPeg && (
        <span
          className={[
            "relative z-10 rounded-full w-[68%] h-[68%]",
            "bg-[radial-gradient(circle_at_35%_30%,#3a3a3a,#1a1a1a_55%,#000_100%)]",
            "shadow-[0_3px_5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)]",
            "transition-transform duration-200 ease-out",
            isSelected ? "scale-110 ring-2 ring-[#2563EB] shadow-[0_0_10px_3px_rgba(37,99,235,0.8)]" : "",
          ].join(" ")}
        />
      )}
    </button>
  );
}
