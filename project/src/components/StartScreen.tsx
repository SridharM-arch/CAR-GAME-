import { useEffect, useState } from 'react';

interface Props {
  onPlay: () => void;
  onSettings: () => void;
  bestScore: number;
}

export default function StartScreen({ onPlay, onSettings, bestScore }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  // Animated road lines
  const lines = Array.from({ length: 14 });

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
      {/* Animated speed lines background */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgba(239,68,68,0.4), transparent)',
          }}
        />
        {lines.map((_, i) => {
          const offset = ((tick * 6 + i * 60) % 800) - 100;
          return (
            <div
              key={i}
              className="absolute left-1/2 h-12 w-1.5 -translate-x-1/2 rounded-full bg-amber-400/60"
              style={{ top: `${offset}px` }}
            />
          );
        })}
      </div>

      {/* Radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/20 blur-[120px]" />

      <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="mb-2 text-sm font-semibold tracking-[0.3em] text-red-500">ARCADE RACING</div>
        <h1 className="text-5xl font-black tracking-tighter text-white sm:text-7xl lg:text-8xl">
          VELOCITY
          <span className="block bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 bg-clip-text text-transparent">
            UNCHAINED
          </span>
        </h1>
        <p className="mt-4 max-w-md text-sm text-gray-400 sm:text-base">
          Dodge traffic, chase the horizon, and push your machine to the limit. How far can you go?
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={onPlay}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 px-16 py-4 text-lg font-bold text-white shadow-xl shadow-red-500/30 transition hover:scale-105"
          >
            <span className="relative z-10">PLAY</span>
            <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
          </button>
          <button
            onClick={onSettings}
            className="rounded-xl border border-white/20 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            SETTINGS
          </button>
        </div>

        <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-gray-500">
          BEST SCORE: <span className="font-bold text-amber-400">{bestScore.toLocaleString()}</span>
          <span className="mx-3">|</span>
          <span className="hidden sm:inline">WASD / Arrows to drive · Shift for Nitro · C camera · P pause</span>
          <span className="sm:hidden">Touch controls enabled</span>
        </div>
      </div>
    </div>
  );
}
