import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("test-results", { recursive: true });

const results = [];
function report(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? " :: " + detail : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const consoleErrors = [];
const pageErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(String(err)));

// 1. Page loads
const response = await page.goto("http://localhost:5173", { waitUntil: "load" });
report("page loads (HTTP 200)", response.status() === 200, `status ${response.status()}`);

// 2. Canvas is created and visible
await page.waitForSelector("#scene-container canvas", { timeout: 10000 });
const canvasInfo = await page.evaluate(() => {
  const c = document.querySelector("#scene-container canvas");
  return { w: c.clientWidth, h: c.clientHeight };
});
report("canvas visible", canvasInfo.w > 0 && canvasInfo.h > 0, JSON.stringify(canvasInfo));

// 3. WebGL error banner stays hidden
const webglErrorHidden = await page.evaluate(() => document.getElementById("webgl-error").hidden);
report("no WebGL fallback banner", webglErrorHidden === true);

// 4. Animation actually runs: two screenshots must differ (scene is moving)
await page.waitForTimeout(1200);
const shot1 = await page.screenshot({ animations: "disabled" });
await page.waitForTimeout(900);
const shot2 = await page.screenshot({ animations: "disabled" });
const animating = !shot1.equals(shot2);
report("animation runs (pixels change over time)", animating);
await page.screenshot({ path: "test-results/desktop.png" });

// 5. HUD visible (offsetParent is always null for position:fixed, so measure the box)
const hudVisible = await page.evaluate(() => {
  const hud = document.getElementById("hud");
  const rect = hud.getBoundingClientRect();
  const style = window.getComputedStyle(hud);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
});
report("HUD controls visible", hudVisible);

// 6. Mouse parallax + click pulse do not crash
await page.mouse.move(950, 250);
await page.waitForTimeout(300);
await page.mouse.move(400, 550);
await page.waitForTimeout(300);
await page.mouse.click(640, 400);
await page.waitForTimeout(300);
report("mouse move + click handled without errors", true);

// 7. Pause / play button
const textBefore = await page.textContent("#btn-pause");
await page.click("#btn-pause");
const textAfter = await page.textContent("#btn-pause");
report("pause button toggles", textBefore.trim() === "Pause" && textAfter.trim() === "Play", `${textBefore} -> ${textAfter}`);
await page.click("#btn-pause"); // resume

// 8. Speed slider
const speedValue = await page.evaluate(() => {
  const s = document.getElementById("speed");
  s.value = "1.5";
  s.dispatchEvent(new Event("input", { bubbles: true }));
  return s.value;
});
report("speed slider works", speedValue === "1.5", `value=${speedValue}`);

// 9. Visibility toggles
await page.click("#tgl-rings");
const ringsUnchecked = await page.evaluate(() => document.getElementById("tgl-rings").checked === false);
await page.click("#tgl-rings");
const ringsRestored = await page.evaluate(() => document.getElementById("tgl-rings").checked === true);
report("rings toggle works", ringsUnchecked && ringsRestored);

// 10. Smaller viewport
await page.setViewportSize({ width: 375, height: 667 });
await page.waitForTimeout(1000);
const smallCanvas = await page.evaluate(() => {
  const c = document.querySelector("#scene-container canvas");
  return { w: c.clientWidth, h: c.clientHeight };
});
report("small viewport renders", smallCanvas.w > 0 && smallCanvas.h > 0, JSON.stringify(smallCanvas));
await page.screenshot({ path: "test-results/small-viewport.png" });

// 11. No console / page errors anywhere in the run
report("no console errors", consoleErrors.length === 0, consoleErrors.join(" | "));
report("no page errors", pageErrors.length === 0, pageErrors.join(" | "));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) process.exit(1);
