// Structural regression guard for the Persian editorial slice.
// Proves the accepted content contract without a browser:
// all routes exist, collections are complete, identity links are real,
// and no payment data is invented.
import { deepStrictEqual, ok } from "node:assert";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";

const ROOT = new URL("../", import.meta.url).pathname;

function frontmatter(path) {
  const text = readFileSync(path, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  ok(match, `missing frontmatter: ${path}`);
  const data = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return data;
}

describe("persian editorial slice", () => {
  it("exposes all accepted routes as pages", () => {
    for (const page of ["index.astro", "404.astro", "درباره/index.astro", "پروژه‌ها/index.astro", "پروژه‌ها/[slug].astro", "سفرها/index.astro", "حمایت/index.astro", "ارتباط/index.astro"]) {
      ok(existsSync(`${ROOT}src/pages/${page}`), `missing page: ${page}`);
    }
  });

  it("ships exactly the six real projects with required fields", () => {
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md")).sort();
    deepStrictEqual(files, [
      "elsa-hamrah.md",
      "isbatab.md",
      "mobile-khorsandi.md",
      "noveno.md",
      "php-ielts-house.md",
      "study.md",
    ]);
    for (const file of files) {
      const fm = frontmatter(`${ROOT}src/content/projects/${file}`);
      for (const key of ["title", "description", "year", "status", "technologies"]) {
        ok(fm[key], `${file} missing ${key}`);
      }
    }
    const featured = files.filter((f) => frontmatter(`${ROOT}src/content/projects/${f}`).featured === "true");
    deepStrictEqual(featured, ["noveno.md", "study.md"]);
    const study = readFileSync(`${ROOT}src/content/projects/study.md`, "utf8");
    ok(study.includes("https://study.danialrashidi.ir"), "study project must link the real study subdomain");
    ok(study.includes("/images/projects/study-index.png"), "study project must use the owner-supplied screenshot");
    const orders = files.map((f) => Number(frontmatter(`${ROOT}src/content/projects/${f}`).order));
    ok(orders[0] >= 0, "orders must parse");
    const novenoOrder = Number(frontmatter(`${ROOT}src/content/projects/noveno.md`).order);
    const studyOrder = Number(frontmatter(`${ROOT}src/content/projects/study.md`).order);
    ok(novenoOrder < studyOrder, "Noveno must stay before the study center");
  });

  it("every project points at a real image file with Persian alt text", () => {
    // Guards the exact failure just seen: stale image paths (deleted SVG
    // placeholders) rendering as broken <img> instead of screenshots.
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = readFileSync(`${ROOT}src/content/projects/${file}`, "utf8");
      const img = raw.match(/^image: "(.*)"$/m)?.[1];
      const alt = raw.match(/^imageAlt: "(.*)"$/m)?.[1];
      ok(img, `${file} missing image frontmatter`);
      ok(img.startsWith("/images/projects/"), `${file} image must live under /images/projects/`);
      ok(existsSync(`${ROOT}public${img}`), `${file} image file missing: public${img}`);
      ok(alt && alt.length > 10, `${file} needs a descriptive Persian imageAlt`);
    }
  });

  it("keeps travel notes lightweight with Instagram as photo home", () => {
    const files = readdirSync(`${ROOT}src/content/travels`).filter((f) => f.endsWith(".md"));
    ok(files.length >= 3, "expected at least three travel notes");
    for (const file of files) {
      const fm = frontmatter(`${ROOT}src/content/travels/${file}`);
      ok(fm.destination && fm.date && fm.description, `${file} missing travel fields`);
    }
    const site = readFileSync(`${ROOT}src/config/site.ts`, "utf8");
    ok(site.includes("https://instagram.com/imdanialrashidi"), "real Instagram profile missing");
    ok(site.includes("https://t.me/imdanialrashidi"), "real Telegram link missing");
    ok(site.includes("imdanialrashidi.github.io"), "English site handle missing");
  });

  it("uses only owner-provided payment data: configured card with honest fallback UI", () => {
    const support = readFileSync(`${ROOT}src/config/support.ts`, "utf8");
    ok(/SUPPORT_METHODS: SupportMethod\[\] = \[\s*(\/\/[^\n]*\n|\s)*\];/.test(support), "support methods must stay owner-configured (empty by default)");
    // Owner-provided card (2026-10-10 brief): digits + holder only, no invented bank.
    ok(support.includes("6219861842274689"), "owner card number missing from support config");
    ok(support.includes("دانیال رشیدی"), "card holder name missing from support config");
    const panel = readFileSync(`${ROOT}src/components/SupportPanel.astro`, "utf8");
    ok(panel.includes("هنوز راه پرداخت ندارد"), "honest unconfigured support fallback must be kept");
    ok(panel.includes("data-copy-card"), "card copy control missing");
    ok(panel.includes('role="status"'), "copy live-region missing");
  });

  it("surfaces the study center in hero, projects index, and footer sections", () => {
    const home = readFileSync(`${ROOT}src/pages/index.astro`, "utf8");
    ok(home.includes("https://study.danialrashidi.ir"), "hero must link the study subdomain");
    ok(home.includes("/پروژه‌ها/study/"), "hero must link the study detail page");
    const projectsIndex = readFileSync(`${ROOT}src/pages/پروژه‌ها/index.astro`, "utf8");
    ok(projectsIndex.includes("۰۶ پروژه"), "projects index count must reflect six projects");
    const footer = readFileSync(`${ROOT}src/components/Footer.astro`, "utf8");
    ok(footer.includes("https://study.danialrashidi.ir"), "footer sections must link the study center");
    ok(footer.includes("مرکز مطالعه"), "footer study label missing");
  });

  it("every travel photo, when present, points at a real file with Persian alt text", () => {
    // Travels are imageless by design until the owner supplies trip photos
    // (see docs/DESIGN.md fixtures). This guard passes vacuously today and
    // bites on first-upload day: image without descriptive alt fails the gate.
    const files = readdirSync(`${ROOT}src/content/travels`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = readFileSync(`${ROOT}src/content/travels/${file}`, "utf8");
      const img = raw.match(/^image: "(.*)"$/m)?.[1];
      if (!img) continue;
      const alt = raw.match(/^imageAlt: "(.*)"$/m)?.[1];
      ok(img.startsWith("/images/travels/"), `${file} image must live under /images/travels/`);
      ok(existsSync(`${ROOT}public${img}`), `${file} image file missing: public${img}`);
      ok(alt && alt.length > 10, `${file} needs a descriptive Persian imageAlt`);
    }
  });

  it("declares Persian RTL SEO foundation in the base layout", () => {
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    for (const token of ['lang={SITE.lang}', 'dir={SITE.dir}', 'rel="canonical"', "og:title", "favicon.svg"]) {
      ok(base.includes(token), `base layout missing ${token}`);
    }
    const config = readFileSync(`${ROOT}astro.config.mjs`, "utf8");
    ok(config.includes("sitemap()"), "astro config missing sitemap() integration");
    ok(existsSync(`${ROOT}public/robots.txt`), "robots.txt missing");
    ok(existsSync(`${ROOT}public/favicon.svg`), "favicon missing");
  });

  it("ships structured data, social cards, and 404 noindex from the SEO pass", () => {
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    for (const token of ['application/ld+json', '"Person"', '"WebSite"', "twitter:image", "summary_large_image", 'og:image:width', 'content="noindex"']) {
      ok(base.includes(token), `base layout missing ${token}`);
    }
    const notFound = readFileSync(`${ROOT}src/pages/404.astro`, "utf8");
    ok(notFound.includes("noindex"), "404 page must opt out of indexing");
    const heading = readFileSync(`${ROOT}src/components/SectionHeading.astro`, "utf8");
    ok(heading.includes("<h2"), "section headings must be real h2 elements");
    ok(existsSync(`${ROOT}public/images/og-cover.jpg`), "dedicated social cover image missing");
    // Link preview must be the photo-free editorial card, never the portrait (owner 2026-10-10).
    const cover = readFileSync(`${ROOT}public/images/og-cover.jpg`);
    const portrait = readFileSync(`${ROOT}public/images/Danial_photo.jpg`);
    ok(!cover.equals(portrait), "og-cover must not be the portrait photo");
    ok(base.includes("SITE.ogImageAlt"), "og:image:alt must come from site config, not the portrait alt");
    const site = readFileSync(`${ROOT}src/config/site.ts`, "utf8");
    ok(site.includes("ogImageAlt"), "site config must own the social cover alt text");
    // Seal favicon + touch icon for link-preview/tab surfaces.
    ok(existsSync(`${ROOT}public/apple-touch-icon.png`), "apple-touch-icon missing");
    ok(base.includes("apple-touch-icon"), "base layout must wire the apple-touch-icon");
    const favicon = readFileSync(`${ROOT}public/favicon.svg`, "utf8");
    ok(favicon.includes("#1E4D3B") && favicon.includes("<path"), "favicon must be the seal mark with the signature stroke");
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = readFileSync(`${ROOT}src/content/projects/${file}`, "utf8");
      ok(/^imageWidth: \d+$/m.test(raw) && /^imageHeight: \d+$/m.test(raw), `${file} needs intrinsic image dimensions (CLS guard)`);
    }
  });
});
