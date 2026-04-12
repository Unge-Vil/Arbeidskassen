import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routingPath = resolve(dirname(fileURLToPath(import.meta.url)), "routing.ts");
const routingSource = readFileSync(routingPath, "utf8");

describe("i18n routing config", () => {
  it("defines supported locales", () => {
    expect(routingSource).toMatch(/locales:\s*\[\s*["']no["']\s*,\s*["']en["']\s*\]/);
  });

  it("defines no as default locale", () => {
    expect(routingSource).toMatch(/defaultLocale:\s*["']no["']/);
  });
});