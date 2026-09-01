import { useEffect } from "react";
import { DIFFICULTY, type Difficulty } from "../game/logic";
import type { ScoreEntry } from "../game/storage";
import { cn } from "../utils/cn";

const DIFFS: Difficulty[] = ["novice", "skilled", "unbeatable"];

function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function HighScoreTable({
  scores,
  highlight,
  compact,
}: {
  scores: ScoreEntry[];
  highlight?: number;
  compact?: boolean;
}) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-[11px] font-bold tracking-[0.28em] text-white/40 uppercase">
          Hall of Fame
        </h3>
        <span className="font-display text-[10px] tracking-widest text-white/20">TOP {scores.length || 0}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
        {scores.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-white/30">
            No runs recorded yet — be the first.
          </p>
        ) : (
          <ul className={cn("divide-y divide-white/5", compact && "max-h-44 overflow-y-auto")}>
            {scores.map((s, i) => {
              const isNew = highlight !== undefined && s.date === highlight;
              return (
                <li
                  key={`${s.date}-${i}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                    isNew ? "bg-cyan-glow/15" : i % 2 ? "bg-white/[0.02]" : "",
                  )}
                >
                  <span
                    className={cn(
                      "w-5 font-display text-xs font-black",
                      i === 0
                        ? "text-gold"
                        : i === 1
                          ? "text-white/70"
                          : i === 2
                            ? "text-amber-700"
                            : "text-white/25",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "flex-1 font-display text-base font-black tabular-nums",
                      isNew ? "text-cyan-glow" : "text-white/90",
                    )}
                  >
                    {s.score.toLocaleString()}
                  </span>
                  <span className="hidden text-[11px] tracking-wider text-white/35 sm:block">
                    {s.mode === "ai" ? s.difficulty : "2P"}
                  </span>
                  <span className="text-[11px] tracking-wider text-white/30">
                    🔥 {s.streak}
                  </span>
                  <span className="w-9 text-right text-[10px] text-white/20 tabular-nums">
                    {fmtDate(s.date)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function StartScreen({
  mode,
  setMode,
  difficulty,
  setDifficulty,
  scores,
  onStart,
}: {
  mode: "ai" | "local";
  setMode: (m: "ai" | "local") => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  scores: ScoreEntry[];
  onStart: () => void;
}) {
  return (
    <div className="enter-up flex w-full max-w-md flex-col items-center gap-5">
      <div className="relative select-none text-center">
        <div className="pulse-glow font-display text-[10px] font-bold tracking-[0.55em] text-cyan-glow/70 uppercase">
          Neon Arcade
        </div>
        <h1 className="neon-title mt-1 text-[clamp(2.4rem,11vw,3.6rem)] leading-[0.95]">
          TIC TAC TOE
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2 text-white/30">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-glow/50" />
          <span className="font-display text-[10px] tracking-[0.3em] uppercase">
            best of nerve
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-pink-glow/50" />
        </div>
      </div>

      <div className="panel w-full space-y-4 p-4">
        <div>
          <div className="mb-2 font-display text-[10px] font-bold tracking-[0.28em] text-white/35 uppercase">
            Mode
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="chip !py-2.5 !text-[11px]"
              data-active={mode === "ai"}
              onClick={() => setMode("ai")}
            >
              ⚡ VS CPU
            </button>
            <button
              className="chip !py-2.5 !text-[11px]"
              data-active={mode === "local"}
              onClick={() => setMode("local")}
            >
              👥 2 Players
            </button>
          </div>
        </div>

        {mode === "ai" ? (
          <div>
            <div className="mb-2 font-display text-[10px] font-bold tracking-[0.28em] text-white/35 uppercase">
              Difficulty
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DIFFS.map((d) => (
                <button
                  key={d}
                  className="chip !px-2 !py-2.5 !text-[10px]"
                  data-active={difficulty === d}
                  onClick={() => setDifficulty(d)}
                >
                  {DIFFICULTY[d].label}
                  <span className="ml-1 opacity-60">×{DIFFICULTY[d].mult}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 h-4 text-center text-[11px] tracking-wide text-cyan-glow/60">
              {DIFFICULTY[difficulty].blurb}
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-[11px] tracking-wide text-white/45">
            Hot-seat duel. No score multiplier — bragging rights only.
          </p>
        )}

        <button
          className="btn btn-primary w-full !py-3.5 !text-base"
          onClick={onStart}
          autoFocus
        >
          ▶ Start Run
          <span className="ml-1 rounded border border-black/25 bg-black/15 px-1.5 py-0.5 text-[10px]">
            Enter
          </span>
        </button>
      </div>

      <HighScoreTable scores={scores} compact />

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px]">
        <span className="text-white/30">
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] text-white/60">
            ←↑↓→
          </kbd>{" "}
          move
        </span>
        <span className="text-white/30">
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] text-white/60">
            Space
          </kbd>{" "}
          place
        </span>
        <span className="text-white/30">
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] text-white/60">
            Esc
          </kbd>{" "}
          pause
        </span>
        <span className="text-white/30">
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] text-white/60">
            M
          </kbd>{" "}
          mute
        </span>
      </div>
    </div>
  );
}

export function PauseOverlay({
  onResume,
  onRestart,
  onQuit,
}: {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}) {
  return (
    <div className="enter-pop fixed inset-0 z-30 flex items-center justify-center bg-void/88 p-6">
      <div className="panel w-full max-w-xs space-y-4 p-6 text-center">
        <h2 className="font-display text-2xl font-black tracking-[0.2em] text-white">PAUSED</h2>
        <p className="text-sm text-white/40">Take a breath. The grid waits.</p>
        <div className="flex flex-col gap-2">
          <button className="btn btn-primary w-full" onClick={onResume}>
            Resume
          </button>
          <button className="btn w-full" onClick={onRestart}>
            Restart Round
          </button>
          <button className="btn btn-danger w-full" onClick={onQuit}>
            End Run
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoundOverOverlay({
  title,
  subtitle,
  color,
  points,
  streak,
  lives,
  nextLabel = "Next Round",
  onNext,
  onQuit,
}: {
  title: string;
  subtitle: string;
  color: string;
  points: number;
  streak: number;
  lives: number | null;
  nextLabel?: string;
  onNext: () => void;
  onQuit: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = document.getElementById("next-round-btn");
      el?.focus();
    }, 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-void/85 p-6">
      <div className="panel enter-pop w-full max-w-xs space-y-4 p-6 text-center">
        <div
          className="font-display text-[clamp(1.8rem,8vw,2.4rem)] leading-none font-black tracking-[0.12em]"
          style={{ color, textShadow: `0 0 30px ${color}88` }}
        >
          {title}
        </div>
        <p className="text-sm text-white/45">{subtitle}</p>

        {points > 0 && (
          <div className="rounded-xl border border-white/10 bg-black/40 py-3">
            <div className="font-display text-[10px] tracking-[0.3em] text-white/35 uppercase">
              Points earned
            </div>
            <div
              className="font-display text-3xl font-black tabular-nums"
              style={{ color, textShadow: `0 0 22px ${color}77` }}
            >
              +{points.toLocaleString()}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-[11px] tracking-widest text-white/40 uppercase">
          {lives !== null && (
            <span>
              Lives <span className="text-pink-glow">{"♥".repeat(Math.max(0, lives))}</span>
            </span>
          )}
          <span>
            Streak <span className="text-white/80">{streak}</span>
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button id="next-round-btn" className="btn btn-primary w-full" onClick={onNext}>
            {nextLabel}
            <span className="ml-1 rounded border border-black/25 bg-black/15 px-1.5 py-0.5 text-[10px]">
              Space
            </span>
          </button>
          <button className="btn w-full" onClick={onQuit}>
            End Run
          </button>
        </div>
      </div>
    </div>
  );
}

export function GameOverScreen({
  score,
  wins,
  draws,
  losses,
  bestStreak,
  isHighScore,
  rank,
  scores,
  highlight,
  onReplay,
  onMenu,
}: {
  score: number;
  wins: number;
  draws: number;
  losses: number;
  bestStreak: number;
  isHighScore: boolean;
  rank: number;
  scores: ScoreEntry[];
  highlight?: number;
  onReplay: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="panel enter-pop w-full space-y-4 p-6 text-center">
        <div className="font-display text-[10px] font-bold tracking-[0.5em] text-pink-glow/70 uppercase">
          Run Complete
        </div>
        <h2 className="neon-title text-[clamp(2rem,9vw,2.8rem)] leading-none">GAME OVER</h2>

        {isHighScore && (
          <div className="shimmer-text font-display text-sm font-black tracking-[0.25em] uppercase">
            ★ New High Score{rank > 0 ? ` — #${rank}` : ""} ★
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-black/40 py-4">
          <div className="font-display text-[10px] tracking-[0.3em] text-white/35 uppercase">
            Final Score
          </div>
          <div className="font-display text-5xl font-black tabular-nums text-cyan-glow drop-shadow-[0_0_24px_rgba(34,211,238,.6)]">
            {score.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Wins", value: wins, color: "text-cyan-glow" },
            { label: "Draws", value: draws, color: "text-white/70" },
            { label: "Losses", value: losses, color: "text-pink-glow" },
            { label: "Streak", value: bestStreak, color: "text-gold" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.03] py-2">
              <div className={cn("font-display text-xl font-black tabular-nums", s.color)}>
                {s.value}
              </div>
              <div className="font-display text-[9px] tracking-[0.18em] text-white/30 uppercase">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="btn btn-primary flex-1" onClick={onReplay} autoFocus>
            ↻ Play Again
          </button>
          <button className="btn flex-1" onClick={onMenu}>
            Main Menu
          </button>
        </div>
      </div>

      <HighScoreTable scores={scores} highlight={highlight} compact />
    </div>
  );
}
