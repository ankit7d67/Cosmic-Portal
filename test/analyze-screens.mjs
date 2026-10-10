import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const browser = await chromium.launch();
const page = await browser.newPage();

async function analyzePng(path) {
  const pngBase64 = readFileSync(path).toString("base64");
  return await page.evaluate(async (b64) => {
    const img = new Image();
    const loaded = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    img.src = `data:image/png;base64,${b64}`;
    await loaded;
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let nonBlack = 0;
    let bright = 0;
    let saturationSum = 0;
    let colorfulPixels = 0;
    let rSum = 0, gSum = 0, bSum = 0;
    const total = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      rSum += r; gSum += g; bSum += b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 12) nonBlack++;
      if (max > 200) bright++;
      const sat = max === 0 ? 0 : (max - min) / max;
      saturationSum += sat;
      if (sat > 0.35 && max > 40) colorfulPixels++;
    }

    return {
      width: canvas.width,
      height: canvas.height,
      meanColor: [rSum / total, gSum / total, bSum / total],
      nonBlackPct: (100 * nonBlack) / total,
      brightPct: (100 * bright) / total,
      meanSaturation: saturationSum / total,
      colorfulPct: (100 * colorfulPixels) / total,
    };
  }, pngBase64);
}

const desktop = await analyzePng("test-results/desktop.png");
const small = await analyzePng("test-results/small-viewport.png");

console.log("desktop:", JSON.stringify(desktop, null, 2));
console.log("small  :", JSON.stringify(small, null, 2));

const checks = [
  ["desktop is dark overall", desktop.meanColor.every((c) => c < 30)],
  ["desktop has a bright core", desktop.brightPct > 0.05],
  ["desktop has colorful pixels (particles/rings)", desktop.colorfulPct > 0.5],
  ["desktop is not blank", desktop.nonBlackPct > 1],
  ["small viewport is dark overall", small.meanColor.every((c) => c < 30)],
  ["small viewport has a bright core", small.brightPct > 0.05],
  ["small viewport has colorful pixels", small.colorfulPct > 0.5],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}`);
  if (!ok) failed++;
}

await browser.close();
if (failed > 0) process.exit(1);
