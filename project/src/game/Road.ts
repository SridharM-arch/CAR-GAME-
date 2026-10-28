import * as THREE from 'three';
import { QualityLevel } from './types';

const SEGMENT_LENGTH = 40;
const ROAD_WIDTH = 14; // drivable width
const SEGMENTS = 12; // visible ahead

export class Road {
  group: THREE.Group;
  private segments: THREE.Group[] = [];
  private centerStripes: THREE.Mesh[] = [];
  private sideBarriers: THREE.Mesh[] = [];
  private trees: THREE.Object3D[] = [];
  private buildings: THREE.Object3D[] = [];

  private stripeMat: THREE.MeshBasicMaterial;
  private asphaltMat: THREE.MeshStandardMaterial;
  private sidewalkMat: THREE.MeshStandardMaterial;
  private barrierMat: THREE.MeshStandardMaterial;

  constructor(quality: QualityLevel) {
    this.group = new THREE.Group();

    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1c1f24,
      roughness: 0.95,
      metalness: 0.0,
    });
    this.stripeMat = new THREE.MeshBasicMaterial({ color: 0xf5d020 });
    this.sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f47,
      roughness: 0.9,
    });
    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0xd23b2e,
      roughness: 0.6,
      metalness: 0.2,
    });

    for (let i = 0; i < SEGMENTS; i++) {
      const seg = this.buildSegment(i);
      seg.position.z = -i * SEGMENT_LENGTH;
      this.group.add(seg);
      this.segments.push(seg);
    }

    // Scenery scatter (static, far from road)
    this.scatterScenery(quality);
  }

  private buildSegment(index: number): THREE.Group {
    const seg = new THREE.Group();

    // Asphalt
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH),
      this.asphaltMat
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = -SEGMENT_LENGTH / 2;
    road.receiveShadow = true;
    seg.add(road);

    // Sidewalks
    for (const side of [-1, 1]) {
      const sw = new THREE.Mesh(
        new THREE.PlaneGeometry(3, SEGMENT_LENGTH),
        this.sidewalkMat
      );
      sw.rotation.x = -Math.PI / 2;
      sw.position.set(side * (ROAD_WIDTH / 2 + 1.5), 0.05, -SEGMENT_LENGTH / 2);
      sw.receiveShadow = true;
      seg.add(sw);

      // Barrier
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.7, SEGMENT_LENGTH),
        this.barrierMat
      );
      barrier.position.set(side * (ROAD_WIDTH / 2 + 3.1), 0.35, -SEGMENT_LENGTH / 2);
      barrier.castShadow = true;
      seg.add(barrier);
    }

    // Center dashed stripes
    const stripeCount = 8;
    const stripeSpacing = SEGMENT_LENGTH / stripeCount;
    for (let s = 0; s < stripeCount; s++) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 2.2),
        this.stripeMat
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.02, -s * stripeSpacing - stripeSpacing / 2 + SEGMENT_LENGTH);
      seg.add(stripe);
      this.centerStripes.push(stripe);
    }

    // Lane divider stripes (two lanes)
    for (const x of [-ROAD_WIDTH / 6, ROAD_WIDTH / 6]) {
      for (let s = 0; s < stripeCount; s++) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(0.18, 1.6),
          this.stripeMat
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x, 0.02, -s * stripeSpacing - stripeSpacing / 2 + SEGMENT_LENGTH);
        seg.add(stripe);
      }
    }

    return seg;
  }

  private scatterScenery(quality: QualityLevel): void {
    const treeCount = quality === 'low' ? 24 : quality === 'medium' ? 40 : 60;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4b2e1a, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6b2f, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.4, 6);
    const leafGeo = new THREE.ConeGeometry(1.7, 3.2, 7);

    for (let i = 0; i < treeCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -((i * 17) % (SEGMENTS * SEGMENT_LENGTH)) - Math.random() * 10;
      const x = side * (ROAD_WIDTH / 2 + 6 + Math.random() * 14);
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.2;
      trunk.castShadow = true;
      tree.add(trunk);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 3.4;
      leaf.castShadow = true;
      tree.add(leaf);
      const scale = 0.8 + Math.random() * 0.7;
      tree.scale.setScalar(scale);
      tree.position.set(x, 0, z);
      this.group.add(tree);
      this.trees.push(tree);
    }

    // Distant buildings
    const buildingCount = quality === 'low' ? 14 : 28;
    const bMatA = new THREE.MeshStandardMaterial({ color: 0x4a5563, roughness: 0.8 });
    const bMatB = new THREE.MeshStandardMaterial({ color: 0x2c3540, roughness: 0.85 });
    for (let i = 0; i < buildingCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -((i * 31) % (SEGMENTS * SEGMENT_LENGTH)) - Math.random() * 15;
      const x = side * (ROAD_WIDTH / 2 + 22 + Math.random() * 18);
      const h = 6 + Math.random() * 26;
      const w = 4 + Math.random() * 6;
      const d = 4 + Math.random() * 6;
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        i % 2 === 0 ? bMatA : bMatB
      );
      b.position.set(x, h / 2, z);
      b.castShadow = true;
      this.group.add(b);
      this.buildings.push(b);
    }
  }

  // Scroll the world toward the camera by `delta` units (positive = moving forward).
  // We recycle segments that pass behind the camera back to the front.
  scroll(delta: number): void {
    this.segments.forEach((seg) => {
      seg.position.z += delta;
      if (seg.position.z > SEGMENT_LENGTH) {
        seg.position.z -= SEGMENTS * SEGMENT_LENGTH;
      }
    });
    this.trees.forEach((t) => {
      t.position.z += delta;
      if (t.position.z > 10) {
        t.position.z -= SEGMENTS * SEGMENT_LENGTH;
        t.position.x = (Math.random() > 0.5 ? 1 : -1) * (ROAD_WIDTH / 2 + 6 + Math.random() * 14);
      }
    });
    this.buildings.forEach((b) => {
      (b as THREE.Object3D).position.z += delta;
      if ((b as THREE.Object3D).position.z > 20) {
        (b as THREE.Object3D).position.z -= SEGMENTS * SEGMENT_LENGTH;
      }
    });
  }

  get halfWidth(): number {
    return ROAD_WIDTH / 2;
  }
}
