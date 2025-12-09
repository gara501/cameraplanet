import * as THREE from "three";

export class ParticlesCPU {
  constructor(scene, count = 6000) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.positions[3*i] = (Math.random()-0.5)*6;
      this.positions[3*i+1] = (Math.random()-0.5)*4;
      this.positions[3*i+2] = (Math.random()-0.5)*2;
    }

    this.geom = new THREE.BufferGeometry();
    this.geom.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));

    this.mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.03,
    });

    this.points = new THREE.Points(this.geom, this.mat);
    scene.add(this.points);
  }

  update(dt, hand, gestures, swipeVector) {
    const pos = this.positions;
    const vel = this.velocities;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;

      let px = pos[idx];
      let py = pos[idx+1];
      let pz = pos[idx+2];

      // INTERACCIONES
      if (hand) {
        const dx = hand.x - px;
        const dy = hand.y - py;
        const dz = hand.z - pz;

        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const radius = 1.7;

        // ATRAER (PINCH = más fuerte)
        if (dist < radius) {
          let force = (1 - dist / radius) * 9;

          if (gestures.pinch) force *= 3;

          vel[idx]   += dx * force * dt;
          vel[idx+1] += dy * force * dt;
          vel[idx+2] += dz * force * dt;
        }

        // EMPUJAR (OPEN PALM)
        if (gestures.open) {
          vel[idx]   -= dx * 10 * dt;
          vel[idx+1] -= dy * 10 * dt;
        }

        // SWIPE VELOCITY
        vel[idx]   += swipeVector.x * 9 * dt;
        vel[idx+1] += swipeVector.y * 9 * dt;
      }

      // Integración
      pos[idx]   += vel[idx] * dt;
      pos[idx+1] += vel[idx+1] * dt;
      pos[idx+2] += vel[idx+2] * dt;

      // Amortiguación
      vel[idx] *= 0.94;
      vel[idx+1] *= 0.94;
      vel[idx+2] *= 0.94;
    }

    this.geom.attributes.position.needsUpdate = true;
  }
}
