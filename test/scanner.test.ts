import { describe, expect, it } from "vitest";
import { helperArguments, parseScanResult } from "../src/lib/scanner";

describe("helperArguments", () => {
  it("passes the script and every option positionally", () => {
    expect(helperArguments("/ext/assets", { captureMode: "fullscreen", silence: true })).toEqual([
      "-l",
      "JavaScript",
      "/ext/assets/scan-qr.js",
      "fullscreen",
      "1",
    ]);
  });
});

describe("parseScanResult", () => {
  it("trims, drops blanks and keeps the first of each duplicate", () => {
    expect(parseScanResult('{"status":"ok","codes":[" a ","","b","a"]}\n')).toEqual({
      status: "ok",
      codes: ["a", "b"],
    });
  });

  it("treats codes that are all blank as not found", () => {
    expect(parseScanResult('{"status":"ok","codes":["  "]}')).toEqual({ status: "not-found" });
  });

  it.each(["cancelled", "not-found"])("passes %s through", (status) => {
    expect(parseScanResult(JSON.stringify({ status }))).toEqual({ status });
  });
});
