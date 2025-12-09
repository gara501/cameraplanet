export class Fluid2D {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.density = new Float32Array(width * height);
    this.velocityX = new Float32Array(width * height);
    this.velocityY = new Float32Array(width * height);
  }

  index(x, y) {
    return x + y * this.width;
  }

  addDensity(x, y, amount) {
    const i = this.index(x, y);
    this.density[i] += amount;
  }

  addVelocity(x, y, amountX, amountY) {
    const i = this.index(x, y);
    this.velocityX[i] += amountX;
    this.velocityY[i] += amountY;
  }

  step() {
    const W = this.width;
    const H = this.height;

    for (let i = 0; i < W * H; i++) {
      this.density[i] *= 0.99;
    }

    const newDensity = new Float32Array(W * H);

    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = this.index(x, y);

        const vx = this.velocityX[i];
        const vy = this.velocityY[i];

        const prevX = Math.floor(x - vx);
        const prevY = Math.floor(y - vy);

        if (prevX >= 0 && prevX < W && prevY >= 0 && prevY < H) {
          newDensity[i] = this.density[this.index(prevX, prevY)];
        }
      }
    }

    this.density = newDensity;
  }
}
