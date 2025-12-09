import * as THREE from "three";

export function isPinching(landmarks) {
  const thumb = landmarks[4];
  const index = landmarks[8];

  const d = dist2D(thumb, index);

  return d < 0.06;
}

export function isOpenPalm(landmarks) {
  const palm = landmarks[0];

  const tips = [8, 12, 16, 20]; // index, middle, ring, pinky
  let sum = 0;

  for (let i of tips) {
    sum += dist2D(landmarks[i], palm);
  }

  const avg = sum / tips.length;

  return avg > 0.20; // thresholds típicos
}