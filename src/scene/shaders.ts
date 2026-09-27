// GLSL for the home dot field, the ∞ edges and the inner-page ambient dots.
// DOT_POSITION is shared so the edges follow the dots exactly.

const COMMON = /* glsl */ `
uniform float uTime, uGather, uFlow, uScale, uBand, uScrollY, uFieldH, uVelocity, uHover;
uniform vec2 uMouse; // world xy on the dot plane
attribute vec3 aField;
attribute vec3 aOff;
attribute float aRandom, aT;

vec3 lemniscate(float t) {
  float s = sin(t), c = cos(t), d = 1.0 + s * s;
  return vec3(uScale * c / d, uScale * s * c / d, 0.0);
}

// Returns the blended position; writes the field position and gather amount.
vec3 dotPosition(out vec3 f, out float g) {
  // 1. field with slow drift and scroll parallax (wraps vertically)
  f = aField;
  // a slow wave rolling across the field (phase follows position, so neighbours move together)
  f.x += sin(uTime * 0.35 + aField.y * 0.7 + aRandom * 1.5) * 0.1;
  f.y += cos(uTime * 0.3 + aField.x * 0.55 + aRandom * 1.5) * 0.1;
  f.y = mod(f.y + uScrollY * 0.0015 + uFieldH * 0.5, uFieldH) - uFieldH * 0.5;
  f.y += uVelocity * 0.0004 * aRandom; // tiny stretch when scrolling fast

  // 2. infinity target, flowing along the curve
  vec3 inf = lemniscate(aT + uFlow) + aOff * uBand;

  // 3. staggered gather
  g = smoothstep(0.0, 1.0, clamp(uGather * 1.5 - aRandom * 0.5, 0.0, 1.0));
  return mix(f, inf, g);
}
`;

export const dotVert = /* glsl */ `
${COMMON}
uniform float uReveal, uSize, uPixelRatio, uFieldAlpha;
uniform vec3 uFocus; // xy = world center of active section, z = strength 0..1
varying float vAlpha, vGlow;

void main() {
  vec3 f; float g;
  vec3 p = dotPosition(f, g);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float tw = 0.85 + 0.15 * sin(uTime * 1.3 + aRandom * 20.0);
  // Big and faint in the field; shrinks as it gathers so the ∞ stays crisp.
  // Dots nearest the cursor grow a little (no push); off on touch and once gathered.
  float hover = smoothstep(1.3, 0.0, length(f.xy - uMouse)) * uHover;
  gl_PointSize = uSize * uPixelRatio * tw * mix(1.0, 0.9, g) * (1.0 + 0.5 * hover) * (1.0 / -mv.z);

  vGlow = uFocus.z * smoothstep(2.2, 0.0, length(f.xy - uFocus.xy)) * (1.0 - g);
  vAlpha = uReveal * mix(uFieldAlpha, 0.95, g);
}
`;

export const dotFrag = /* glsl */ `
uniform vec3 uColor, uGlowColor;
varying float vAlpha, vGlow;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.2, r);
  vec3 col = mix(uColor, uGlowColor, vGlow);
  gl_FragColor = vec4(col, soft * (vAlpha + vGlow * 0.35 * vAlpha));
  #include <colorspace_fragment>
}
`;

export const edgeVert = /* glsl */ `
${COMMON}
uniform float uDraw;
attribute float aOrder;
varying float vEdge;
void main() {
  vec3 f; float g;
  vec3 p = dotPosition(f, g);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  vEdge = g * smoothstep(aOrder - 0.05, aOrder, uDraw);
}
`;

export const edgeFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uEdgeOpacity, uReveal;
varying float vEdge;
void main() {
  gl_FragColor = vec4(uColor, vEdge * uEdgeOpacity * uReveal);
  #include <colorspace_fragment>
}
`;

export const ambientVert = /* glsl */ `
uniform float uTime, uSize, uPixelRatio, uOpacity;
attribute float aRandom, aSpeed;
varying float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime * 0.05 * aSpeed;
  p.x += sin(t + aRandom * 6.2831) * 0.8;
  p.y += cos(t * 0.8 + aRandom * 12.0) * 0.6;
  p.z += sin(t * 0.6 + aRandom * 3.0) * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  gl_PointSize = uSize * uPixelRatio * (1.0 / depth);
  float fog = smoothstep(42.0, 10.0, depth); // farther = fainter
  float tw = 0.75 + 0.25 * sin(uTime * 0.6 + aRandom * 30.0);
  vAlpha = uOpacity * fog * tw;
}
`;

export const ambientFrag = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.15, r) * vAlpha);
  #include <colorspace_fragment>
}
`;
