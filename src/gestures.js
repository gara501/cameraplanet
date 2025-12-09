export function dist2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isPinching(lm) {
  return dist2D(lm[4], lm[8]) < 0.06;
}

export function isOpenPalm(lm) {
  const palm = lm[0];
  const tips = [8, 12, 16, 20];
  let sum = 0;
  for (let i of tips) sum += dist2D(lm[i], palm);
  return sum / tips.length > 0.20;
}

export function isFist(lm) {
  const palm = lm[0];
  const tips = [8, 12, 16, 20];
  let sum = 0;
  for (let i of tips) sum += dist2D(lm[i], palm);
  return sum / tips.length < 0.10;
}

let lastPos = null;
export function getSwipe(worldPos) {
  if (!lastPos) {
    lastPos = worldPos.clone();
    return new THREE.Vector3(0, 0, 0);
  }
  const v = worldPos.clone().sub(lastPos);
  lastPos.copy(worldPos);
  return v;
}

export function getHandScale(lm) {
  const d = dist2D(lm[5], lm[17]); // extremo-index → extremo meñique
  return d;
}
