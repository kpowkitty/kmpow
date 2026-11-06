// Globe lens. d: px offset from the camera. invR: 1/R in px^-1 (0 = flat).
// Returns (screen offset px, scale); scale 0 means the star is on the far side and hidden.
vec3 lens(vec2 d, float invR) {
  float a = length(d) * invR;
  if (a < 1e-6) return vec3(d, 1.0);
  if (a >= 1.5707963) return vec3(0.0, 0.0, 0.0);
  return vec3(d * (sin(a) / a), cos(a));
}
