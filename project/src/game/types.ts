export type GamePhase = 'start' | 'select' | 'playing' | 'paused' | 'gameover';

export type CameraMode = 'chase' | 'hood' | 'far';

export type QualityLevel = 'low' | 'medium' | 'high';

export interface CarStyle {
  id: string;
  name: string;
  body: number;
  accent: number;
  topSpeed: number;
  accel: number;
  handling: number;
}

export interface Settings {
  volume: number;
  quality: QualityLevel;
  camera: CameraMode;
}

export interface GameStats {
  speed: number;
  distance: number;
  time: number;
  score: number;
  best: number;
  nitro: number;
  health: number;
}

export const CARS: CarStyle[] = [
  { id: 'venom', name: 'Venom GT', body: 0xe11d2a, accent: 0x141414, topSpeed: 320, accel: 38, handling: 1.05 },
  { id: 'cyber', name: 'Cyber R8', body: 0x1d4ed8, accent: 0x0b1220, topSpeed: 305, accel: 34, handling: 1.15 },
  { id: 'aurora', name: 'Aurora X', body: 0xf59e0b, accent: 0x1a1208, topSpeed: 295, accel: 40, handling: 1.25 },
  { id: 'phantom', name: 'Phantom S', body: 0x10b981, accent: 0x042019, topSpeed: 315, accel: 36, handling: 1.1 },
];

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.7,
  quality: 'high',
  camera: 'chase',
};
