import { CARS, CarStyle } from '@/game/types';

interface Props {
  selected: CarStyle;
  onSelect: (c: CarStyle) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export default function CarSelect({ selected, onSelect, onBack, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black px-4 py-10">
      <h2 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        CHOOSE YOUR <span className="text-red-500">RIDE</span>
      </h2>
      <p className="mb-8 text-sm text-gray-400">Each car has unique speed, acceleration, and handling.</p>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CARS.map((car) => {
          const active = car.id === selected.id;
          return (
            <button
              key={car.id}
              onClick={() => onSelect(car)}
              className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                active
                  ? 'border-red-500 bg-red-500/10 shadow-[0_0_30px_-5px] shadow-red-500/50 scale-[1.03]'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              {/* Car preview swatch */}
              <div className="mb-4 flex h-24 items-center justify-center">
                <div
                  className="h-16 w-28 rounded-lg shadow-lg transition-transform group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, #${car.body
                      .toString(16)
                      .padStart(6, '0')}, #${car.accent.toString(16).padStart(6, '0')})`,
                    boxShadow: active
                      ? `0 10px 30px -5px #${car.body.toString(16).padStart(6, '0')}88`
                      : '0 6px 16px -4px rgba(0,0,0,0.6)',
                  }}
                />
              </div>
              <h3 className="text-lg font-bold text-white">{car.name}</h3>
              <div className="mt-3 space-y-2">
                <Stat label="TOP SPEED" value={car.topSpeed} max={340} color="bg-red-500" />
                <Stat label="ACCEL" value={car.accel} max={45} color="bg-amber-500" />
                <Stat label="HANDLING" value={car.handling} max={1.4} color="bg-emerald-500" />
              </div>
              {active && (
                <div className="absolute right-3 top-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  SELECTED
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95 cursor-pointer"
        >
          BACK
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-10 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/30 transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          START RACE
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] font-semibold text-gray-400">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
