/**
 * Vanilla DOM wiring for the HUD: pause/play, speed slider, visibility
 * toggles, and the Space keyboard shortcut. No framework involved.
 */
export function createControls(state, parts) {
  const btnPause = document.getElementById("btn-pause");
  const speed = document.getElementById("speed");
  const tglParticles = document.getElementById("tgl-particles");
  const tglRings = document.getElementById("tgl-rings");
  const tglStars = document.getElementById("tgl-stars");

  function togglePause() {
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? "Play" : "Pause";
  }

  function onKeyDown(event) {
    if (event.code === "Space" && event.target === document.body) {
      event.preventDefault();
      togglePause();
    }
  }

  btnPause.addEventListener("click", togglePause);
  speed.addEventListener("input", () => {
    state.speed = Number(speed.value);
  });
  tglParticles.addEventListener("change", () => {
    parts.particles.points.visible = tglParticles.checked;
  });
  tglRings.addEventListener("change", () => {
    parts.rings.group.visible = tglRings.checked;
  });
  tglStars.addEventListener("change", () => {
    parts.starfield.points.visible = tglStars.checked;
  });
  window.addEventListener("keydown", onKeyDown);

  return {
    destroy() {
      btnPause.removeEventListener("click", togglePause);
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}
