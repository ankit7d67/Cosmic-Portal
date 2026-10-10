import * as THREE from "three";

/**
 * Soft radial glow texture generated on a canvas at runtime, so no image
 * assets are needed. Used for the halo sprite behind the portal core.
 */
function makeGlowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0.0, "rgba(140, 225, 255, 0.85)");
  gradient.addColorStop(0.25, "rgba(90, 140, 255, 0.35)");
  gradient.addColorStop(0.6, "rgba(160, 60, 255, 0.12)");
  gradient.addColorStop(1.0, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vWobble;

  void main() {
    vec3 pos = position;

    // Gentle surface "boiling" so the sphere feels alive.
    float wobble = sin(pos.x * 3.0 + uTime * 1.2)
                 * sin(pos.y * 3.0 + uTime * 1.5)
                 * sin(pos.z * 3.0 + uTime * 0.8);
    pos += normal * wobble * 0.07;
    vWobble = wobble;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vWobble;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);

    // Fresnel rim: edges glow much brighter than the center.
    float fresnel = pow(1.0 - abs(dot(n, v)), 2.2);
    float bands = 0.5 + 0.5 * sin(vWobble * 6.0 + uTime * 2.0);
    float pulse = 1.0 + uPulse * 1.6;

    vec3 color = mix(uColorA, uColorB, clamp(fresnel * 0.8 + bands * 0.2, 0.0, 1.0));
    float intensity = fresnel * 1.6 + 0.12 + bands * 0.15;

    gl_FragColor = vec4(color * intensity * pulse, 1.0);
  }
`;

/**
 * The portal core: a glowing sphere with a custom fresnel shader, a hot
 * inner sphere, a soft canvas-generated halo sprite, and a point light.
 * Everything is procedural - no textures are loaded from disk.
 */
export function createPortalCore() {
  const group = new THREE.Group();

  const uniforms = {
    uTime: { value: 0 },
    uPulse: { value: 0 },
    uColorA: { value: new THREE.Color(0x22d3ee) }, // cyan
    uColorB: { value: new THREE.Color(0xa855f7) }, // violet
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });

  const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 64), material);
  group.add(sphere);

  // Small bright center so the portal has a "hot" heart.
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xeafcff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(inner);

  // Large soft halo behind the sphere.
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.scale.setScalar(7);
  group.add(halo);

  const light = new THREE.PointLight(0x66ccff, 30, 40, 2);
  group.add(light);

  function update(t, state) {
    uniforms.uTime.value = t;
    uniforms.uPulse.value = state.pulse;
    group.rotation.y = t * 0.15;

    const scale = 1 + state.pulse * 0.12;
    sphere.scale.setScalar(scale);
    halo.material.opacity = 0.7 + state.pulse * 0.3;
  }

  return { group, update };
}
