import { useEffect, useRef, useState } from "react";
import type { Difficulty, Mark } from "../game/logic";
import { DIFFICULTY } from "../game/logic";
import { MiniMark } from "./Marks";
import { cn } from "../utils/cn";

function useCountUp(value: number, duration = 550) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const current = useRef(value);

  useEffect(() => {
    if (from.current === value) return;
    const a = from.current;
    const start = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(a + (value - a) * eased);
      current.current = v;
      setDisplay(v);
      if (t < 1) id = requestAnimationFrame(tick);
      else from.current = value;
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      from.current = current.current;
    };
  }, [value, duration]);

  return display;
}

export function ScoreValue({ value, className }: { value: number; className?: string }) {
  const d = useCountUp(value);
  return <span className={className}>{d.toLocaleString()}</span>;
}

export function Hearts({ lives, max = 3, lostKey }: { lives: number; max?: number; lostKey: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const alive = i < lives;
        return (
          <span
            key={i}
            className={cn(
              "text-lg leading-none transition-all duration-300",
              alive ? "text-pink-glow" : "text-white/12 scale-90",
            )}
            style={{
              filter: alive ? "drop-shadow(0 0 6px rgba(251,113,133,.9))" : "none",
              animation: !alive && lostKey > 0 ? "heart-pop .4s ease-out" : undefined,
            }}
          >
            {alive ? "♥" : "♡"}
          </span>
        );
      })}
    </div>
  );
}

export function TurnIndicator({
  turn,
  you,
  thinking,
  mode,
}: {
  turn: Mark;
  you: Mark;
  thinking: boolean;
  mode: "ai" | "local";
}) {
  const isYou = turn === you || mode === "local";
  const label =
    mode === "local"
      ? `Player ${turn}'s turn`
      : thinking
        ? "CPU computing…"
        : turn === you
          ? "Your move"
          : "CPU move";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-300",
          turn === "X"
            ? "border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow"
            : "border-pink-glow/50 bg-pink-glow/10 text-pink-glow",
        )}
        style={{ boxShadow: `0 0 24px -8px currentColor` }}
      >
        <MiniMark mark={turn} className="h-4 w-4" />
        <span className="font-display text-[11px] font-bold tracking-[0.18em] uppercase">
          {label}
        </span>
        {thinking && (
          <span className="ml-0.5 flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <i
                key={i}
                className="think-dot block h-1 w-1 rounded-full bg-current"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </div>
      <div className="h-3 font-display text-[9px] tracking-[0.3em] text-white/25 uppercase">
        {isYou ? "press space to place" : " "}
      </div>
    </div>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const cfg = DIFFICULTY[difficulty];
  return (
    <span className="chip" data-active="false">
      {cfg.label} ×{cfg.mult}
    </span>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  const hot = streak >= 2;
  return (
    <span
      className={cn(
        "chip transition-all duration-300",
        hot ? "text-white" : "",
      )}
      data-active={hot ? "true" : "false"}
      style={
        hot
          ? {
              background: "linear-gradient(135deg,#fbbf24,#fb7185)",
              boxShadow: "0 0 22px -4px rgba(251,191,36,.9)",
            }
          : undefined
      }
    >
      🔥 Streak {streak}
    </span>
  );
}

export function KeyHint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] font-bold text-white/70">
        {keys}
      </kbd>
      <span className="text-white/35">{label}</span>
    </span>
  );
}
