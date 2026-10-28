import { CameraMode } from './types';

export type ControlState = {
  accelerate: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  nitro: boolean;
  handbrake: boolean;
};

export function createControlState(): ControlState {
  return {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
    nitro: false,
    handbrake: false,
  };
}

const isTypingTarget = (e: KeyboardEvent): boolean => {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || t.isContentEditable === true;
};

export function bindKeyboard(
  state: ControlState,
  onCameraSwitch: () => void,
  onPauseToggle: () => void,
  active: () => boolean
): () => void {
  const map: Record<string, keyof ControlState> = {
    KeyW: 'accelerate',
    ArrowUp: 'accelerate',
    KeyS: 'brake',
    ArrowDown: 'brake',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    ShiftLeft: 'nitro',
    ShiftRight: 'nitro',
    Space: 'handbrake',
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isTypingTarget(e)) return;
    if (!active()) {
      if (e.code === 'Escape' || e.code === 'KeyP') onPauseToggle();
      return;
    }
    if (e.code === 'KeyC') {
      e.preventDefault();
      onCameraSwitch();
      return;
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      onPauseToggle();
      return;
    }
    const k = map[e.code];
    if (k) {
      e.preventDefault();
      state[k] = true;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (isTypingTarget(e)) return;
    const k = map[e.code];
    if (k) {
      e.preventDefault();
      state[k] = false;
    }
  };

  const onBlur = () => {
    state.accelerate = state.brake = state.left = state.right = state.nitro = state.handbrake = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };
}

export function cameraModeCycle(m: CameraMode): CameraMode {
  if (m === 'chase') return 'hood';
  if (m === 'hood') return 'far';
  return 'chase';
}
