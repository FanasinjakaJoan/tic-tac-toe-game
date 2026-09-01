import type { Mark } from "../game/logic";

export const MARK_COLOR: Record<Mark, string> = {
  X: "#22d3ee",
  O: "#fb7185",
};

export const MARK_SOFT: Record<Mark, string> = {
  X: "#a5f3fc",
  O: "#fecdd3",
};

export function MarkGlyph({ mark, dim }: { mark: Mark; dim?: boolean }) {
  const color = MARK_COLOR[mark];
  const glow = `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 26px ${color}88)`;
  return (
    <svg
      className={`mark mark-${mark.toLowerCase()}`}
      viewBox="0 0 100 100"
      style={{ filter: dim ? "none" : glow, opacity: dim ? 0.6 : 1 }}
      aria-hidden="true"
    >
      {mark === "X" ? (
        <>
          <line x1="22" y1="22" x2="78" y2="78" stroke={color} strokeWidth={11} />
          <line x1="78" y1="22" x2="22" y2="78" stroke={color} strokeWidth={11} />
        </>
      ) : (
        <>
          <circle cx="50" cy="50" r="27" stroke={color} strokeWidth={11} />
        </>
      )}
    </svg>
  );
}

export function MiniMark({ mark, className = "" }: { mark: Mark; className?: string }) {
  const color = MARK_COLOR[mark];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {mark === "X" ? (
        <>
          <line
            x1="24"
            y1="24"
            x2="76"
            y2="76"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
          />
          <line
            x1="76"
            y1="24"
            x2="24"
            y2="76"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
          />
        </>
      ) : (
        <circle
          cx="50"
          cy="50"
          r="27"
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
