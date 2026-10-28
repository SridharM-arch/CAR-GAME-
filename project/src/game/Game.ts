import * as THREE from 'three';
import { Car } from './Car';
import { Road } from './Road';
import { Traffic } from './Traffic';
import { CameraController } from './Camera';
import { checkCollisions } from './Collision';
import { AudioManager } from './AudioManager';
import { ControlState } from './Controls';
import { CARS, CarStyle, GameStats, QualityLevel, Settings } from './types';

export interface GameCallbacks {
  onStats: (s: GameStats) => void;
  onGameOver: (score: number, distance: number, time: number) => void;
  onNitroState: (active: boolean, ready: boolean) => void;
  onCameraChange: (mode: string) => void;
}

export class Game {
  // km/h -> world units/sec (1 unit ~ 1 meter)
  private static readonly KMH_TO_UPS = 1 / 3.6;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  cameraCtrl: CameraController;
  car: Car;
  road: Road;
  traffic: Traffic;
  audio: AudioManager;

  private controls: ControlState;
  private settings: Settings;
  private callbacks: GameCallbacks;

  private clock = new THREE.Clock();
  private rafId = 0;
  private running = false;
  private paused = false;

  private distance = 0;
  private time = 0;
  private score = 0;
  private bestScore: number;
  private invuln = 0;
  private collisionCooldown = 0;
  private difficulty = 0;
  private statsTimer = 0;

  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;

