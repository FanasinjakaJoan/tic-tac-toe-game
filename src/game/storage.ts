export type ScoreEntry = {
  score: number;
  wins: number;
  streak: number;
  difficulty: string;
  mode: string;
  date: number;
};

const KEY = "neon-ttt.highscores.v1";
const PREF_KEY = "neon-ttt.prefs.v1";
export const MAX_SCORES = 7;

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.score === "number")
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SCORES);
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const next = [...loadScores(), entry].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / privacy mode */
  }
  return next;
}

export function clearScores(): ScoreEntry[] {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return [];
}

export type Prefs = {
  difficulty: string;
  mode: string;
  muted: boolean;
};

export const defaultPrefs: Prefs = { difficulty: "skilled", mode: "ai", muted: false };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
