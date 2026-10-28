interface Props {
  score: number;
  best: number;
  distance: number;
  time: number;
  onReplay: () => void;
  onMenu: () => void;
}

function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GameOver({ score, best, distance, time, onReplay, onMenu }: Props) {
  const isRecord = score >= best && score > 0;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center text-white shadow-2xl">
        <h2 className="text-3xl font-extrabold tracking-tight">
          {isRecord ? <span className="text-amber-400">NEW RECORD!</span> : <span className="text-red-500">CRASHED</span>}
        </h2>
        <p className="mt-1 text-sm text-gray-400">Your car couldn't take any more damage.</p>

        <div className="my-6 grid grid-cols-2 gap-4">
          <Stat label="SCORE" value={score.toLocaleString()} accent />
          <Stat label="BEST" value={best.toLocaleString()} />
          <Stat label="DISTANCE" value={`${distance.toFixed(2)} km`} />
          <Stat label="TIME" value={fmtTime(time)} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onMenu}
            className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            MENU
          </button>
          <button
            onClick={onReplay}
            className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 py-3 text-sm font-bold shadow-lg shadow-red-500/30 transition hover:scale-[1.03]"
          >
            REPLAY
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 p-4">
      <div className="text-[10px] font-semibold tracking-wider text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${accent ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
