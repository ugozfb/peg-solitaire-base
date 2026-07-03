// Üst stats paneli: PEGS / MOVES / TIME, yatay 3 sütun, retro dot-matrix stil.

type StatsPanelProps = {
  pegs: number;
  moves: number;
  time: string;
};

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] tracking-[0.2em] text-brand-muted font-mono font-semibold opacity-70">
        {label}
      </span>
      <span className="text-xl font-led tracking-[0.05em] text-brand-primary [text-shadow:0_0_4px_rgba(223,238,255,0.5),0_0_10px_rgba(59,130,246,0.3)]">
        {value}
      </span>
    </div>
  );
}

export default function StatsPanel({ pegs, moves, time }: StatsPanelProps) {
  return (
    <div className="relative grid grid-cols-3 w-full max-w-[380px] mx-auto rounded-lg border border-[#3b82f6]/40 bg-[rgba(10,18,40,0.55)] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),inset_0_0_20px_rgba(0,82,255,0.10),0_0_15px_rgba(0,82,255,0.20)] px-4 py-3">
      <span
        aria-hidden
        className="absolute inset-0 rounded-lg pointer-events-none bg-[radial-gradient(rgba(91,155,255,0.05)_1px,transparent_1px)] bg-[size:14px_14px]"
      />
      <span
        aria-hidden
        className="absolute inset-y-2 left-1/3 w-px pointer-events-none bg-gradient-to-b from-transparent via-[#5b9bff] to-transparent opacity-30"
      />
      <span
        aria-hidden
        className="absolute inset-y-2 left-2/3 w-px pointer-events-none bg-gradient-to-b from-transparent via-[#5b9bff] to-transparent opacity-30"
      />
      <StatItem label="PEGS" value={pegs} />
      <StatItem label="MOVES" value={moves} />
      <StatItem label="TIME" value={time} />
    </div>
  );
}
