// src/shaders/position.frag
precision highp float;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform float delta;

void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 posTex = texture2D(texturePosition, uv);
  vec4 velTex = texture2D(textureVelocity, uv);
  vec3 pos = posTex.xyz;
  vec3 vel = velTex.xyz;

  pos += vel * delta;

  // bounds respawn
  if (length(pos) > 30.0){
    pos = vec3((fract(sin(dot(uv, vec2(12.9898,78.233))) * 43758.5453)-0.5)*6.0,
               (fract(sin(dot(uv, vec2(93.9898,67.345))) * 12741.4563)-0.5)*4.0,
               (fract(sin(dot(uv, vec2(45.345,21.345))) * 31415.9265)-0.5)*2.0);
  }

  gl_FragColor = vec4(pos, 1.0);
}
