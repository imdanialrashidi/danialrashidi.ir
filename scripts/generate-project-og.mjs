// Generates 1200x630 JPEG social cards from each project screenshot.
// Requires ImageMagick (`magick`). Run after adding or replacing a project.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const outDir = `${root}public/images/og/projects`;
const contentDir = `${root}src/content/projects`;
mkdirSync(outDir, { recursive: true });

for (const file of readdirSync(contentDir).filter((name) => name.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  const raw = readFileSync(`${contentDir}/${file}`, "utf8");
  const image = raw.match(/^image: "(.*)"$/m)?.[1];
  if (!image) continue;
  execFileSync(
    "magick",
    [
      `${root}public${image}`,
      "-resize",
      "1200x630^",
      "-gravity",
      "north",
      "-extent",
      "1200x630",
      "-quality",
      "82",
      `${outDir}/${slug}.jpg`,
    ],
    { stdio: "inherit" },
  );
}
