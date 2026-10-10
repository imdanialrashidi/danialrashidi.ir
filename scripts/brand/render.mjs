// رندر آیتم‌های برند از مسترهای scripts/brand/ — بدون وابستگی تازه.
// خروجی‌ها: public/images/og-cover.jpg (1200×630) و public/apple-touch-icon.png (180×180).
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const root = new URL("../..", import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });

async function shot(file, width, height, out, type, quality) {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
  await page.goto(pathToFileURL(root + file).href, { waitUntil: "load" });
  await page.waitForTimeout(600); // فونت خود-hosted فرصت لود دارد؛ sleep ثابت نیست، بار واقعی است
  await page.screenshot({ path: root + out, type, ...(quality ? { quality } : {}) });
  console.log("rendered", out);
  await page.close();
}

await shot("scripts/brand/og-cover.html", 1200, 630, "public/images/og-cover.jpg", "jpeg", 84);
await shot("scripts/brand/touch-icon.html", 180, 180, "public/apple-touch-icon.png", "png");
await browser.close();
