import { DEFAULT_SETTINGS, Settings } from './types';

const KEY_SETTINGS = 'rc_settings';
const KEY_BEST = 'rc_best';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      volume: clamp(parsed.volume ?? DEFAULT_SETTINGS.volume, 0, 1),
      quality: parsed.quality ?? DEFAULT_SETTINGS.quality,
      camera: parsed.camera ?? DEFAULT_SETTINGS.camera,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function loadBest(): number {
  try {
    const raw = localStorage.getItem(KEY_BEST);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function saveBest(score: number): void {
  try {
    const cur = loadBest();
    if (score > cur) localStorage.setItem(KEY_BEST, String(Math.floor(score)));
  } catch {
    /* ignore */
  }
}

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}
