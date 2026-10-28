import { Settings, QualityLevel, CameraMode } from '@/game/types';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/20"
          >
            CLOSE
          </button>
        </div>

        {/* Volume */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold">Sound Volume</span>
            <span className="tabular-nums text-gray-400">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.volume}
            onChange={(e) => update({ volume: parseFloat(e.target.value) })}
            className="w-full accent-red-500"
          />
        </div>

        {/* Quality */}
        <div className="mb-6">
          <div className="mb-2 text-sm font-semibold">Graphics Quality</div>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as QualityLevel[]).map((q) => (
              <button
                key={q}
                onClick={() => update({ quality: q })}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  settings.quality === q
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Camera */}
        <div className="mb-6">
          <div className="mb-2 text-sm font-semibold">Camera Mode</div>
          <div className="grid grid-cols-3 gap-2">
            {(['chase', 'hood', 'far'] as CameraMode[]).map((c) => (
              <button
                key={c}
                onClick={() => update({ camera: c })}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  settings.camera === c
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">Press C in-game to cycle cameras.</p>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 py-3 text-sm font-bold transition hover:scale-[1.02]"
        >
          DONE
        </button>
      </div>
    </div>
  );
}
