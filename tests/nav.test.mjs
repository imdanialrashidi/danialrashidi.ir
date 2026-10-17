// Unit guard for the nav active-state helper in src/config/site.ts.
// isActivePath drives aria-current in Masthead (desktop + mobile).
// Expected values below are hand-derived from the prefix rule, not from running the code.
import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { isActivePath } from "../src/config/site.ts";

describe("nav active state", () => {
  it("matches home exactly, never by prefix", () => {
    strictEqual(isActivePath("/", "/"), true);
    strictEqual(isActivePath("/", "/درباره/"), false);
  });

  it("matches section pages by prefix", () => {
    strictEqual(isActivePath("/پروژه‌ها/", "/پروژه‌ها/"), true);
    strictEqual(isActivePath("/پروژه‌ها/", "/پروژه‌ها/noveno/"), true);
    strictEqual(isActivePath("/درباره/", "/ارتباط/"), false);
  });

  it("marks the support page current", () => {
    strictEqual(isActivePath("/حمایت/", "/حمایت/"), true);
    strictEqual(isActivePath("/حمایت/", "/"), false);
  });
});
