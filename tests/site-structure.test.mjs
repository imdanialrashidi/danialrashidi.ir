// Structural regression guard for the Persian editorial slice.
// Proves the accepted content contract without a browser:
// all routes exist, collections are complete, identity links are real,
// and no payment data is invented.
import { deepStrictEqual, ok } from "node:assert";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
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

  it("ships exactly the seven real projects with required fields", () => {
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md")).sort();
    deepStrictEqual(files, [
      "elsa-hamrah.md",
      "gym-log.md",
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
    const gymLog = readFileSync(`${ROOT}src/content/projects/gym-log.md`, "utf8");
    ok(gymLog.includes("https://gym-log.danialrashidi.ir"), "gym log project must link the real landing page");
    ok(gymLog.includes("https://github.com/imdanialrashidi/gym-log"), "gym log project must link the real source repo");
    const orders = files.map((f) => Number(frontmatter(`${ROOT}src/content/projects/${f}`).order));
    ok(orders[0] >= 0, "orders must parse");
    const novenoOrder = Number(frontmatter(`${ROOT}src/content/projects/noveno.md`).order);
    const studyOrder = Number(frontmatter(`${ROOT}src/content/projects/study.md`).order);
    ok(novenoOrder < studyOrder, "Noveno must stay before the study center");
  });
  it("study URL comes from SITE, not hardcoded component links", () => {
    // One-config rule (docs/DESIGN.md): components never hard-code links.
    const site = readFileSync(`${ROOT}src/config/site.ts`, "utf8");
    ok(site.includes("https://study.danialrashidi.ir"), "SITE must define the study URL");
    for (const file of ["src/pages/index.astro", "src/components/Footer.astro"]) {
      const raw = readFileSync(`${ROOT}${file}`, "utf8");
      ok(!raw.includes("https://study.danialrashidi.ir"), `${file} must not hardcode the study URL`);
      ok(raw.includes("SITE.studyUrl"), `${file} must use SITE.studyUrl`);
    }
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
    ok(home.includes("SITE.studyUrl"), "hero must link the study subdomain via SITE.studyUrl");
    ok(home.includes("/پروژه‌ها/study/"), "hero must link the study detail page");
    const projectsIndex = readFileSync(`${ROOT}src/pages/پروژه‌ها/index.astro`, "utf8");
    ok(projectsIndex.includes("۰۷ پروژه"), "projects index count must reflect seven projects");
    const footer = readFileSync(`${ROOT}src/components/Footer.astro`, "utf8");
    ok(footer.includes("SITE.studyUrl"), "footer sections must link the study center via SITE.studyUrl");
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
  it("travel photos stay at web weight", () => {
    // Guards the exact bloat just fixed: camera-resolution uploads served raw.
    // 250KB is headroom above the ~100-180KB optimized outputs, not a target.
    // Scan frontmatter so a newly added photo cannot bypass the budget.
    const files = readdirSync(`${ROOT}src/content/travels`).filter((f) => f.endsWith(".md"));
    const images = files
      .map((file) => ({ file, image: frontmatter(`${ROOT}src/content/travels/${file}`).image }))
      .filter((entry) => entry.image);
    ok(images.length > 0, "expected at least one travel image");
    for (const { file, image } of images) {
      const size = statSync(`${ROOT}public${image}`).size;
      ok(size < 250 * 1024, `${file}: ${image} is ${size} bytes, over the 250KB web budget`);
    }
  });

  it("declares Persian RTL SEO foundation in the base layout", () => {
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    for (const token of ['lang={SITE.lang}', 'dir={SITE.dir}', 'rel="canonical"', "og:title", "favicon.svg"]) {
      ok(base.includes(token), `base layout missing ${token}`);
    }
    const config = readFileSync(`${ROOT}astro.config.mjs`, "utf8");
    ok(config.includes("sitemap()"), "astro config missing sitemap() integration");
    ok(config.includes("SITE.domain"), "astro config must use SITE.domain, not a literal domain");
    ok(existsSync(`${ROOT}src/pages/robots.txt.ts`), "robots.txt endpoint missing");
    ok(!existsSync(`${ROOT}public/robots.txt`), "robots.txt must be generated from SITE.domain, not duplicated in public/");
    ok(readFileSync(`${ROOT}src/pages/robots.txt.ts`, "utf8").includes("SITE.domain"), "robots.txt must use SITE.domain");
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
  it("every target=_blank link carries rel=noopener", async () => {
    // async callback: the execSync import below uses await.
    // Reverse-tabnabbing guard: all current sites comply by convention;
    // this test turns the convention into a gate invariant. Tag-level regex
    // (not line grep) because attributes legitimately span lines in .astro.
    const { execSync } = await import("node:child_process");
    const files = execSync("git -c core.quotepath=off ls-files 'src/*.astro' 'src/**/*.astro'", { cwd: ROOT, encoding: "utf8" })
      .split("\n").filter(Boolean);
    ok(files.length > 0, "expected tracked .astro files");
    let blankCount = 0;
    for (const file of files) {
      const raw = readFileSync(`${ROOT}${file}`, "utf8");
      const tags = raw.match(/<a[\s\S]*?>/g) ?? [];
      for (const tag of tags) {
        if (!tag.includes('target="_blank"')) continue;
        blankCount++;
        const rel = tag.match(/rel="([^"]*)"/)?.[1] ?? "";
        ok(rel.split(/\s+/).includes("noopener"), `${file} has target=_blank without rel=noopener: ${tag.slice(0, 120)}`);
      }
    }
    ok(blankCount > 0, "expected at least one target=_blank link");
  });
  it("keeps reveal content visible when JavaScript is unavailable", () => {
    // Progressive enhancement: .reveal must not be hidden by default. The
    // hidden state is opt-in via html.js, which only the Base head script
    // adds. This fails on the old `.reveal { opacity: 0 }` rule.
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    const css = readFileSync(`${ROOT}src/styles/global.css`, "utf8");
    ok(base.includes('classList.add("js")'), "Base must mark JS-enabled documents");
    ok(base.includes('"astro:before-swap"'), "the js class must survive view-transition swaps");
    ok(css.includes("html.js .reveal"), "reveal hiding must be scoped to html.js");
    ok(/^\.reveal\s*\{[^}]*opacity:\s*1/m.test(css), "reveal must default to visible");
    ok(!/^\.reveal\s*\{[^}]*opacity:\s*0/m.test(css), "reveal must not be hidden by default");
  });
  it("re-applies the OS theme preference after view transitions", () => {
    // ClientRouter swaps in SSR data-theme="light"; the helper must fall back
    // to prefers-color-scheme when no explicit choice is stored. This fails
    // on the old helper, which returned without touching the DOM.
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    const helper = base.match(/function drApplySavedTheme\(\) \{([\s\S]*?)\n      \}/)?.[1] ?? "";
    ok(helper, "drApplySavedTheme helper not found");
    ok(helper.includes("prefers-color-scheme"), "theme helper must honor the OS preference when no saved choice exists");
    ok(/saved === "dark" \|\| saved === "light"/.test(helper), "a saved choice must still win");
  });
  it("exposes social links as links, not list items", () => {
    // role="listitem" on an <a> overrides the link role. Structure is the
    // source of truth here: a real ul/li list with real anchors inside.
    for (const file of ["src/components/SocialIcons.astro", "src/components/Footer.astro"]) {
      const raw = readFileSync(`${ROOT}${file}`, "utf8");
      ok(!raw.includes('role="listitem"'), `${file}: anchors must keep link semantics`);
      ok(!raw.includes('role="list"'), `${file}: use a real ul/li list, not ARIA list roles`);
      ok(/<ul[\s>]/.test(raw), `${file}: social links must be a real ul/li list`);
    }
  });
  it("ships responsive variants for every project image", () => {
    // ProjectImage derives `<stem>-480.webp` / `<stem>-960.webp` for srcset.
    // If an image is replaced without regenerating variants, the page would
    // request a missing file; fail here instead.
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const image = frontmatter(`${ROOT}src/content/projects/${file}`).image;
      ok(image, `${file} missing image`);
      const stem = image.replace(/\.[^.]+$/, "");
      for (const width of [480, 960]) {
        const variant = `${ROOT}public${stem}-${width}.webp`;
        ok(existsSync(variant), `${file} missing ${width}w variant`);
        ok(statSync(variant).size < statSync(`${ROOT}public${image}`).size, `${file} ${width}w variant is not smaller`);
      }
    }
  });

  it("keeps social icon markup in one component", () => {
    for (const file of [
      "src/components/SocialIcons.astro",
      "src/components/Footer.astro",
      "src/components/InstagramBand.astro",
    ]) {
      const raw = readFileSync(`${ROOT}${file}`, "utf8");
      ok(raw.includes("SocialIcon"), `${file} must use the shared SocialIcon`);
      ok(!raw.includes('<svg viewBox="0 0 24 24"'), `${file} must not inline social SVG markup`);
    }
  });

  it("renders the authored travel note body", () => {
    // The Markdown body is the personal note; the card must render it instead
    // of showing only frontmatter metadata.
    const card = readFileSync(`${ROOT}src/components/TravelCard.astro`, "utf8");
    ok(card.includes("await render(entry)"), "TravelCard must render the entry body");
    ok(card.includes("<Content />"), "TravelCard must output the rendered note");
    const raw = readFileSync(`${ROOT}src/content/travels/dalakhani.md`, "utf8");
    const body = raw.split("---")[2] ?? "";
    ok(body.trim().length > 0, "travel note body must not be empty");
  });

  it("ships a social card for every project", () => {
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const slug = file.replace(/\.md$/, "");
      const card = `${ROOT}public/images/og/projects/${slug}.jpg`;
      ok(existsSync(card), `${file} missing OG card`);
      const bytes = readFileSync(card);
      ok(bytes[0] === 0xff && bytes[1] === 0xd8, `${slug} OG card must be a JPEG`);
    }
  });
});
