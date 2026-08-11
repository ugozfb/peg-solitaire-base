// Tek bir hücre: delik (hexagon) + içinde varsa peg (mat siyah küre).
// Tıklama davranışı parent (Board) tarafından yönetilir; bu component sadece
// görsel durumu (peg var mı, seçili mi, geçerli hedef mi) render eder.

type PegProps = {
  hasPeg: boolean;
  isSelected: boolean;
  isValidTarget: boolean;
  /** Yakalanan peg: commit'ten önce erime (fade-out) animasyonu oynar. */
  isDissolving?: boolean;
  /** Kayan (from) peg: küre overlay'de çizildiği için burada gizlenir. */
  isHidden?: boolean;
  onClick: () => void;
};

export default function Peg({
  hasPeg,
  isSelected,
  isValidTarget,
  isDissolving = false,
  isHidden = false,
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
        <>
          <span className="absolute inset-0 animate-pulse-glow rounded-full" />
          <span className="absolute inset-[28%] rounded-full ring-2 ring-[#0052FF]/70 pointer-events-none" />
        </>
      )}

      {/* Delik (hexagon, içe gömük) */}
      <span
        className={[
          "absolute inset-0 [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0%_50%)]",
          "bg-[radial-gradient(circle_at_50%_42%,#332015_0%,#3d2819_55%,#2b180d_100%)] shadow-[inset_0_4px_8px_rgba(0,0,0,0.85),inset_0_-2px_3px_rgba(255,255,255,0.08),inset_0_0_10px_rgba(0,0,0,0.5)]",
        ].join(" ")}
      />

      {/* Peg (mat siyah küre) */}
      {hasPeg && !isHidden && (
        <span
          className={[
            "relative z-10 rounded-full w-[68%] h-[68%]",
            "bg-[radial-gradient(circle_at_34%_28%,#5a5f6b_0%,#33373f_28%,#16181d_62%,#050608_100%)]",
            "shadow-[0_4px_8px_rgba(0,0,0,0.65),inset_0_2px_3px_rgba(255,255,255,0.25),inset_0_-3px_5px_rgba(0,0,0,0.5)]",
            "transition-transform duration-200 ease-out",
            isSelected ? "scale-110" : "",
            isDissolving ? "peg-dissolve" : "",
          ].join(" ")}
        >
          {isSelected && (
            <span className="absolute inset-[-15%] rounded-full border-2 border-[#2563EB] animate-ring-breathe pointer-events-none" />
          )}
          <span className="absolute top-[14%] left-[22%] w-[26%] h-[20%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55)_0%,transparent_70%)] pointer-events-none" />
        </span>
      )}
    </button>
  );
}
