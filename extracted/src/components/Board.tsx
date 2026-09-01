import { useEffect, useRef, useState } from "react";
import type { Board as BoardState, Mark } from "../game/logic";
import { MarkGlyph, MARK_COLOR } from "./Marks";

type Props = {
  board: BoardState;
  winLine: number[] | null;
  cursor: number;
  locked: boolean;
  boardKey: number;
  ghostMark: Mark;
  onPick: (index: number, clientX: number, clientY: number) => void;
  onHover?: (index: number) => void;
};

const CELL_POS = (i: number) => ({
  cx: (i % 3) * 100 + 50,
  cy: Math.floor(i / 3) * 100 + 50,
});

export function Board({
  board,
  winLine,
  cursor,
  locked,
  boardKey,
  ghostMark,
  onPick,
  onHover,
}: Props) {
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [punch, setPunch] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (boardKey === 0) return;
    const el = boardRef.current;
    if (!el || typeof el.animate !== "function") return;
    el.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.022)", offset: 0.3 },
        { transform: "scale(1)" },
      ],
      { duration: 240, easing: "ease-out" },
    );
  }, [boardKey]);

  // clear the punch marker when a fresh board appears
  useEffect(() => {
    if (board.every((c) => c === null)) setPunch(null);
  }, [board]);

  const handle = (i: number) => {
    const el = cellRefs.current[i];
    const r = el?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
    const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
    setPunch(i);
    onPick(i, x, y);
  };

  const beam = (() => {
    if (!winLine || winLine.length < 3) return null;
    const a = CELL_POS(winLine[0]);
    const b = CELL_POS(winLine[winLine.length - 1]);
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ex = (dx / len) * 34;
    const ey = (dy / len) * 34;
    return {
      x1: a.cx - ex,
      y1: a.cy - ey,
      x2: b.cx + ex,
      y2: b.cy + ey,
      color: MARK_COLOR[(board[winLine[0]] as Mark) ?? "X"],
    };
  })();

  return (
    <div
      ref={boardRef}
      className="board"
      onPointerLeave={() => setHover(null)}
    >
      {board.map((cell, i) => (
        <button
          key={i}
          ref={(el) => {
            cellRefs.current[i] = el;
          }}
          type="button"
          className="cell"
          data-filled={cell !== null}
          data-cursor={!locked && cursor === i && !cell ? "true" : "false"}
          data-win={winLine?.includes(i) ? "true" : undefined}
          data-punch={punch === i ? "true" : "false"}
          disabled={locked}
          aria-label={`Cell ${i + 1}${cell ? `, taken by ${cell}` : ", empty"}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handle(i);
          }}
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return;
            setHover(i);
            onHover?.(i);
          }}
          tabIndex={-1}
        >
          {cell ? (
            <MarkGlyph mark={cell} />
          ) : (
            !locked &&
            hover === i && (
              <span className="pointer-events-none flex h-full w-full items-center justify-center opacity-40 transition-opacity duration-150">
                <MarkGlyph mark={ghostMark} dim />
              </span>
            )
          )}
          <span className="pointer-events-none absolute right-1.5 bottom-1 font-display text-[9px] tracking-widest text-white/15">
            {i + 1}
          </span>
        </button>
      ))}

      {beam && (
        <svg className="win-beam" viewBox="0 0 300 300" aria-hidden="true">
          <line
            x1={beam.x1}
            y1={beam.y1}
            x2={beam.x2}
            y2={beam.y2}
            stroke={beam.color}
            strokeWidth={7}
            opacity={0.95}
            style={{ filter: `drop-shadow(0 0 14px ${beam.color})` }}
          />
        </svg>
      )}
    </div>
  );
}
