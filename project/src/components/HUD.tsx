import { GameStats } from '@/game/types';

interface Props {
  stats: GameStats;
  nitroActive: boolean;
  nitroReady: boolean;
  cameraMode: string;
  onPause: () => void;
  onCamera: () => void;
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HUD({ stats, nitroActive, nitroReady, cameraMode, onPause, onCamera }: Props) {
  const speed = Math.round(stats.speed);
  const maxSpeed = 340;
  const speedPct = Math.min(1, speed / maxSpeed);
  // speedometer arc: -135deg to +135deg (270 sweep)
  const angle = -135 + speedPct * 270;
  const nitroPct = Math.min(1, stats.nitro / 100);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      {/* Top-left stats */}
      <div className="absolute left-4 top-4 flex flex-col gap-1 rounded-lg bg-black/45 px-4 py-3 text-white backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-amber-400">SCORE</span>
          <span className="tabular-nums">{stats.score.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span>BEST</span>
          <span className="tabular-nums">{stats.best.toLocaleString()}</span>
        </div>
        <div className="text-xs text-gray-300">
          DIST <span className="tabular-nums">{stats.distance.toFixed(2)} km</span>
        </div>
        <div className="text-xs text-gray-300">
          TIME <span className="tabular-nums">{formatTime(stats.time)}</span>
        </div>
      </div>

      {/* Top-right buttons */}
      <div className="pointer-events-auto absolute right-4 top-4 flex gap-2">
        <button
          onClick={onCamera}
          className="rounded-lg bg-black/50 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          CAM: {cameraMode.toUpperCase()}
        </button>
        <button
          onClick={onPause}
          className="rounded-lg bg-red-600/80 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-red-500"
        >
          PAUSE
        </button>
      </div>

      {/* Health bar */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-lg bg-black/45 px-3 py-2 text-white backdrop-blur-sm">
          <span className="text-xs font-semibold text-red-400">HP</span>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-emerald-400 transition-all"
              style={{ width: `${stats.health}%` }}
            />
          </div>
        </div>
      </div>

      {/* Speedometer bottom-right */}
      <div className="absolute bottom-5 right-5">
        <div className="relative h-40 w-40 rounded-full bg-black/55 backdrop-blur-md">
          {/* tick ring */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (-135 + (i / 11) * 270) * (Math.PI / 180);
              const x1 = 80 + Math.cos(a) * 60;
              const y1 = 80 + Math.sin(a) * 60;
              const x2 = 80 + Math.cos(a) * 68;
              const y2 = 80 + Math.sin(a) * 68;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="2"
                />
              );
            })}
            {/* progress arc */}
            <line
              x1="80"
              y1="80"
              x2={80 + Math.cos((angle * Math.PI) / 180) * 64}
              y2={80 + Math.sin((angle * Math.PI) / 180) * 64}
              stroke={speed > 250 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
            <span className="text-4xl font-bold tabular-nums text-white">{speed}</span>
            <span className="text-xs font-medium text-gray-300">km/h</span>
          </div>
        </div>
      </div>

      {/* Nitro bar bottom-left */}
      <div className="absolute bottom-6 left-5 w-44">
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white">
          <span className={nitroActive ? 'text-cyan-300' : 'text-cyan-400'}>NITRO</span>
          <span className={nitroReady ? 'text-cyan-300' : 'text-gray-400'}>
            {nitroReady ? 'READY' : '...'}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-black/50">
          <div
            className={`h-full rounded-full transition-all ${
              nitroActive
                ? 'bg-gradient-to-r from-cyan-300 to-blue-500'
                : 'bg-gradient-to-r from-blue-500 to-cyan-400'
            }`}
            style={{ width: `${nitroPct * 100}%` }}
          />
        </div>
      </div>

      {/* Nitro active vignette */}
      {nitroActive && (
        <div className="pointer-events-none absolute inset-0 ring-8 ring-inset ring-cyan-400/30 animate-pulse" />
      )}
    </div>
  );
}
