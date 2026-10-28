import * as THREE from 'three';
import { CarStyle } from './types';

export class Car {
  group: THREE.Group;
  wheels: THREE.Mesh[] = [];
  frontWheels: THREE.Group[] = [];
  headlights: THREE.PointLight[] = [];
  taillights: THREE.Mesh[] = [];
  nitroFlames: THREE.Mesh[] = [];
  brakeMat: THREE.MeshStandardMaterial;
  bodyMat: THREE.MeshStandardMaterial;

  speed = 0; // units/sec along forward
  steerAngle = 0; // radians
  health = 100;
  nitro = 100;
  nitroActive = false;
  wheelSpin = 0;

  private style: CarStyle;

  constructor(style: CarStyle) {
    this.style = style;
    this.group = new THREE.Group();

    const body = new THREE.MeshStandardMaterial({
      color: style.body,
      metalness: 0.88,
      roughness: 0.22,
      envMapIntensity: 1.2,
    });
    this.bodyMat = body;

    const accent = new THREE.MeshStandardMaterial({
      color: style.accent,
      metalness: 0.45,
      roughness: 0.55,
    });

    const glass = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      metalness: 0.7,
      roughness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    // --- Base lower chassis ---
    const lowerGeo = new THREE.BoxGeometry(1.85, 0.45, 4.4);
    const lower = new THREE.Mesh(lowerGeo, body);
    lower.position.y = 0.5;
    lower.castShadow = true;
    lower.receiveShadow = true;
    this.group.add(lower);

    // --- Cabin & Greenhouse (facing -Z forward) ---
    // Cabin centered slightly rearward for sports car proportions
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.48, 1.9);
    const cabin = new THREE.Mesh(cabinGeo, body);
    cabin.position.set(0, 0.94, 0.1);
    cabin.castShadow = true;
    this.group.add(cabin);

    const glassGeo = new THREE.BoxGeometry(1.42, 0.42, 1.76);
    const glassMesh = new THREE.Mesh(glassGeo, glass);
    glassMesh.position.set(0, 0.98, 0.1);
    this.group.add(glassMesh);

    // --- Hood / roof accent stripe ---
    const stripeGeo = new THREE.BoxGeometry(0.55, 0.05, 4.42);
    const stripe = new THREE.Mesh(stripeGeo, accent);
    stripe.position.set(0, 0.74, 0);
    this.group.add(stripe);

    // --- Front Bumper / Splitter (Front is at -Z) ---
    const bumperGeo = new THREE.BoxGeometry(1.8, 0.16, 0.3);
    const bumper = new THREE.Mesh(bumperGeo, accent);
    bumper.position.set(0, 0.32, -2.22);
    this.group.add(bumper);

    // --- Rear Diffuser & Exhaust (Rear is at +Z) ---
    const diffuserGeo = new THREE.BoxGeometry(1.75, 0.18, 0.25);
    const diffuser = new THREE.Mesh(diffuserGeo, accent);
    diffuser.position.set(0, 0.32, 2.2);
    this.group.add(diffuser);

