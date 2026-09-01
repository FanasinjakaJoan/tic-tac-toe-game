/** Tiny WebAudio synth — no assets, no latency, no dependencies. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.32;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

export function setMuted(v: boolean) {
  muted = v;
  if (master) master.gain.value = v ? 0 : 0.32;
}

export function isMuted() {
  return muted;
}

type ToneOpts = {
  freq: number;
  to?: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  delay?: number;
  sweep?: "exp" | "lin";
};

function tone({ freq, to, type = "sine", dur = 0.14, gain = 0.5, delay = 0 }: ToneOpts) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to && to !== freq) {
    if (to / freq > 0.4 && to / freq < 2.5) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    else osc.frequency.linearRampToValueAtTime(to, t0 + dur);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur = 0.18, gain = 0.28, delay = 0, hp = 800) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t0);
}

export const sfx = {
  ui() {
    tone({ freq: 520, to: 720, type: "triangle", dur: 0.07, gain: 0.28 });
  },
  hover() {
    tone({ freq: 880, type: "sine", dur: 0.04, gain: 0.09 });
  },
  place(mark: "X" | "O") {
    if (mark === "X") {
      tone({ freq: 380, to: 900, type: "square", dur: 0.11, gain: 0.24 });
      noise(0.09, 0.12, 0, 1400);
    } else {
      tone({ freq: 300, to: 190, type: "sawtooth", dur: 0.14, gain: 0.2 });
      tone({ freq: 600, to: 380, type: "sine", dur: 0.1, gain: 0.14, delay: 0.02 });
    }
  },
  invalid() {
    tone({ freq: 150, to: 90, type: "square", dur: 0.13, gain: 0.22 });
  },
  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.3, gain: 0.3, delay: i * 0.075 }),
    );
    tone({ freq: 130, to: 65, type: "sine", dur: 0.5, gain: 0.32, delay: 0.05 });
  },
  lose() {
    const notes = [392, 349.23, 293.66, 220];
    notes.forEach((f, i) =>
      tone({ freq: f, type: "sawtooth", dur: 0.3, gain: 0.22, delay: i * 0.1 }),
    );
    tone({ freq: 110, to: 55, type: "sine", dur: 0.6, gain: 0.3, delay: 0.16 });
  },
  draw() {
    tone({ freq: 440, type: "triangle", dur: 0.22, gain: 0.24 });
    tone({ freq: 415.3, type: "triangle", dur: 0.34, gain: 0.24, delay: 0.16 });
  },
  life() {
    tone({ freq: 220, to: 110, type: "square", dur: 0.24, gain: 0.26 });
    noise(0.3, 0.2, 0, 400);
  },
  start() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.24, gain: 0.26, delay: i * 0.06 }),
    );
  },
  tick() {
    tone({ freq: 1200, type: "sine", dur: 0.03, gain: 0.07 });
  },
};

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
