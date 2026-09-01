import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { setMuted, sfx } from "../game/audio";
import { loadPrefs } from "../game/storage";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  spin: number;
  rot: number;
  drag: number;
  grav: number;
  square: boolean;
};

type BurstOpts = {
  count?: number;
  colors?: string[];
  speed?: number;
  spread?: number;
  angle?: number;
  size?: number;
  life?: number;
  grav?: number;
  square?: boolean;
  drag?: number;
};

type FloatText = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
};

type JuiceApi = {
  burst: (x: number, y: number, opts?: BurstOpts) => void;
  burstLine: (x1: number, y1: number, x2: number, y2: number, opts?: BurstOpts) => void;
  shake: (amplitude: number, duration?: number) => void;
  float: (x: number, y: number, text: string, color?: string, size?: number) => void;
  flash: (color: string) => void;
  muted: boolean;
  toggleMute: () => void;
};

const JuiceCtx = createContext<JuiceApi | null>(null);

export function useJuice() {
  const ctx = useContext(JuiceCtx);
  if (!ctx) throw new Error("useJuice must be used inside <JuiceProvider>");
  return ctx;
}

const MAX_PARTICLES = 700;

export function JuiceProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number | null>(null);
  const lastTime = useRef(0);
  const shakeRef = useRef({ amp: 0, decay: 0.9 });
  const floatId = useRef(0);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [flashState, setFlashState] = useState<{ id: number; color: string } | null>(null);
  const mutedRef = useRef(loadPrefs().muted);
  const [muted, setMutedState] = useState(mutedRef.current);

  useEffect(() => {
    setMuted(mutedRef.current);
  }, []);

  const ensureLoop = useCallback(() => {
    if (raf.current !== null) return;
    lastTime.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(34, now - lastTime.current) / 16.667;
      lastTime.current = now;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "lighter";
        const arr = particles.current;
        for (let i = arr.length - 1; i >= 0; i--) {
          const p = arr[i];
          p.life -= dt;
          if (p.life <= 0) {
            arr.splice(i, 1);
            continue;
          }
          p.vy += p.grav * dt;
          p.vx *= Math.pow(p.drag, dt);
          p.vy *= Math.pow(p.drag, dt);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.spin * dt;
          const t = p.life / p.max;
          const alpha = t > 0.7 ? 1 : t / 0.7;
          const s = p.size * (0.4 + 0.6 * t);
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = p.color;
          if (p.square) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillRect(-s / 2, -s / 2, s, s);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      // screen shake
      const root = rootRef.current;
      const sh = shakeRef.current;
      if (root) {
        if (sh.amp > 0.15) {
          const a = sh.amp;
          const dx = (Math.random() * 2 - 1) * a;
          const dy = (Math.random() * 2 - 1) * a;
          const rot = (Math.random() * 2 - 1) * a * 0.14;
          root.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg)`;
          sh.amp *= Math.pow(sh.decay, dt);
        } else if (sh.amp !== 0) {
          sh.amp = 0;
          root.style.transform = "translate3d(0,0,0)";
        }
      }

      if (particles.current.length === 0 && sh.amp === 0) {
        raf.current = null;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  // sizing (DPR-capped so mobile stays at 60fps)
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const burst = useCallback(
    (x: number, y: number, opts: BurstOpts = {}) => {
      const {
        count = 18,
        colors = ["#22d3ee", "#a5f3fc", "#ffffff"],
        speed = 5.2,
        spread = Math.PI * 2,
        angle = 0,
        size = 5,
        life = 46,
        grav = 0.22,
        square = false,
        drag = 0.94,
      } = opts;
      const arr = particles.current;
      const room = Math.max(0, MAX_PARTICLES - arr.length);
      const n = Math.min(count, room);
      for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const sp = speed * (0.35 + Math.random() * 0.9);
        const lf = life * (0.6 + Math.random() * 0.7);
        arr.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: lf,
          max: lf,
          size: size * (0.5 + Math.random()),
          color: colors[(Math.random() * colors.length) | 0],
          spin: (Math.random() - 0.5) * 0.4,
          rot: Math.random() * Math.PI,
          drag,
          grav,
          square,
        });
      }
      ensureLoop();
    },
    [ensureLoop],
  );

  const burstLine = useCallback(
    (x1: number, y1: number, x2: number, y2: number, opts: BurstOpts = {}) => {
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        burst(x, y, { count: opts.count ?? 6, ...opts });
      }
    },
    [burst],
  );

  const shake = useCallback(
    (amplitude: number, duration = 380) => {
      shakeRef.current.amp = Math.max(shakeRef.current.amp, amplitude);
      shakeRef.current.decay = Math.pow(0.02, 1 / (duration / 16.667));
      ensureLoop();
    },
    [ensureLoop],
  );

  const float = useCallback(
    (x: number, y: number, text: string, color = "#a5f3fc", size = 30) => {
      const id = ++floatId.current;
      setFloats((f) => [...f, { id, x, y, text, color, size }]);
      window.setTimeout(() => setFloats((f) => f.filter((t) => t.id !== id)), 1100);
    },
    [],
  );

  const flash = useCallback((color: string) => {
    const id = ++floatId.current;
    setFlashState({ id, color });
    window.setTimeout(() => {
      setFlashState((s) => (s && s.id === id ? null : s));
    }, 520);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.ui();
  }, []);

  const api = useMemo<JuiceApi>(
    () => ({ burst, burstLine, shake, float, flash, muted, toggleMute }),
    [burst, burstLine, shake, float, flash, muted, toggleMute],
  );

  return (
    <JuiceCtx.Provider value={api}>
      <div ref={rootRef} className="app-shell" style={{ willChange: "transform" }}>
        {children}
      </div>

      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-40"
        aria-hidden="true"
      />

      <div className="pointer-events-none fixed inset-0 z-50">
        {floats.map((f) => (
          <span
            key={f.id}
            className="float-text"
            style={{
              left: f.x,
              top: f.y,
              color: f.color,
              fontSize: f.size,
              textShadow: `0 0 18px ${f.color}, 0 2px 0 rgba(0,0,0,.5)`,
            }}
          >
            {f.text}
          </span>
        ))}
      </div>

      {flashState && (
        <div
          key={flashState.id}
          className="screen-flash fixed z-[45]"
          style={{
            background: `radial-gradient(60% 60% at 50% 50%, ${flashState.color}, transparent 70%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
    </JuiceCtx.Provider>
  );
}
