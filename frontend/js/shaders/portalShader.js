export const portalVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const portalFragmentShader = `
  uniform float uTime;
  uniform float uOpen;
  varying vec2 vUv;

  float ring(vec2 uv, float radius, float width) {
    float d = abs(length(uv) - radius);
    return smoothstep(width, 0.0, d);
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float swirl = sin(angle * 9.0 - uTime * 2.4 + radius * 18.0);
    float core = smoothstep(0.48, 0.08, radius);
    float gate = ring(uv, 0.42 + swirl * 0.012, 0.035);
    vec3 cyan = vec3(0.24, 0.95, 1.0);
    vec3 gold = vec3(1.0, 0.72, 0.24);
    vec3 color = mix(cyan, gold, swirl * 0.5 + 0.5);
    float alpha = (core * 0.42 + gate) * uOpen;
    alpha *= smoothstep(0.54, 0.48, radius);
    gl_FragColor = vec4(color * (1.2 + gate), alpha);
  }
`;
