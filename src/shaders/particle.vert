// src/shaders/particle.vert
precision highp float;
uniform sampler2D texturePosition;
uniform float pointSize;
varying vec3 vColor;

void main(){
  vec2 uv = uv;
  vec4 pos = texture2D(texturePosition, uv);
  vec3 worldPos = pos.xyz;
  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_PointSize = pointSize * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  vColor = vec3(1.0);
}