import * as THREE from 'three';
import { Car } from './Car';

interface TrafficVehicle {
  group: THREE.Group;
  speed: number; // units/sec
  lane: number;
  active: boolean;
  mat: THREE.MeshStandardMaterial;
  wheels: THREE.Mesh[];
}

const TRAFFIC_COLORS = [0x9aa3ad, 0xb0b6bd, 0x8b949e, 0xc0c6cc, 0x6b7280, 0x475569];
const LANE_X = [-4.5, -1.5, 1.5, 4.5];

export class Traffic {
  group: THREE.Group;
  private vehicles: TrafficVehicle[] = [];
  private spawnTimer = 0;
  private difficulty = 0;

  constructor() {
    this.group = new THREE.Group();
  }

  setDifficulty(d: number): void {
    this.difficulty = d;
  }

  private createVehicle(): TrafficVehicle {
    const group = new THREE.Group();
    const color = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.7,
      roughness: 0.4,
    });
    const bodyGeo = new THREE.BoxGeometry(1.7, 0.5, 4.0);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.45, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x111418, metalness: 0.4, roughness: 0.3 })
    );
    cabin.position.set(0, 0.95, 0.1);
    group.add(cabin);
    // taillights (facing +Z toward player following behind)
    const tl = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.12, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff0000, emissiveIntensity: 1 })
    );
    tl.position.set(0, 0.6, 2.05);
    group.add(tl);

    // headlights (facing -Z forward down the road)
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.12, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xfff0aa, emissive: 0xfff0aa, emissiveIntensity: 1.2 })
    );
    hl.position.set(0, 0.6, -2.05);
    group.add(hl);

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 10);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9 });
    const wheels: THREE.Mesh[] = [];
    ([-0.85, 0.85] as const).forEach((x) => {
      ([1.3, -1.3] as const).forEach((z) => {
        const w = new THREE.Mesh(wheelGeo, tireMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.38, z);
        w.castShadow = true;
        group.add(w);
        wheels.push(w);
      });
    });

    this.group.add(group);
    return { group, speed: 0, lane: 0, active: false, mat, wheels };
  }

  private spawn(playerSpeed: number): void {
    let v = this.vehicles.find((x) => !x.active);
    if (!v) {
      v = this.createVehicle();
      this.vehicles.push(v);
    }
    v.active = true;
    v.lane = Math.floor(Math.random() * LANE_X.length);
    // Some oncoming traffic in leftmost lane (slower relative speed)
    const oncoming = v.lane === 0 && Math.random() < 0.4;
    v.group.position.set(LANE_X[v.lane], 0, -220);
    v.group.rotation.y = oncoming ? Math.PI : 0;
    // speeds in m/s (~ km/h / 3.6)
    v.speed = oncoming
      ? -(11 + Math.random() * 8 + this.difficulty * 1.5)
      : 17 + Math.random() * 14 + this.difficulty * 2.2;
    v.group.visible = true;
  }

  update(dt: number, playerSpeed: number): void {
    this.spawnTimer -= dt;
    const spawnInterval = Math.max(0.45, 1.6 - this.difficulty * 0.12);
    if (this.spawnTimer <= 0) {
      this.spawn(playerSpeed);
      this.spawnTimer = spawnInterval;
    }

    for (const v of this.vehicles) {
      if (!v.active) continue;
      // Relative motion: world scrolls toward camera at playerSpeed.
      // Oncoming (negative v.speed) moves toward camera faster.
      const worldZ = v.group.position.z + (playerSpeed - v.speed) * dt;
      v.group.position.z = worldZ;

      // spin wheels
      const spin = (v.speed / 0.38) * dt;
      v.wheels.forEach((w) => (w.rotation.x += spin));

      if (worldZ > 30) {
        v.active = false;
        v.group.visible = false;
      }
    }
  }

  // Returns active vehicles for collision checks
  activeVehicles(): { x: number; z: number; halfW: number; halfL: number }[] {
    return this.vehicles
      .filter((v) => v.active)
      .map((v) => ({
        x: v.group.position.x,
        z: v.group.position.z,
        halfW: 0.95,
        halfL: 2.1,
      }));
  }

  reset(): void {
    this.vehicles.forEach((v) => {
      v.active = false;
      v.group.visible = false;
    });
    this.spawnTimer = 0;
    this.difficulty = 0;
  }

  dispose(): void {
    this.vehicles.forEach((v) => {
      v.group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
    });
  }
}
