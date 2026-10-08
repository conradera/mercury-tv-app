import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto("http://localhost:5173");
const bytes = await page.evaluate(async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 1800000,
  });
  const chunks = [];
  const done = new Promise((resolve) => {
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () =>
      resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));
  });
  recorder.start();
  const started = performance.now();
  await new Promise((resolve) => {
    function frame() {
      const t = (performance.now() - started) / 1000;
      const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
      gradient.addColorStop(0, "#101c2c");
      gradient.addColorStop(1, "#2b4147");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.strokeStyle = "#c5ef7230";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(1110 - t * 8, 330, 200 + i * 90, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#c5ef72";
      ctx.font = "bold 18px Arial";
      ctx.fillText("MERCURY COMPUTERS LIMITED", 90, 105);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 92px Arial";
      ctx.fillText("Technology.", 90, 285);
      ctx.fillText("Business.", 90, 390);
      ctx.fillStyle = "#c5ef72";
      ctx.fillText("Connected.", 90, 495);
      ctx.fillStyle = "#bccbd4";
      ctx.font = "24px Arial";
      ctx.fillText("Your next upgrade starts here.", 95, 585);
      ctx.font = "18px Arial";
      ctx.fillText(
        "Laptops  /  Networking  /  Security  /  Power solutions",
        95,
        640,
      );
      ctx.fillStyle = "#c5ef72";
      ctx.fillRect(0, 715, 1280 * Math.min(t / 8, 1), 5);
      if (t < 8) requestAnimationFrame(frame);
      else resolve();
    }
    frame();
  });
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  return done;
});
await writeFile("public/videos/mercury-promo.webm", Buffer.from(bytes));
await browser.close();
console.log("Created local 8-second Mercury demo film.");
