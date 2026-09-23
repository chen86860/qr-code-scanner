import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { HELPER_FILE } from "../src/lib/scanner";

interface Helper {
  openableUrl(text: string): string | null;
  uniquePayloads(payloads: string[]): string[];
  copiedMessage(payloads: string[]): string;
  captureArguments(mode: string, silence: boolean, files: string[]): string[];
}

// Evaluated without `run()`, which only osascript invokes, so no macOS bridge is needed.
function loadHelper(): Helper {
  const context = createContext({});
  runInContext(readFileSync(join(__dirname, "..", "assets", HELPER_FILE), "utf8"), context);
  return context as unknown as Helper;
}

const helper = loadHelper();

describe("openableUrl", () => {
  it.each([
    ["https://example.com/a?b=1", "https://example.com/a?b=1"],
    ["  HTTP://Example.com  ", "HTTP://Example.com"],
    ["mailto:someone@example.com", "mailto:someone@example.com"],
    ["example.com/path", "https://example.com/path"],
    ["sub.example.co.uk", "https://sub.example.co.uk"],
    ["localhost.dev:8080/x", "https://localhost.dev:8080/x"],
  ])("opens %s", (input, expected) => {
    expect(helper.openableUrl(input)).toBe(expected);
  });

  it.each(["javascript:alert(1)", "file:///etc/passwd", "WIFI:S:home;T:WPA;P:secret;;", "hello world", "", "1.5"])(
    "refuses %s",
    (input) => {
      expect(helper.openableUrl(input)).toBeNull();
    },
  );
});

describe("uniquePayloads", () => {
  it("trims, drops blanks and keeps the first of each duplicate", () => {
    expect(helper.uniquePayloads([" a ", "", "b", "a", "  "])).toEqual(["a", "b"]);
  });
});

describe("copiedMessage", () => {
  it("shows a short payload in full", () => {
    expect(helper.copiedMessage(["hello"])).toBe("Copied: hello");
  });

  it("truncates a long payload and counts several codes", () => {
    const long = "x".repeat(50);
    expect(helper.copiedMessage([long, "y"])).toBe(`Copied 2 codes: ${"x".repeat(40)}…`);
  });
});

describe("captureArguments", () => {
  it("selects interactively in area mode", () => {
    expect(helper.captureArguments("area", false, ["/tmp/a.png"])).toEqual(["-i", "/tmp/a.png"]);
  });

  it("writes one silent file per display in fullscreen mode", () => {
    expect(helper.captureArguments("fullscreen", true, ["/tmp/0.png", "/tmp/1.png"])).toEqual([
      "-x",
      "/tmp/0.png",
      "/tmp/1.png",
    ]);
  });
});
