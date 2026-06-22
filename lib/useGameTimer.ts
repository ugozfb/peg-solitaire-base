// Basit süre sayacı hook'u: saniye bazlı, başlat/durdur/sıfırla kontrolü çağıran
// component'e bırakılır (running flag ile).

import { useEffect, useRef, useState } from "react";

export type GameTimer = {
  seconds: number;
  formatted: string; // "M:SS"
  reset: () => void;
};

/** running true olduğu sürece her saniye sayaç artar. */
export function useGameTimer(running: boolean): GameTimer {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${minutes}:${secs.toString().padStart(2, "0")}`;

  function reset() {
    setSeconds(0);
  }

  return { seconds, formatted, reset };
}
