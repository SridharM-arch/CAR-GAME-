interface Props {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onSettings: () => void;
}

export default function PauseMenu({ onResume, onRestart, onMenu, onSettings }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center text-white shadow-2xl">
        <h2 className="mb-6 text-2xl font-bold">PAUSED</h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-sm font-bold transition hover:scale-[1.02]"
          >
            RESUME
          </button>
          <button
            onClick={onRestart}
            className="rounded-xl bg-white/10 py-3 text-sm font-semibold transition hover:bg-white/20"
          >
            RESTART
          </button>
          <button
            onClick={onSettings}
            className="rounded-xl bg-white/10 py-3 text-sm font-semibold transition hover:bg-white/20"
          >
            SETTINGS
          </button>
          <button
            onClick={onMenu}
            className="rounded-xl border border-white/20 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            QUIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}
