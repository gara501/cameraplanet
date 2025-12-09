import * as THREE from "three";

export class Smoke {
  constructor(renderer, size = 256) {
    this.renderer = renderer;
    this.size = size;

    // Render targets dobles (ping-pong)
    this.rtA = new THREE.WebGLRenderTarget(size, size, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    this.rtB = this.rtA.clone();

    // Quad para renderizar a pantalla/RT
    const geo = new THREE.PlaneGeometry(2, 2);

    // Material de simulación
    this.simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uDelta: { value: 0.016 },
        uDissipation: { value: 0.99 },
        uForcePos: { value: new THREE.Vector2(-10, -10) },
        uForce: { value: 0.0 },
      },
      fragmentShader: `
        precision highp float;

        uniform sampler2D uTexture;
        uniform float uDelta;
        uniform float uDissipation;
        uniform vec2 uForcePos;
        uniform float uForce;

        void main() {
          vec2 uv = gl_FragCoord.xy / vec2(${size}.0, ${size}.0);

          // === Advección simple (lee la textura anterior sin mover) ===
          float density = texture2D(uTexture, uv).r;

          // === Fuerza desde la mano ===
          float d = distance(uv, uForcePos);
          float influence = exp(-d * 80.0) * uForce;

          density += influence;

          // === Disipación ===
          density *= uDissipation;

          gl_FragColor = vec4(density, density, density, 1.0);
        }
      `
    });

    // Material para dibujar el humo en la escena
    this.renderMaterial = new THREE.MeshBasicMaterial({
      map: this.rtA.texture,
      transparent: true,
      opacity: 0.7,
    });

    this.mesh = new THREE.Mesh(geo, this.renderMaterial);
    this.mesh.scale.set(6, 6, 1); // tamaño del humo en escena
    this.mesh.position.z = -1;    // detrás de las partículas
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }

  /**
   * Actualiza la simulación.
   * @param {number} dt – deltaTime
   * @param {THREE.Vector3|null} hand – posición de la mano en espacio 3D
   * @param {THREE.Vector3} swipe – movimiento de la mano (vector)
   */
  update(dt, hand, swipe) {
    const force = swipe.length() * 2.3; // intensidad
    let uvPos = new THREE.Vector2(-10, -10);

    if (hand) {
      // Convertir la posición 3D a UV para la textura del humo
      // Suponemos que el humo está en un plano centrado
      uvPos.x = (hand.x / 3.0) * 0.5 + 0.5;
      uvPos.y = (hand.y / 3.0) * 0.5 + 0.5;
    }

    // Configurar shader
    this.simMaterial.uniforms.uTexture.value = this.rtA.texture;
    this.simMaterial.uniforms.uDelta.value = dt;
    this.simMaterial.uniforms.uForcePos.value = uvPos;
    this.simMaterial.uniforms.uForce.value = force;

    // Render → rtB
    this.renderer.setRenderTarget(this.rtB);
    this.renderer.render(new THREE.Mesh(
      new THREE.PlaneGeometry(2,2),
      this.simMaterial
    ), new THREE.Camera());

    this.renderer.setRenderTarget(null);

    // Intercambiar A ↔ B
    let tmp = this.rtA;
    this.rtA = this.rtB;
    this.rtB = tmp;

    // Actualizar textura del humo visible
    this.renderMaterial.map = this.rtA.texture;
  }
}
