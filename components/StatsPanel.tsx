// Üst stats paneli: PEGS / MOVES / TIME, yatay 3 sütun, retro dot-matrix stil.

type StatsPanelProps = {
  pegs: number;
  moves: number;
  time: string;
};

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] tracking-[0.2em] text-brand-muted font-mono opacity-70">
        {label}
      </span>
      <span className="text-xl font-led tracking-[0.05em] text-brand-primary [text-shadow:0_0_6px_rgba(91,155,255,0.35)]">
        {value}
      </span>
    </div>
  );
}

export default function StatsPanel({ pegs, moves, time }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-3 w-full max-w-[380px] mx-auto rounded-lg border border-[#3b82f6]/40 bg-[rgba(10,18,40,0.55)] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),inset_0_0_20px_rgba(0,82,255,0.10),0_0_15px_rgba(0,82,255,0.20)] px-4 py-3">
      <StatItem label="PEGS" value={pegs} />
      <StatItem label="MOVES" value={moves} />
      <StatItem label="TIME" value={time} />
    </div>
  );
}
