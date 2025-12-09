export function collidePlane(position, velocity, planeY = -2) {
  if (position.y < planeY) {
    position.y = planeY;
    velocity.y *= -0.6;
  }
}

export function collideSphere(position, velocity, center, radius) {
  const d = position.distanceTo(center);
  if (d < radius) {
    const n = position.clone().sub(center).normalize();
    position.copy(center.clone().add(n.multiplyScalar(radius)));
    velocity.reflect(n).multiplyScalar(0.7);
  }
}
