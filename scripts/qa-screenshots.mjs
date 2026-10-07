// Local Chromium QA — replaces Playwright MCP (Chrome binary missing in this env).
// Captures viewport screenshots, console errors, failed requests, and overflow
// evidence for the Persian editorial slice. Screenshots land in .artifacts/qa/.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.QA_BASE ?? "http://127.0.0.1:4321";
const OUT = new URL("../.artifacts/qa/", import.meta.url);

const ROUTES = [
  { name: "home", path: "/" },
  { name: "about", path: "/درباره/" },
  { name: "projects", path: "/پروژه‌ها/" },
  { name: "project-detail", path: "/پروژه‌ها/noveno/" },
  { name: "travels", path: "/سفرها/" },
  { name: "support", path: "/حمایت/" },
  { name: "contact", path: "/ارتباط/" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1360, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
];

const NARROW = { name: "mobile-320", width: 320, height: 568 };

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb"],
});

const report = [];

for (const route of ROUTES) {
  const url = BASE + encodeURI(route.path);
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: vp });
    const consoleErrors = [];
    const failed = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
    });
    page.on("response", (res) => {
      if (res.status() >= 400) failed.push(`${res.status()} ${res.url().slice(0, 120)}`);
    });
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    }));
    const meta = await page.evaluate(() => ({
      title: document.title,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
      desc: document.querySelector('meta[name="description"]')?.content?.slice(0, 80) ?? null,
      h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60) ?? null,
      skipLink: !!document.querySelector('a[href="#main"]'),
      themeToggle: !!document.querySelector("[data-theme-toggle]"),
      menuButton: !!document.querySelector("[data-menu-button]"),
    }));
    const file = `${route.name}-${vp.name}.png`;
    await page.screenshot({ path: new URL(file, OUT).pathname });
    report.push({ route: route.name, viewport: vp.name, url, file, consoleErrors, failed, overflow, meta });
    console.log(
      `${route.name} @${vp.name}: title="${meta.h1}" overflowX=${overflow.overflowX} consoleErr=${consoleErrors.length} failed=${failed.length}`,
    );
    await page.close();
  }
}

// 320px overflow sweep (no screenshots except home for proof)
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: NARROW });
  await page.goto(BASE + encodeURI(route.path), { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(300);
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (route.name === "home") {
    await page.screenshot({ path: new URL("home-mobile-320.png", OUT).pathname });
  }
  report.push({ route: route.name, viewport: NARROW.name, overflowXOnly: overflowX });
  console.log(`${route.name} @320: overflowX=${overflowX}`);
  await page.close();
}

// Theme toggle + keyboard smoke test on home (desktop)
{
  const page = await browser.newPage({ viewport: VIEWPORTS[0] });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(BASE + "/", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.click("[data-theme-toggle]");
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  const persisted = await page.evaluate(() => {
    try {
      return localStorage.getItem("dr-theme");
    } catch {
      return null;
    }
  });
  await page.screenshot({ path: new URL("home-desktop-dark.png", OUT).pathname });
  // Keyboard: focus skip link then tab into header
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40) ?? null);
  const focusOutline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const s = getComputedStyle(el);
    return { outline: s.outlineWidth, tag: el.tagName };
  });
  console.log(`theme: ${before} -> ${after} (persisted=${persisted})`);
  console.log(`keyboard focus: "${focused}" outline=${JSON.stringify(focusOutline)} pageerrors=${errors.length}`);
  report.push({ smoke: "theme-toggle", before, after, persisted, focused, focusOutline, errors });
  await page.close();
}

// Reduced-motion evidence: computed animation on signature stroke
{
  const page = await browser.newPage({ viewport: VIEWPORTS[1], reducedMotion: "reduce" });
  await page.goto(BASE + "/", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(400);
  const stroke = await page.evaluate(() => {
    const p = document.querySelector(".signature-stroke path");
    if (!p) return null;
    const s = getComputedStyle(p);
    return { animationDuration: s.animationDuration, dashOffset: s.strokeDashoffset };
  });
  console.log(`reduced-motion stroke: ${JSON.stringify(stroke)}`);
  await page.screenshot({ path: new URL("home-mobile-390-reduced.png", OUT).pathname });
  report.push({ smoke: "reduced-motion", stroke });
  await page.close();
}

await browser.close();

const fs = await import("node:fs/promises");
await fs.writeFile(new URL("report.json", OUT).pathname, JSON.stringify(report, null, 2));
console.log(`\nDone. ${report.length} entries. See .artifacts/qa/`);
