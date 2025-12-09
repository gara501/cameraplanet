// src/shaders/velocity.frag
precision highp float;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform float time;
uniform float delta;
uniform vec3 handPos;
uniform int handActive;
uniform float pinch;
uniform vec3 swipe;
uniform float floorY;

// simple hash noise (value noise)
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x * p.y); }
float noise(vec3 x){
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  float n = mix(mix(mix(hash(p.xy+vec2(0.0,0.0)), hash(p.xy+vec2(1.0,0.0)), f.x),
                    mix(hash(p.xy+vec2(0.0,1.0)), hash(p.xy+vec2(1.0,1.0)), f.x), f.y);
  return n;
}

// curl noise approx (finite differences)
vec3 curlNoise(vec3 p){
  float e = 0.1;
  float n1 = noise(p + vec3(e, 0.0, 0.0));
  float n2 = noise(p - vec3(e, 0.0, 0.0));
  float n3 = noise(p + vec3(0.0, e, 0.0));
  float n4 = noise(p - vec3(0.0, e, 0.0));
  float n5 = noise(p + vec3(0.0, 0.0, e));
  float n6 = noise(p - vec3(0.0, 0.0, e));
  float dx = (n1 - n2) / (2.0*e);
  float dy = (n3 - n4) / (2.0*e);
  float dz = (n5 - n6) / (2.0*e);
  return normalize(vec3(dy - dz, dz - dx, dx - dy));
}

void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 posTex = texture2D(texturePosition, uv);
  vec3 pos = posTex.xyz;
  vec4 velTex = texture2D(textureVelocity, uv);
  vec3 vel = velTex.xyz;

  // base damping
  vel *= 0.995;

  // add curl noise for fluid motion
  vec3 c = curlNoise(pos * 0.5 + time * 0.1);
  vel += c * 0.5 * delta;

  // hand force
  if (handActive == 1){
    vec3 toHand = handPos - pos;
    float d = length(toHand);
    float r = 1.5;
    if (d < r){
      float s = (1.0 - d / r);
      // if pinch, strong attraction to hand
      float baseForce = mix(3.0, 12.0, pinch);
      vel += normalize(toHand) * baseForce * s * delta;
    }
    // apply swipe impulse globally
    vel += swipe * 5.0 * delta;
  }

  // simple collision with floor: reflect & damp
  if (pos.y < floorY){
    pos.y = floorY + 0.001;
    vel.y = -vel.y * 0.4;
    // friction
    vel.x *= 0.8; vel.z *= 0.8;
  }

  gl_FragColor = vec4(vel, 1.0);
}
