import * as THREE from "three";

/**
 * Procedural starfield: points scattered through a thick spherical shell
 * far behind the portal. Additive blending makes overlapping stars glow
 * without any texture assets.
 */
export function createStarfield() {
  const COUNT = 1800;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const color = new THREE.Color();

  for (let i = 0; i < COUNT; i++) {
    const radius = 30 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const pick = Math.random();
    if (pick < 0.6) {
      color.setHSL(0.6, 0.4, 0.72 + Math.random() * 0.26); // cool blue-white
    } else if (pick < 0.85) {
      color.setHSL(0.08, 0.55, 0.7); // warm
    } else {
      color.setHSL(0, 0, 0.9); // pure white
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.35,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);

  function update(t) {
    // Very slow drift so the background never feels static.
    points.rotation.y = t * 0.005;
    points.rotation.x = Math.sin(t * 0.01) * 0.02;
  }

  return { points, update };
}
