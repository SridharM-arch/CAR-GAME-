import * as THREE from 'three';
import { Car } from './Car';
import { CameraMode } from './types';

export class CameraController {
  camera: THREE.PerspectiveCamera;
  private mode: CameraMode = 'chase';
  private target = new THREE.Vector3();
  private desiredPos = new THREE.Vector3();

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1200);
    this.camera.position.set(0, 6, 12);
  }

  setMode(m: CameraMode): void {
    this.mode = m;
  }
  getMode(): CameraMode {
    return this.mode;
  }
  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(car: Car, dt: number, steerInput: number): void {
    const carPos = car.group.position;

    if (this.mode === 'chase') {
      this.desiredPos.set(
        carPos.x * 0.6 + steerInput * 0.8,
        4.4,
        11
      );
      this.target.set(carPos.x * 0.5, 1.4, -6);
      const lerp = 1 - Math.pow(0.001, dt);
      this.camera.position.lerp(this.desiredPos, lerp);
      this.camera.lookAt(this.target);
    } else if (this.mode === 'hood') {
      this.desiredPos.set(carPos.x * 0.7, 1.4, 1.5);
      this.camera.position.lerp(this.desiredPos, 0.5);
      this.target.set(carPos.x * 0.5, 1.2, -20);
      this.camera.lookAt(this.target);
    } else {
      this.desiredPos.set(carPos.x * 0.3, 9, 18);
      this.camera.position.lerp(this.desiredPos, 0.06);
      this.target.set(carPos.x, 1, -6);
      this.camera.lookAt(this.target);
    }
  }
}
