import { Car } from './Car';
import { Road } from './Road';
import { Traffic } from './Traffic';

export interface CollisionResult {
  hit: boolean;
  intensity: number;
}

// AABB overlap test between player car and traffic vehicles.
// Adds a small cooldown-aware separation so we don't fire every frame.
export function checkCollisions(
  car: Car,
  traffic: Traffic,
  road: Road,
  invulnTimer: number
): CollisionResult {
  if (invulnTimer > 0) return { hit: false, intensity: 0 };

  const px = car.group.position.x;
  const pz = car.group.position.z;
  const pHalfW = 0.95;
  const pHalfL = 2.2;

  for (const v of traffic.activeVehicles()) {
    const dx = Math.abs(px - v.x);
    const dz = Math.abs(pz - v.z);
    if (dx < pHalfW + v.halfW - 0.15 && dz < pHalfL + v.halfL - 0.2) {
      const relSpeed = Math.abs(car.speed) / 120;
      const intensity = Math.min(1, 0.4 + relSpeed);
      // Push player out of the traffic car along the smaller overlap axis
      const overlapX = pHalfW + v.halfW - 0.15 - dx;
      const overlapZ = pHalfL + v.halfL - 0.2 - dz;
      if (overlapX < overlapZ) {
        car.group.position.x += px > v.x ? overlapX : -overlapX;
      } else {
        // shove player backward
        car.group.position.z += pz > v.z ? overlapZ * 0.5 : -overlapZ * 0.5;
      }
      return { hit: true, intensity };
    }
  }

  // Road boundaries
  const limit = road.halfWidth - 1.1;
  if (Math.abs(px) > limit) {
    car.group.position.x = Math.sign(px) * limit;
    return { hit: true, intensity: 0.4 };
  }

  return { hit: false, intensity: 0 };
}
