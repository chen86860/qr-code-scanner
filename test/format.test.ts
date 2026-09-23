import { describe, expect, it } from "vitest";
import { copiedMessage, openableUrl } from "../src/lib/format";

describe("openableUrl", () => {
  it.each([
    ["https://example.com/a?b=1", "https://example.com/a?b=1"],
    ["  HTTP://Example.com  ", "HTTP://Example.com"],
    ["mailto:someone@example.com", "mailto:someone@example.com"],
    ["example.com/path", "https://example.com/path"],
    ["sub.example.co.uk", "https://sub.example.co.uk"],
    ["localhost.dev:8080/x", "https://localhost.dev:8080/x"],
  ])("opens %s", (input, expected) => {
    expect(openableUrl(input)).toBe(expected);
  });

  it.each(["javascript:alert(1)", "file:///etc/passwd", "WIFI:S:home;T:WPA;P:secret;;", "hello world", "", "1.5"])(
    "refuses %s",
    (input) => {
      expect(openableUrl(input)).toBeNull();
    },
  );
});

describe("copiedMessage", () => {
  it("shows a short payload in full", () => {
    expect(copiedMessage(["hello"])).toBe("Copied: hello");
  });

  it("truncates a long payload and counts several codes", () => {
    expect(copiedMessage(["x".repeat(50), "y"])).toBe(`Copied 2 codes: ${"x".repeat(40)}…`);
  });
});