    // Dual exhaust tips with nitro flame mesh
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
    [-0.45, 0.45].forEach((x) => {
      const tipGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12);
      const tip = new THREE.Mesh(tipGeo, exhaustMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, 0.38, 2.26);
      this.group.add(tip);

      const flameGeo = new THREE.ConeGeometry(0.12, 0.6, 8);
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(x, 0.38, 2.6);
      this.group.add(flame);
      this.nitroFlames.push(flame);
    });

    // --- Distinct Car Model Customization ---
    this.applyModelCustomization(style, body, accent);

    // --- Wheels ---
    // Front wheels at -1.45 (steerable), Rear wheels at +1.45 (driven)
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 18);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcfd3d8, metalness: 0.9, roughness: 0.3 });
    const positions: [number, number, number, boolean][] = [
      [-0.95, 0.42, -1.45, true],  // Front Left
      [0.95, 0.42, -1.45, true],   // Front Right
      [-0.95, 0.42, 1.45, false],  // Rear Left
      [0.95, 0.42, 1.45, false],   // Rear Right
    ];
    positions.forEach(([x, y, z, isFront]) => {
      const wg = new THREE.Group();
      wg.position.set(x, y, z);
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wg.add(tire);
      const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 8);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wg.add(rim);
      this.wheels.push(tire);
      this.group.add(wg);
      if (isFront) this.frontWheels.push(wg);
    });

    // --- Headlights (Front at -Z, shining forward towards -Z) ---
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xfff7e0,
      emissive: 0xfff1c0,
      emissiveIntensity: 1.8,
    });
    const hlGeo = new THREE.BoxGeometry(0.32, 0.14, 0.08);
    [-0.55, 0.55].forEach((x) => {
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(x, 0.55, -2.2);
      this.group.add(hl);
      const light = new THREE.PointLight(0xfff0c0, 0.7, 16, 2);
      light.position.set(x, 0.6, -2.5);
      this.group.add(light);
      this.headlights.push(light);
    });

    // --- Taillights & Brake Lights (Rear at +Z, facing the camera) ---
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0x440000,
      emissive: 0xff0808,
      emissiveIntensity: 0.7,
    });
    this.brakeMat = tlMat;
    const tlGeo = new THREE.BoxGeometry(0.42, 0.14, 0.08);
    [-0.55, 0.55].forEach((x) => {
      const tl = new THREE.Mesh(tlGeo, tlMat);
      tl.position.set(x, 0.6, 2.2);
      this.group.add(tl);
      this.taillights.push(tl);
    });
  }

  private applyModelCustomization(
    style: CarStyle,
    bodyMat: THREE.MeshStandardMaterial,
    accentMat: THREE.MeshStandardMaterial
  ): void {
    if (style.id === 'venom') {
      // Venom GT: High GT rear wing with dual angled uprights
      const standGeo = new THREE.BoxGeometry(0.07, 0.32, 0.12);
      [-0.65, 0.65].forEach((x) => {
        const stand = new THREE.Mesh(standGeo, accentMat);
        stand.position.set(x, 0.95, 1.95);
        this.group.add(stand);
      });
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 0.44), accentMat);
      wing.position.set(0, 1.12, 1.98);
      wing.castShadow = true;
      this.group.add(wing);

      // Front GT race canards
      const canardGeo = new THREE.BoxGeometry(0.2, 0.04, 0.3);
      [-0.95, 0.95].forEach((x) => {
        const canard = new THREE.Mesh(canardGeo, accentMat);
        canard.position.set(x, 0.42, -2.0);
        this.group.add(canard);
      });
    } else if (style.id === 'cyber') {
      // Cyber R8: Futuristic aerodynamic light-blade spoiler & roof fins
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.32), accentMat);
      blade.position.set(0, 0.94, 2.05);
      blade.castShadow = true;
      this.group.add(blade);

      // Cyan neon rear light bar
      const neonMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00e5ff,
        emissiveIntensity: 1.5,
      });
      const neonBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.05), neonMat);
      neonBar.position.set(0, 0.68, 2.21);
      this.group.add(neonBar);

      // Roof aero fin
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.9), accentMat);
      fin.position.set(0, 1.25, 0.2);
      this.group.add(fin);
    } else if (style.id === 'aurora') {
      // Aurora X: Sleek active-aero curved hypercar wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.05, 0.38), accentMat);
      wing.position.set(0, 0.96, 2.02);
      wing.rotation.x = -0.08;
      wing.castShadow = true;
      this.group.add(wing);

      // Wide aerodynamic side skirts
      const skirtGeo = new THREE.BoxGeometry(0.12, 0.08, 2.8);
      [-0.98, 0.98].forEach((x) => {
        const skirt = new THREE.Mesh(skirtGeo, accentMat);
        skirt.position.set(x, 0.32, 0);
        this.group.add(skirt);
      });
    } else {
      // Phantom S: Stealth track weapon with roof scoop and ducktail spoiler
      const ducktail = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 0.2), accentMat);
      ducktail.position.set(0, 0.88, 2.12);
      ducktail.rotation.x = 0.25;
      this.group.add(ducktail);

      // Roof air scoop
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.6), accentMat);
      scoop.position.set(0, 1.25, -0.2);
      this.group.add(scoop);
    }
  }

  get topSpeed(): number {
    return this.style.topSpeed;
  }
  get accel(): number {
    return this.style.accel;
  }
  get handling(): number {
    return this.style.handling;
  }

  setBrake(on: boolean): void {
    this.brakeMat.emissiveIntensity = on ? 2.2 : 0.7;
  }

  updateVisuals(dt: number, steeringInput: number): void {
    // Steer front wheels visually (front wheels steer in turn direction)
    const targetSteer = steeringInput * 0.45;
    this.frontWheels.forEach((w) => {
      w.rotation.y = THREE.MathUtils.lerp(w.rotation.y, targetSteer, 0.25);
    });

    // Spin all wheels according to forward speed
    // Speed is along -Z, wheel forward rotation
    const spin = (this.speed / 0.42) * dt;
    this.wheelSpin -= spin;
    this.wheels.forEach((w) => {
      w.rotation.x = this.wheelSpin;
    });

    // Nitro exhaust flame effect
    if (this.nitroActive && this.speed > 10) {
      const flicker = 0.75 + Math.random() * 0.5;
      this.nitroFlames.forEach((f) => {
        const m = f.material as THREE.MeshBasicMaterial;
        m.opacity = 0.9;
        f.scale.set(flicker, flicker * 1.3, flicker);
      });
    } else {
      this.nitroFlames.forEach((f) => {
        (f.material as THREE.MeshBasicMaterial).opacity = 0;
      });
    }
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else m.dispose();
      }
    });
  }
}
