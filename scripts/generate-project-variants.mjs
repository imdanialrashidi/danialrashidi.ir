// Regenerates the 480w/960w WebP variants used by ProjectImage's srcset.
// Requires ImageMagick (`magick`). Run after replacing a project screenshot.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const contentDir = `${root}src/content/projects`;

for (const file of readdirSync(contentDir).filter((name) => name.endsWith(".md"))) {
  const raw = readFileSync(`${contentDir}/${file}`, "utf8");
  const image = raw.match(/^image: "(.*)"$/m)?.[1];
  if (!image) continue;
  const stem = `${root}public${image.replace(/\.[^.]+$/, "")}`;
  for (const width of [480, 960]) {
    execFileSync(
      "magick",
      [`${root}public${image}`, "-resize", `${width}x>`, "-quality", "78", `${stem}-${width}.webp`],
      { stdio: "inherit" },
    );
  }
}
