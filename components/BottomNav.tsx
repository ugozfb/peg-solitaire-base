// Alt navigasyon yer tutucu: Play / Boards / Leaderboard / Profile.
// Henüz aktif değil — sadece görsel.

const ITEMS = ["Play", "Boards", "Leaderboard", "Profile"];

export default function BottomNav() {
  return (
    <nav className="w-full border-t border-[#2563EB]/20 bg-black/60">
      <div className="grid grid-cols-4 max-w-[380px] mx-auto">
        {ITEMS.map((item, idx) => (
          <div
            key={item}
            className={[
              "py-3 text-center text-[10px] font-mono tracking-wider",
              idx === 0 ? "text-[#2563EB]" : "text-[#2563EB]/30",
            ].join(" ")}
          >
            {item.toUpperCase()}
          </div>
        ))}
      </div>
    </nav>
  );
}
