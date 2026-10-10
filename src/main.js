import * as THREE from "three";
import { createStarfield } from "./starfield.js";
import { createPortalCore } from "./portal-core.js";
import { createParticles } from "./particles.js";
import { createRings } from "./rings.js";
import { createControls } from "./controls.js";

const container = document.getElementById("scene-container");

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
} catch (error) {
  document.getElementById("webgl-error").hidden = false;
  throw error;
}

// Cap the pixel ratio: beyond 2x the visual gain is tiny but the GPU cost
// grows quickly, especially on high-refresh displays.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020208);
scene.fog = new THREE.FogExp2(0x020208, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0.6, 9);

// On narrow (portrait) screens move the camera back so the whole
// portal and all rings stay in frame instead of being clipped.
function fitCameraDistance() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.position.z = Math.max(9, 7.4 / aspect);
}
fitCameraDistance();

// Shared mutable state consumed by every module each frame.
const state = {
  time: 0,
  speed: 1,
  paused: false,
  pulse: 0,
  pointer: { x: 0, y: 0 },
};

const starfield = createStarfield();
const core = createPortalCore();
const particles = createParticles();
const rings = createRings();

scene.add(starfield.points, core.group, particles.points, rings.group);

const controls = createControls(state, { starfield, core, particles, rings });

// Mouse parallax: the pointer nudges the camera, and a click emits a
// light pulse from the core. Values are lerped in the loop for smoothness.
window.addEventListener("pointermove", (event) => {
  state.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  state.pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
});
window.addEventListener("pointerdown", () => {
  state.pulse = 1;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  fitCameraDistance();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Clamp delta so a background tab or hiccup never causes a jump.
  const delta = Math.min(clock.getDelta(), 0.05);
  if (!state.paused) {
    state.time += delta * state.speed;
  }
  const t = state.time;

  // Smooth camera parallax toward the pointer position.
  const targetX = state.pointer.x * 0.6;
  const targetY = 0.6 - state.pointer.y * 0.4;
  camera.position.x += (targetX - camera.position.x) * 0.04;
  camera.position.y += (targetY - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  // Decay the click pulse.
  state.pulse = Math.max(0, state.pulse - delta * 1.5);

  starfield.update(t);
  core.update(t, state);
  particles.update(t);
  rings.update(t);

  renderer.render(scene, camera);
}

animate();
