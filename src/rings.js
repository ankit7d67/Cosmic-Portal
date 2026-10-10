import * as THREE from "three";

// Each ring: radius, tube thickness, color, base tilt, spin speed,
// precession speed, wireframe style, and how many glowing "beads"
// travel along it to make the rotation readable.
const RING_DEFS = [
  { radius: 2.1, tube: 0.02, color: 0x22d3ee, tilt: [1.35, 0.2, 0.0], spin: 0.35, precession: 0.06, wireframe: false, beads: 0 },
  { radius: 2.6, tube: 0.015, color: 0x818cf8, tilt: [1.1, -0.5, 0.4], spin: -0.28, precession: -0.045, wireframe: true, beads: 0 },
  { radius: 3.2, tube: 0.025, color: 0xe879f9, tilt: [1.5, 0.8, -0.3], spin: 0.22, precession: 0.035, wireframe: false, beads: 3 },
  { radius: 3.9, tube: 0.012, color: 0xfbbf24, tilt: [1.2, -0.9, 0.6], spin: -0.18, precession: -0.028, wireframe: true, beads: 2 },
];

/**
 * Four geometric rings (torus geometry) with independent tilts, spins and
 * slow precession. Wireframe rings plus the traveling beads make the
 * rotation clearly visible; a smooth torus spinning on its own axis
 * would otherwise look static.
 */
export function createRings() {
  const group = new THREE.Group();
  const rings = [];

  for (const def of RING_DEFS) {
    const ringGroup = new THREE.Group();

    const geometry = new THREE.TorusGeometry(def.radius, def.tube, 16, 220);
    const material = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: def.wireframe ? 0.55 : 0.85,
      wireframe: def.wireframe,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const torus = new THREE.Mesh(geometry, material);
    ringGroup.add(torus);

    const beadMeshes = [];
    for (let b = 0; b < def.beads; b++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      bead.userData.angle = (b / Math.max(def.beads, 1)) * Math.PI * 2;
      ringGroup.add(bead);
      beadMeshes.push(bead);
    }

    ringGroup.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
    group.add(ringGroup);
    // Spread def FIRST so the mesh references below are not overwritten
    // by def's scalar `beads` count.
    rings.push({ ...def, ringGroup, torus, beads: beadMeshes });
  }

  function update(t) {
    for (const ring of rings) {
      // Spin around the torus symmetry axis (visible on wireframes + beads).
      ring.torus.rotation.z = t * ring.spin;
      // Slow precession of the whole ring plane.
      ring.ringGroup.rotation.y = ring.tilt[1] + t * ring.precession;

      for (const bead of ring.beads) {
        const a = bead.userData.angle + t * ring.spin * 2;
        bead.position.set(Math.cos(a) * ring.radius, Math.sin(a) * ring.radius, 0);
      }
    }
  }

  return { group, update };
}
