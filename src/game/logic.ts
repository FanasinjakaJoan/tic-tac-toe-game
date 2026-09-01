export type Mark = "X" | "O";
export type Cell = Mark | null;
export type Board = Cell[];

export const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type Outcome =
  | { winner: Mark; line: number[] }
  | { winner: "draw"; line: null }
  | null;

export const emptyBoard = (): Board => Array<Cell>(9).fill(null);

export function evaluate(b: Board): Outcome {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { winner: b[a] as Mark, line };
    }
  }
  if (b.every((cell) => cell !== null)) return { winner: "draw", line: null };
  return null;
}

export function openCells(b: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (!b[i]) out.push(i);
  return out;
}

const other = (m: Mark): Mark => (m === "X" ? "O" : "X");

/** Depth-aware minimax. Returns score from `ai`'s perspective. */
function minimax(b: Board, turn: Mark, ai: Mark, depth: number): number {
  const result = evaluate(b);
  if (result) {
    if (result.winner === "draw") return 0;
    return result.winner === ai ? 10 - depth : depth - 10;
  }
  const cells = openCells(b);
  let best = turn === ai ? -Infinity : Infinity;
  for (const i of cells) {
    b[i] = turn;
    const score = minimax(b, other(turn), ai, depth + 1);
    b[i] = null;
    if (turn === ai) {
      if (score > best) best = score;
      if (best >= 10 - depth) break; // alpha-beta-ish cutoff
    } else {
      if (score < best) best = score;
      if (best <= depth - 10) break;
    }
  }
  return best;
}

/** Every move tied for the best result, so the AI stays varied. */
export function bestMoves(b: Board, ai: Mark): { index: number; score: number }[] {
  const cells = openCells(b);
  if (cells.length === 0) return [];
  let bestScore = -Infinity;
  let best: number[] = [];
  for (const i of cells) {
    b[i] = ai;
    const score = minimax(b, other(ai), ai, 1);
    b[i] = null;
    if (score > bestScore) {
      bestScore = score;
      best = [i];
    } else if (score === bestScore) {
      best.push(i);
    }
  }
  return best.map((index) => ({ index, score: bestScore }));
}

export type Difficulty = "novice" | "skilled" | "unbeatable";

export const DIFFICULTY: Record<
  Difficulty,
  { label: string; blurb: string; mult: number; mistakeRate: number; think: [number, number] }
> = {
  novice: {
    label: "Novice",
    blurb: "Learning the ropes",
    mult: 1,
    mistakeRate: 0.72,
    think: [260, 520],
  },
  skilled: {
    label: "Skilled",
    blurb: "Punishes mistakes",
    mult: 1.6,
    mistakeRate: 0.3,
    think: [320, 620],
  },
  unbeatable: {
    label: "Unbeatable",
    blurb: "Perfect play. Draw is a win.",
    mult: 2.6,
    mistakeRate: 0,
    think: [380, 700],
  },
};

/** Picks a move for the AI. Occasionally blunders on lower difficulties. */
export function pickMove(b: Board, ai: Mark, difficulty: Difficulty): number {
  const cells = openCells(b);
  if (cells.length === 0) return -1;
  const cfg = DIFFICULTY[difficulty];
  const ranked = bestMoves(b, ai);

  if (Math.random() < cfg.mistakeRate) {
    // Blunder, but never pass up an immediate win.
    const instantWin = cells.find((i) => {
      b[i] = ai;
      const r = evaluate(b);
      b[i] = null;
      return r?.winner === ai;
    });
    if (instantWin !== undefined) return instantWin;
    return cells[Math.floor(Math.random() * cells.length)];
  }

  const top = ranked.filter((m) => m.score === Math.max(...ranked.map((r) => r.score)));
  return top[Math.floor(Math.random() * top.length)].index;
}