  private resizeHandler: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    carStyle: CarStyle,
    controls: ControlState,
    settings: Settings,
    bestScore: number,
    callbacks: GameCallbacks
  ) {
    this.controls = controls;
    this.settings = settings;
    this.bestScore = bestScore;
    this.callbacks = callbacks;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.quality !== 'low',
      powerPreference: 'high-performance',
    });
    this.applyQuality(settings.quality);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9ec5ff);
    this.scene.fog = new THREE.Fog(0x9ec5ff, 80, 360);

    this.cameraCtrl = new CameraController(window.innerWidth / window.innerHeight);
    this.cameraCtrl.setMode(settings.camera);

    // Lighting
    this.hemi = new THREE.HemisphereLight(0xbfd4ff, 0x4a5560, 0.9);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.5);
    this.sun.position.set(60, 90, 40);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 250;
    this.sun.shadow.camera.left = -60;
    this.sun.shadow.camera.right = 60;
    this.sun.shadow.camera.top = 60;
    this.sun.shadow.camera.bottom = -60;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.applyQualityLighting(settings.quality);

    // Road
    this.road = new Road(settings.quality);
    this.scene.add(this.road.group);

    // Sky dome
    this.addSky();

    // Car
    this.car = new Car(carStyle);
    this.car.group.position.set(0, 0, 0);
    this.scene.add(this.car.group);

    // Traffic
    this.traffic = new Traffic();
    this.scene.add(this.traffic.group);

    // Audio
    this.audio = new AudioManager();
    this.audio.setVolume(settings.volume);

    this.resizeHandler = () => this.onResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  private addSky(): void {
    const geo = new THREE.SphereGeometry(600, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: new THREE.Color(0x2a6df4) },
        bottom: { value: new THREE.Color(0xcfe4ff) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom;
        void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(bottom, top, clamp(h,0.0,1.0)), 1.0); }`,
    });
    const sky = new THREE.Mesh(geo, mat);
    this.scene.add(sky);
  }

  private applyQuality(q: QualityLevel): void {
    const dpr = q === 'low' ? 0.7 : q === 'medium' ? 1 : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = q !== 'low';
    this.renderer.shadowMap.type = q === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  private applyQualityLighting(q: QualityLevel): void {
    if (q === 'low') {
      this.hemi.intensity = 1.1;
      this.sun.intensity = 1.2;
      this.sun.castShadow = false;
    } else if (q === 'medium') {
      this.hemi.intensity = 0.9;
      this.sun.intensity = 1.4;
    } else {
      this.hemi.intensity = 0.85;
      this.sun.intensity = 1.6;
    }
  }

  setSettings(s: Settings): void {
    this.settings = s;
    this.applyQuality(s.quality);
    this.applyQualityLighting(s.quality);
    this.cameraCtrl.setMode(s.camera);
    this.audio.setVolume(s.volume);
  }

  switchCamera(): void {
    const order = ['chase', 'hood', 'far'] as const;
    const idx = order.indexOf(this.cameraCtrl.getMode() as any);
    const next = order[(idx + 1) % order.length];
    this.cameraCtrl.setMode(next);
    this.callbacks.onCameraChange(next);
    this.audio.playBeep(520, 0.1, 0.2);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.clock.start();
    this.audio.startEngine();
    this.loop();
  }

  pause(): void {
    if (!this.running) return;
    this.paused = true;
    this.audio.stopEngine();
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.audio.startEngine();
    this.clock.getDelta(); // flush
  }

  private loop = () => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    if (this.paused) {
      this.renderer.render(this.scene, this.cameraCtrl.camera);
      return;
    }
    const dt = Math.min(0.05, this.clock.getDelta());
    this.update(dt);
    this.renderer.render(this.scene, this.cameraCtrl.camera);
  };

  private update(dt: number): void {
    const c = this.car;
    const ctrl = this.controls;

    // --- Difficulty ramps with distance ---
    this.difficulty = Math.min(10, (this.distance / 1000) * 0.12);
    this.traffic.setDifficulty(this.difficulty);

    // --- Nitro ---
    const nitroReady = c.nitro > 5;
    if (ctrl.nitro && nitroReady && c.nitro > 0) {
      c.nitroActive = true;
      c.nitro = Math.max(0, c.nitro - 30 * dt);
    } else {
      c.nitroActive = false;
      c.nitro = Math.min(100, c.nitro + 8 * dt);
    }

    // --- Acceleration ---
    const topSpeed = c.topSpeed * (c.nitroActive ? 1.35 : 1.0);
    const accel = c.accel * (c.nitroActive ? 1.8 : 1.0);
    if (ctrl.accelerate) {
      c.speed += accel * dt * Game.KMH_TO_UPS;
    } else if (ctrl.brake) {
      if (c.speed > 0) c.speed -= 55 * dt * Game.KMH_TO_UPS;
      else c.speed -= 22 * dt * Game.KMH_TO_UPS; // reverse
    } else {
      // engine braking / friction
      c.speed -= 12 * dt * Game.KMH_TO_UPS;
      if (c.speed < 0) c.speed = Math.min(0, c.speed + 12 * dt * Game.KMH_TO_UPS);
    }
    if (ctrl.handbrake) {
      c.speed -= 90 * dt * Game.KMH_TO_UPS;
    }
    c.speed = THREE.MathUtils.clamp(c.speed, -45 * Game.KMH_TO_UPS, topSpeed);

    // --- Steering: speed dependent, shifts car laterally ---
    const speedRatio = Math.min(1, Math.abs(c.speed) / (100 * Game.KMH_TO_UPS));
    const steerStrength = 9 * c.handling * (0.35 + 0.65 * speedRatio);
    let steerInput = 0;
    if (ctrl.left) steerInput -= 1;
    if (ctrl.right) steerInput += 1;
    const dir = c.speed >= 0 ? 1 : -1;
    c.group.position.x += steerInput * steerStrength * dt * dir;
    // Visual yaw lean (does not affect movement direction)
    const targetYaw = -steerInput * 0.18 * dir;
    c.group.rotation.y = THREE.MathUtils.lerp(c.group.rotation.y, targetYaw, 0.15);
    c.steerAngle = steerInput;

    // --- Movement model ---
    // Car stays near z=0. Forward motion = scrolling the world backward.
    this.road.scroll(c.speed * dt);
    this.traffic.update(dt, c.speed);

    // --- Sun target follows car ---
    this.sun.target.position.copy(c.group.position);
    this.sun.position.set(c.group.position.x + 60, 90, c.group.position.z + 40);

    // --- Collisions ---
    this.invuln = Math.max(0, this.invuln - dt);
    this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    const hit = checkCollisions(c, this.traffic, this.road, this.invuln);
    if (hit.hit && this.collisionCooldown <= 0) {
      this.invuln = 0.8;
      this.collisionCooldown = 0.4;
      c.health = Math.max(0, c.health - hit.intensity * 25);
      c.speed *= 0.45;
      this.audio.playCrash(hit.intensity);
      if (c.health <= 0) {
        this.endGame();
        return;
      }
    }

    // --- Stats: c.speed is in m/s (world units/sec) ---
    this.distance += Math.max(0, c.speed * dt); // meters
    this.time += dt;
    this.score = Math.floor(this.distance * 0.5 + this.time * 2);

    // brake lights
    c.setBrake(ctrl.brake || ctrl.handbrake);

    // wheel spin + steer visuals
    c.updateVisuals(dt, steerInput);

    // engine sound
    this.audio.setEngine(speedRatio, ctrl.accelerate);

    // camera
    this.cameraCtrl.update(c, dt, steerInput);

    // nitro UI callback (throttled)
    this.callbacks.onNitroState(c.nitroActive, c.nitro > 5);

    // throttle stats to ~10/s
    this.statsTimer -= dt;
    if (this.statsTimer <= 0) {
      this.statsTimer = 0.1;
      this.emitStats();
    }
  }

  private emitStats(): void {
    // c.speed in m/s; display km/h = *3.6. distance in meters -> /1000 km.
    this.callbacks.onStats({
      speed: Math.abs(this.car.speed) * 3.6,
      distance: this.distance / 1000,
      time: this.time,
      score: this.score,
      best: Math.max(this.bestScore, this.score),
      nitro: this.car.nitro,
      health: this.car.health,
    });
  }

  private endGame(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.audio.stopEngine();
    this.callbacks.onGameOver(this.score, this.distance / 1000, this.time);
  }

  // Manual stop (leaving screen)
  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resizeHandler);
    this.audio.stopEngine();
    this.car.dispose();
    this.traffic.dispose();
    this.renderer.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else m.dispose();
      }
    });
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.cameraCtrl.setAspect(w / h);
  }
}
