import { describe, expect, it } from "vitest";
import { helperArguments } from "../src/lib/scanner";

describe("helperArguments", () => {
  it("passes the script and every option positionally", () => {
    expect(
      helperArguments("/ext/assets", { captureMode: "fullscreen", silence: true, openUrlAfterScan: false }),
    ).toEqual(["-l", "JavaScript", "/ext/assets/scan-qr.js", "fullscreen", "1", "0"]);
  });
});
