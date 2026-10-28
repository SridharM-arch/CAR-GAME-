import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from '@/game/Game';
import { Car } from '@/game/Car';
import { ControlState, bindKeyboard, cameraModeCycle, createControlState } from '@/game/Controls';
import {
  CARS,
  CarStyle,
  GamePhase,
  GameStats,
  Settings,
} from '@/game/types';
import { loadBest, loadSettings, saveBest, saveSettings } from '@/game/storage';
import StartScreen from '@/components/StartScreen';
import CarSelect from '@/components/CarSelect';
import HUD from '@/components/HUD';
import TouchControls from '@/components/TouchControls';
import SettingsPanel from '@/components/Settings';
import PauseMenu from '@/components/PauseMenu';
import GameOver from '@/components/GameOver';

const INITIAL_STATS: GameStats = {
  speed: 0,
  distance: 0,
  time: 0,
  score: 0,
  best: 0,
  nitro: 100,
  health: 100,
};

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('start');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [bestScore, setBestScore] = useState<number>(() => loadBest());
  const [selectedCar, setSelectedCar] = useState<CarStyle>(CARS[0]);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [nitroActive, setNitroActive] = useState(false);
  const [nitroReady, setNitroReady] = useState(true);
  const [cameraMode, setCameraMode] = useState<string>(settings.camera);
  const [showSettings, setShowSettings] = useState(false);
  const [gameOverData, setGameOverData] = useState({ score: 0, distance: 0, time: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const controlsRef = useRef<ControlState>(createControlState());
  const phaseRef = useRef<GamePhase>('start');
  const settingsRef = useRef<Settings>(settings);
  const cameraRef = useRef<string>(settings.camera);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    cameraRef.current = cameraMode;
  }, [cameraMode]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
    if (gameRef.current) gameRef.current.setSettings(settings);
  }, [settings]);

  // Pause toggle
  const togglePause = useCallback(() => {
    setPhase((p) => {
      if (p === 'playing') {
        gameRef.current?.pause();
        return 'paused';
      }
      if (p === 'paused') {
        gameRef.current?.resume();
        return 'playing';
      }
      return p;
    });
  }, []);

  const switchCamera = useCallback(() => {
    const next = cameraModeCycle(cameraRef.current as any);
    cameraRef.current = next;
    setCameraMode(next);
    gameRef.current?.switchCamera();
  }, []);

  // Keyboard binding (lifecycle-bound; gating via active() check)
  useEffect(() => {
    const unbind = bindKeyboard(
      controlsRef.current,
      switchCamera,
      togglePause,
      () => phaseRef.current === 'playing' || phaseRef.current === 'paused'
    );
    return unbind;
  }, [switchCamera, togglePause]);

  // Start a new game
  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas not available yet');
      return;
    }
    // Tear down any existing game
    gameRef.current?.destroy();
    controlsRef.current = createControlState();

    const game = new Game(
      canvas,
      selectedCar,
      controlsRef.current,
      settingsRef.current,
      bestScore,
      {
        onStats: (s) => setStats(s),
        onGameOver: (score, distance, time) => {
          setGameOverData({ score, distance, time });
          setBestScore((prev) => {
            const next = Math.max(prev, score);
            saveBest(score);
            return next;
          });
          setPhase('gameover');
        },
        onNitroState: (active, ready) => {
          setNitroActive(active);
          setNitroReady(ready);
        },
        onCameraChange: (mode) => {
          cameraRef.current = mode;
          setCameraMode(mode);
        },
      }
    );
    gameRef.current = game;
    setStats({ ...INITIAL_STATS, best: bestScore });
    setCameraMode(settingsRef.current.camera);
    cameraRef.current = settingsRef.current.camera;
    setPhase('playing');
    // Start game directly (ensures Web Audio context unlocks inside user interaction event)
    game.start();
  }, [selectedCar, bestScore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, []);

  // Touch control bridge
  const setTouch = useCallback((control: string, value: boolean) => {
    const cs = controlsRef.current as any;
    if (control in cs) cs[control] = value;
  }, []);

  const restart = useCallback(() => {
    startGame();
  }, [startGame]);

  const quitToMenu = useCallback(() => {
    gameRef.current?.destroy();
    gameRef.current = null;
    setPhase('start');
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ display: 'block' }}
      />

      {phase === 'playing' && (
        <>
          <HUD
            stats={stats}
            nitroActive={nitroActive}
            nitroReady={nitroReady}
            cameraMode={cameraMode}
            onPause={togglePause}
            onCamera={switchCamera}
          />
          <TouchControls onSet={setTouch} onPause={togglePause} />
        </>
      )}

      {phase === 'paused' && (
        <>
          <HUD
            stats={stats}
            nitroActive={false}
            nitroReady={nitroReady}
            cameraMode={cameraMode}
            onPause={togglePause}
            onCamera={switchCamera}
          />
          <PauseMenu
            onResume={togglePause}
            onRestart={restart}
            onMenu={quitToMenu}
            onSettings={() => setShowSettings(true)}
          />
        </>
      )}

      {phase === 'start' && (
        <StartScreen
          onPlay={() => setPhase('select')}
          onSettings={() => setShowSettings(true)}
          bestScore={bestScore}
        />
      )}

      {phase === 'select' && (
        <CarSelect
          selected={selectedCar}
          onSelect={setSelectedCar}
          onBack={() => setPhase('start')}
          onConfirm={startGame}
        />
      )}

      {phase === 'gameover' && (
        <GameOver
          score={gameOverData.score}
          best={bestScore}
          distance={gameOverData.distance}
          time={gameOverData.time}
          onReplay={restart}
          onMenu={quitToMenu}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
