import { useCallback, useEffect, useRef, useState } from "react";
import {
  DIFFICULTY,
  emptyBoard,
  evaluate,
  pickMove,
  type Board as BoardState,
  type Difficulty,
  type Mark,
  type Outcome,
} from "./game/logic";
import { loadPrefs, loadScores, savePrefs, saveScore, type ScoreEntry } from "./game/storage";
import { sfx, unlockAudio, vibrate } from "./game/audio";
import { JuiceProvider, useJuice } from "./juice/JuiceProvider";
import { Board } from "./components/Board";
import { MARK_COLOR } from "./components/Marks";
import {
  DifficultyBadge,
  Hearts,
  ScoreValue,
  StreakBadge,
  TurnIndicator,
} from "./components/Hud";
import {
  GameOverScreen,
  PauseOverlay,
  RoundOverOverlay,
  StartScreen,
} from "./components/Screens";

type Phase = "menu" | "playing" | "roundover" | "gameover";
type Mode = "ai" | "local";

type Result = {
  title: string;
  subtitle: string;
  color: string;
  points: number;
  kind: "win" | "loss" | "draw" | "p1" | "p2";
};

const other = (m: Mark): Mark => (m === "X" ? "O" : "X");
const MAX_LIVES = 3;

function cellCenter(index: number) {
  const el = document.querySelectorAll<HTMLElement>(".cell")[index];
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function Game() {
  const juice = useJuice();
  const prefs = useRef(loadPrefs());

  const [phase, setPhase] = useState<Phase>("menu");
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<Mode>(prefs.current.mode === "local" ? "local" : "ai");
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const d = prefs.current.difficulty;
    return d === "novice" || d === "skilled" || d === "unbeatable" ? d : "skilled";
  });

  const [board, setBoard] = useState<BoardState>(emptyBoard);
  const [turn, setTurn] = useState<Mark>("X");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [round, setRound] = useState(0);
  const [cursor, setCursor] = useState(4);
  const [thinking, setThinking] = useState(false);
  const [boardKey, setBoardKey] = useState(0);
  const [lostKey, setLostKey] = useState(0);

  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [stats, setStats] = useState({ wins: 0, draws: 0, losses: 0 });

  const [result, setResult] = useState<Result | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [highlight, setHighlight] = useState<number | undefined>(undefined);
  const [rank, setRank] = useState(0);
  const [isHigh, setIsHigh] = useState(false);

  const streakRef = useRef(0);
  const genRef = useRef(0);
  const timers = useRef<number[]>([]);
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => setScores(loadScores()), []);

  useEffect(() => {
    savePrefs({ difficulty, mode, muted: juice.muted });
  }, [difficulty, mode, juice.muted]);

  // guards against a keypress + focused-button click firing the same action twice
  const actRef = useRef(0);
  const guard = useCallback((fn: () => void) => {
    const now = performance.now();
    if (now - actRef.current < 280) return;
    actRef.current = now;
    fn();
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const gen = genRef.current;
    const id = window.setTimeout(() => {
      if (genRef.current === gen) fn();
    }, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ---------- audio unlock on first interaction ----------
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // ---------- round lifecycle ----------
  const startRound = useCallback(
    (starter?: Mark) => {
      genRef.current += 1;
      clearTimers();
      setBoard(emptyBoard());
      setOutcome(null);
      setResult(null);
      setThinking(false);
      setCursor(4);
      setTurn(starter ?? "X");
      setPaused(false);
      setPhase("playing");
    },
    [clearTimers],
  );

  const startRun = useCallback(() => {
    streakRef.current = 0;
    setLives(MAX_LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setStats({ wins: 0, draws: 0, losses: 0 });
    setRound(0);
    setHighlight(undefined);
    sfx.start();
    juice.flash("#22d3ee");
    startRound("X");
  }, [juice, startRound]);

  const nextRound = useCallback(() => {
    const r = round + 1;
    setRound(r);
    startRound(r % 2 === 0 ? "X" : "O");
    sfx.ui();
  }, [round, startRound]);

  const endRun = useCallback(() => {
    genRef.current += 1;
    clearTimers();
    setThinking(false);
    setPaused(false);
    let newScores = scores;
    if (score > 0) {
      const entry: ScoreEntry = {
        score,
        wins: stats.wins,
        streak: bestStreak,
        difficulty: mode === "ai" ? DIFFICULTY[difficulty].label : "2P",
        mode,
        date: Date.now(),
      };
      newScores = saveScore(entry);
      setHighlight(entry.date);
      const idx = newScores.findIndex((e) => e.date === entry.date);
      setIsHigh(idx >= 0);
      setRank(idx + 1);
      if (idx === 0) {
        juice.burst(window.innerWidth / 2, window.innerHeight * 0.42, {
          count: 90,
          colors: ["#fbbf24", "#22d3ee", "#ffffff", "#fb7185"],
          speed: 11,
          size: 6,
          life: 70,
          grav: 0.2,
        });
        juice.shake(10, 500);
      }
    } else {
      setIsHigh(false);
      setRank(0);
    }
    setScores(newScores);
    setPhase("gameover");
    sfx.ui();
  }, [bestStreak, clearTimers, difficulty, juice, mode, score, scores, stats.wins]);

  // ---------- move resolution ----------
  const finishRound = useCallback(
    (res: NonNullable<Outcome>, finalBoard: BoardState) => {
      const mult = mode === "ai" ? DIFFICULTY[difficulty].mult : 1;
      const streakNow = streakRef.current;
      let points = 0;
      let r: Result;

      if (res.winner === "draw") {
        points = Math.round(30 * mult);
        r = {
          kind: "draw",
          title: "STALEMATE",
          subtitle:
            mode === "ai"
              ? difficulty === "unbeatable"
                ? "You held the perfect machine. Respect."
                : "Neither side blinked."
              : "An even match.",
          color: "#a5b4fc",
          points,
        };
        setStats((s) => ({ ...s, draws: s.draws + 1 }));
        sfx.draw();
        juice.shake(5, 300);
      } else if (mode === "local") {
        points = 100 + streakNow * 50;
        r = {
          kind: res.winner === "X" ? "p1" : "p2",
          title: `PLAYER ${res.winner} WINS`,
          subtitle: "Crowd goes wild.",
          color: MARK_COLOR[res.winner],
          points,
        };
        setStats((s) => ({ ...s, wins: s.wins + 1 }));
        sfx.win();
        juice.shake(12, 460);
        juice.flash(`${MARK_COLOR[res.winner]}55`);
      } else if (res.winner === "X") {
        const yourMarks = finalBoard.filter((c) => c === "X").length;
        const bonus = yourMarks === 3 ? 150 : yourMarks === 4 ? 75 : 0;
        points = Math.round((100 + streakNow * 50) * mult) + bonus;
        r = {
          kind: "win",
          title: "YOU WIN",
          subtitle:
            yourMarks === 3
              ? "Flawless three-move finish."
              : "The grid bends to your will.",
          color: "#22d3ee",
          points,
        };
        setStats((s) => ({ ...s, wins: s.wins + 1 }));
        sfx.win();
        juice.shake(14, 520);
        juice.flash("#22d3ee44");
      } else {
        r = {
          kind: "loss",
          title: "CPU WINS",
          subtitle: "Shake it off — one life down.",
          color: "#fb7185",
          points: 0,
        };
        setStats((s) => ({ ...s, losses: s.losses + 1 }));
        setLives((l) => Math.max(0, l - 1));
        setLostKey((k) => k + 1);
        sfx.lose();
        juice.shake(11, 420);
        juice.flash("#fb718544");
      }

      // streak bookkeeping
      const newStreak =
        r.kind === "loss" ? 0 : r.kind === "draw" ? streakNow : streakNow + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));

      if (points > 0) {
        setScore((s) => s + points);
        const c = document.querySelector(".board")?.getBoundingClientRect();
        if (c) {
          juice.float(c.left + c.width / 2, c.top + c.height * 0.32, `+${points}`, r.color, 38);
        }
      }

      // particles along the winning line
      if (res.line) {
        const a = cellCenter(res.line[0]);
        const b = cellCenter(res.line[2]);
        juice.burstLine(a.x, a.y, b.x, b.y, {
          count: 7,
          colors:
            res.winner === "X"
              ? ["#22d3ee", "#a5f3fc", "#ffffff"]
              : ["#fb7185", "#fecdd3", "#ffffff"],
          speed: 6,
          size: 5,
          life: 60,
          grav: 0.16,
        });
      } else {
        const a = cellCenter(4);
        juice.burst(a.x, a.y, {
          count: 30,
          colors: ["#a5b4fc", "#ffffff"],
          speed: 5,
          size: 4,
          life: 45,
        });
      }

      vibrate(r.kind === "loss" ? [30, 40, 30] : 60);
      setResult(r);
      setPhase("roundover");
    },
    [difficulty, juice, mode],
  );

  const applyMove = useCallback(
    (index: number, mark: Mark, pos?: { x: number; y: number }) => {
      const cur = boardRef.current;
      if (cur[index]) return false;
      const next = cur.slice();
      next[index] = mark;
      const res = evaluate(next);
      const p = pos ?? cellCenter(index);

      setBoard(next);
      setBoardKey((k) => k + 1);
      setCursor(index);

      juice.burst(p.x, p.y, {
        count: 16,
        colors:
          mark === "X" ? ["#22d3ee", "#a5f3fc", "#ffffff"] : ["#fb7185", "#fecdd3", "#ffffff"],
        speed: 5,
        size: 5,
        life: 36,
        grav: 0.2,
        square: Math.random() > 0.5,
      });
      sfx.place(mark);
      vibrate(14);

      if (res) {
        setOutcome(res);
        setThinking(false);
        later(() => finishRound(res, next), res.winner === "draw" ? 520 : 780);
      } else {
        setTurn(other(mark));
      }
      return true;
    },
    [finishRound, juice, later],
  );

  // ---------- AI turn ----------
  useEffect(() => {
    if (phase !== "playing" || paused) return;
    if (mode !== "ai" || turn !== "O") return;
    if (evaluate(board)) return;

    const gen = genRef.current;
    setThinking(true);
    const [min, max] = DIFFICULTY[difficulty].think;
    const delay = min + Math.random() * (max - min);
    const id = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      const move = pickMove(board.slice(), "O", difficulty);
      setThinking(false);
      if (move >= 0) applyMove(move, "O");
    }, delay);
    timers.current.push(id);
    return () => window.clearTimeout(id);
  }, [applyMove, board, difficulty, mode, paused, phase, turn]);

  // ---------- input ----------
  const humanTurn = () => {
    if (phase !== "playing" || paused || outcome) return false;
    if (mode === "ai" && turn !== "X") return false;
    return true;
  };

  const handlePick = useCallback(
    (index: number, x: number, y: number) => {
      if (!humanTurn()) {
        sfx.invalid();
        juice.shake(3, 180);
        return;
      }
      const mark: Mark = mode === "ai" ? "X" : turn;
      const ok = applyMove(index, mark, { x, y });
      if (!ok) {
        sfx.invalid();
        juice.shake(4, 200);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyMove, juice, mode, outcome, paused, phase, turn],
  );

  const moveCursor = useCallback((dx: number, dy: number) => {
    setCursor((c) => {
      const col = c % 3;
      const row = Math.floor(c / 3);
      const nc = Math.min(2, Math.max(0, col + dx));
      const nr = Math.min(2, Math.max(0, row + dy));
      return nr * 3 + nc;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();

      if (k === "m") {
        juice.toggleMute();
        return;
      }

      if (phase === "menu") {
        if (k === "enter" || k === " ") {
          e.preventDefault();
          guard(startRun);
        }
        return;
      }

      if (phase === "gameover") {
        if (k === "enter" || k === " " || k === "r") {
          e.preventDefault();
          guard(startRun);
        } else if (k === "escape") {
          setPhase("menu");
          sfx.ui();
        }
        return;
      }

      if (phase === "roundover") {
        if (k === "enter" || k === " " || k === "r") {
          e.preventDefault();
          guard(() => (mode === "ai" && lives <= 0 ? endRun() : nextRound()));
        } else if (k === "escape") {
          guard(endRun);
        }
        return;
      }

      // playing
      if (k === "escape" || k === "p") {
        e.preventDefault();
        setPaused((p) => {
          sfx.ui();
          return !p;
        });
        return;
      }
      if (paused) {
        if (k === "r") {
          sfx.ui();
          startRound(turn);
        } else if (k === "q") {
          endRun();
        }
        return;
      }
      if (k === "r") {
        e.preventDefault();
        sfx.ui();
        startRound(turn);
        return;
      }
      if (k === "arrowleft" || k === "a") {
        e.preventDefault();
        moveCursor(-1, 0);
        sfx.tick();
      } else if (k === "arrowright" || k === "d") {
        e.preventDefault();
        moveCursor(1, 0);
        sfx.tick();
      } else if (k === "arrowup" || k === "w") {
        e.preventDefault();
        moveCursor(0, -1);
        sfx.tick();
      } else if (k === "arrowdown" || k === "s") {
        e.preventDefault();
        moveCursor(0, 1);
        sfx.tick();
      } else if (k === " " || k === "enter") {
        e.preventDefault();
        const c = cellCenter(cursor);
        handlePick(cursor, c.x, c.y);
      } else if (/^[1-9]$/.test(k)) {
        const idx = Number(k) - 1;
        const c = cellCenter(idx);
        handlePick(idx, c.x, c.y);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    cursor,
    endRun,
    guard,
    handlePick,
    juice,
    lives,
    mode,
    moveCursor,
    nextRound,
    paused,
    phase,
    startRound,
    startRun,
    turn,
  ]);

  // ---------- render ----------
  const scorePanel = (
    <div className="flex items-center justify-between gap-3">
      <div className="panel flex items-center gap-3 px-3 py-2">
        <div>
          <div className="font-display text-[9px] tracking-[0.28em] text-white/35 uppercase">
            Score
          </div>
          <ScoreValue
            value={score}
            className="font-display text-2xl leading-none font-black text-cyan-glow tabular-nums drop-shadow-[0_0_16px_rgba(34,211,238,.55)]"
          />
        </div>
        {mode === "ai" && (
          <>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="font-display text-[9px] tracking-[0.28em] text-white/35 uppercase">
                Lives
              </div>
              <Hearts lives={lives} lostKey={lostKey} />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {mode === "ai" && (
          <div className="hidden sm:block">
            <DifficultyBadge difficulty={difficulty} />
          </div>
        )}
        <StreakBadge streak={streak} />
        <button
          className="btn !px-2.5 !py-2"
          onClick={juice.toggleMute}
          aria-label={juice.muted ? "Unmute" : "Mute"}
          title="Mute (M)"
        >
          {juice.muted ? "🔇" : "🔊"}
        </button>
        <button
          className="btn !px-2.5 !py-2"
          onClick={() => {
            sfx.ui();
            setPaused(true);
          }}
          aria-label="Pause"
          title="Pause (Esc)"
        >
          ❚❚
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-blobs">
          <i />
          <i />
          <i />
        </div>
        <div className="bg-grid" />
        <div className="vignette" />
      </div>

      {phase === "menu" ? (
        <div className="relative z-10 flex max-h-[100dvh] w-full max-w-md flex-col items-center overflow-y-auto overscroll-contain px-3 py-6">
          <StartScreen
            mode={mode}
            setMode={(m) => {
              sfx.ui();
              setMode(m);
            }}
            difficulty={difficulty}
            setDifficulty={(d) => {
              sfx.ui();
              setDifficulty(d);
            }}
            scores={scores}
            onStart={startRun}
          />
        </div>
      ) : phase === "gameover" ? (
        <div className="relative z-10 flex max-h-[100dvh] w-full max-w-md flex-col items-center overflow-y-auto overscroll-contain px-3 py-6">
          <GameOverScreen
            score={score}
            wins={stats.wins}
            draws={stats.draws}
            losses={stats.losses}
            bestStreak={bestStreak}
            isHighScore={isHigh}
            rank={rank}
            scores={scores}
            highlight={highlight}
            onReplay={startRun}
            onMenu={() => {
              sfx.ui();
              setPhase("menu");
            }}
          />
        </div>
      ) : (
        <div className="relative z-10 flex max-h-[100dvh] w-full max-w-md flex-col items-center gap-3 overflow-y-auto overscroll-contain px-3 py-4">
          {scorePanel}

          <div className="w-full max-w-[min(92vw,26rem)]">
            <Board
              board={board}
              winLine={outcome?.line ?? null}
              cursor={cursor}
              locked={!!outcome || paused || (mode === "ai" && turn === "O")}
              boardKey={boardKey}
              ghostMark={mode === "ai" ? "X" : turn}
              onPick={handlePick}
              onHover={(i) => setCursor(i)}
            />
          </div>

          <TurnIndicator turn={turn} you={"X"} thinking={thinking} mode={mode} />

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-white/30">
            <span>
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] text-white/60">
                Arrows
              </kbd>{" "}
              move
            </span>
            <span>
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] text-white/60">
                Space
              </kbd>{" "}
              place
            </span>
            <span>
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] text-white/60">
                R
              </kbd>{" "}
              restart
            </span>
            <span>
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-display text-[10px] text-white/60">
                Esc
              </kbd>{" "}
              pause
            </span>
          </div>
        </div>
      )}

      {phase === "playing" && paused && (
        <PauseOverlay
          onResume={() => {
            sfx.ui();
            setPaused(false);
          }}
          onRestart={() => {
            sfx.ui();
            startRound(turn);
          }}
          onQuit={endRun}
        />
      )}

      {phase === "roundover" && result && (
        <RoundOverOverlay
          title={result.title}
          subtitle={result.subtitle}
          color={result.color}
          points={result.points}
          streak={streak}
          lives={mode === "ai" ? lives : null}
          nextLabel={mode === "ai" && lives <= 0 ? "View Results" : undefined}
          onNext={() => guard(() => (mode === "ai" && lives <= 0 ? endRun() : nextRound()))}
          onQuit={() => guard(endRun)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <JuiceProvider>
      <Game />
    </JuiceProvider>
  );
}
