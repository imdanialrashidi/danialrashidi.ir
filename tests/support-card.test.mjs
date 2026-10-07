// Unit guard for the money-adjacent boundary in src/config/support.ts.
// isSupportCardConfigured flips the support UI between the honest-empty state
// and real card display; formatCardNumber renders the number. Expected values
// below are hand-derived from the regexes, not from running the code.
import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { formatCardNumber, isSupportCardConfigured } from "../src/config/support.ts";

const card = (number) => ({ number, bank: "", holder: "" });

describe("support card helpers", () => {
  it("detects a configured card only at eight digits or more", () => {
    strictEqual(isSupportCardConfigured(card("")), false);
    strictEqual(isSupportCardConfigured(card("1234567")), false);
    strictEqual(isSupportCardConfigured(card("12345678")), true);
    strictEqual(isSupportCardConfigured(card("6037 9912-3456 7890")), true);
  });

  it("formats card numbers in groups of four, digits only, capped at twenty", () => {
    strictEqual(formatCardNumber("6037991234567890"), "6037 9912 3456 7890");
    strictEqual(formatCardNumber("6037-9912 3456x7890"), "6037 9912 3456 7890");
    strictEqual(formatCardNumber("1".repeat(25)), "1111 1111 1111 1111 1111");
    strictEqual(formatCardNumber(""), "");
  });
});
