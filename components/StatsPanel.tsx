// Üst stats paneli: PEGS / MOVES / TIME, yatay 3 sütun, retro dot-matrix stil.

type StatsPanelProps = {
  pegs: number;
  moves: number;
  time: string;
};

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] tracking-[0.2em] text-[#2563EB]/70 font-mono">
        {label}
      </span>
      <span className="text-lg font-mono font-bold text-[#0052FF] [text-shadow:0_0_8px_rgba(37,99,235,0.6)]">
        {value}
      </span>
    </div>
  );
}

export default function StatsPanel({ pegs, moves, time }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-3 w-full max-w-[380px] mx-auto rounded-lg border border-[#2563EB]/30 bg-black/40 px-4 py-3">
      <StatItem label="PEGS" value={pegs} />
      <StatItem label="MOVES" value={moves} />
      <StatItem label="TIME" value={time} />
    </div>
  );
}
