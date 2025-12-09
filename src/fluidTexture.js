import * as THREE from "three";

export class FluidTexture {
  constructor(fluid) {
    this.fluid = fluid;
    const size = fluid.width * fluid.height * 4;

    this.data = new Uint8Array(size);
    
    for (let i = 0; i < size; i += 4) {
      this.data[i+3] = 255;
    }

    this.texture = new THREE.DataTexture(
      this.data,
      fluid.width,
      fluid.height,
      THREE.RGBAFormat
    );

    this.texture.needsUpdate = true;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
  }

  update() {
    const { density, width, height } = this.fluid;

    for (let i = 0; i < width * height; i++) {
      const d = Math.min(255, density[i] * 255);

      this.data[i * 4 + 0] = d;
      this.data[i * 4 + 1] = d;
      this.data[i * 4 + 2] = d;
      this.data[i * 4 + 3] = 255;
    }

    this.texture.needsUpdate = true;
  }
}