import * as THREE from "three";

const COUNT = 2600;

// Palette sampled per particle: cyan, indigo, magenta, gold, emerald, rose.
const PALETTE = [0x22d3ee, 0x818cf8, 0xe879f9, 0xfbbf24, 0x34d399, 0xfb7185];

/**
 * Colorful particles orbiting the core on tilted elliptical shells.
 * Each particle keeps its own orbit parameters (radius, inclination,
 * ascending node, phase, angular speed); positions are recomputed on the
 * CPU each frame, which is cheap for a few thousand points and gives full
 * control over every orbit.
 */
export function createParticles() {
  const radius = new Float32Array(COUNT);
  const inclination = new Float32Array(COUNT);
  const node = new Float32Array(COUNT);
  const angle = new Float32Array(COUNT);
  const speed = new Float32Array(COUNT);

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const color = new THREE.Color();

  for (let i = 0; i < COUNT; i++) {
    radius[i] = 2.0 + Math.pow(Math.random(), 0.7) * 5.5;
    inclination[i] = (Math.random() - 0.5) * 1.2; // tilt of the orbit plane
    node[i] = Math.random() * Math.PI * 2; // orientation of the orbit plane
    angle[i] = Math.random() * Math.PI * 2; // starting phase
    // Inner orbits move faster (rough Kepler-like feel).
    speed[i] = (0.15 + Math.random() * 0.5) / Math.sqrt(radius[i]);

    color.setHex(PALETTE[(Math.random() * PALETTE.length) | 0]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.07,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);

  function update(t) {
    for (let i = 0; i < COUNT; i++) {
      const a = angle[i] + t * speed[i];
      const x0 = Math.cos(a) * radius[i];
      const z0 = Math.sin(a) * radius[i];

      // Tilt the orbit plane around X (inclination)...
      const ci = Math.cos(inclination[i]);
      const si = Math.sin(inclination[i]);
      const y1 = -z0 * si;
      const z1 = z0 * ci;

      // ...then rotate it around Y (ascending node).
      const cn = Math.cos(node[i]);
      const sn = Math.sin(node[i]);
      positions[i * 3] = x0 * cn + z1 * sn;
      positions[i * 3 + 1] = y1;
      positions[i * 3 + 2] = -x0 * sn + z1 * cn;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  return { points, update };
}
