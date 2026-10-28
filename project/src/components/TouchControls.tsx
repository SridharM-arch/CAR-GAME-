interface Props {
  onSet: (control: string, value: boolean) => void;
  onPause: () => void;
}

interface Btn {
  id: string;
  label: string;
  className: string;
}

const leftBtns: Btn[] = [
  { id: 'left', label: '◀', className: 'col-span-1' },
  { id: 'right', label: '▶', className: 'col-span-1' },
];

export default function TouchControls({ onSet, onPause }: Props) {
  const press = (id: string, value: boolean) => {
    onSet(id, value);
  };

  const handler = (id: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      press(id, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      press(id, false);
    },
    onPointerCancel: () => press(id, false),
    onPointerLeave: () => press(id, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-30 md:hidden">
      {/* Left side: steering */}
      <div className="pointer-events-auto absolute bottom-6 left-4 grid grid-cols-2 gap-3">
        {leftBtns.map((b) => (
          <button
            key={b.id}
            {...handler(b.id)}
            className="flex h-20 w-20 touch-none items-center justify-center rounded-full bg-white/15 text-3xl font-bold text-white backdrop-blur-md active:bg-white/30"
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Right side: pedals + nitro */}
      <div className="pointer-events-auto absolute bottom-6 right-4 flex items-end gap-3">
        <button
          {...handler('brake')}
          className="flex h-20 w-20 touch-none items-center justify-center rounded-full bg-red-600/60 text-xs font-bold text-white backdrop-blur-md active:bg-red-500"
        >
          BRAKE
        </button>
        <button
          {...handler('accelerate')}
          className="flex h-24 w-24 touch-none items-center justify-center rounded-full bg-emerald-500/70 text-xs font-bold text-white backdrop-blur-md active:bg-emerald-400"
        >
          GAS
        </button>
        <div className="flex flex-col gap-2">
          <button
            {...handler('nitro')}
            className="flex h-16 w-16 touch-none items-center justify-center rounded-full bg-cyan-500/70 text-[10px] font-bold text-white backdrop-blur-md active:bg-cyan-400"
          >
            NITRO
          </button>
          <button
            onClick={onPause}
            className="flex h-12 w-16 touch-none items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white backdrop-blur-md active:bg-black/70"
          >
            PAUSE
          </button>
        </div>
      </div>
    </div>
  );
}
