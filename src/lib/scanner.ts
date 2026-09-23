import { spawn } from "node:child_process";
import { join } from "node:path";

export type CaptureMode = "area" | "fullscreen";

export interface ScanOptions {
  captureMode: CaptureMode;
  silence: boolean;
  openUrlAfterScan: boolean;
}

export const HELPER_FILE = "scan-qr.js";

/** The `osascript` argv that runs the helper; it reads its options positionally. */
export function helperArguments(assetsPath: string, options: ScanOptions): string[] {
  return [
    "-l",
    "JavaScript",
    join(assetsPath, HELPER_FILE),
    options.captureMode,
    options.silence ? "1" : "0",
    options.openUrlAfterScan ? "1" : "0",
  ];
}

/**
 * Starts the helper detached and resolves once it is running. It must not be tied to this process:
 * some launchers stop the command as soon as its window closes, mid-selection.
 */
export function startScan(assetsPath: string, options: ScanOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const helper = spawn("/usr/bin/osascript", helperArguments(assetsPath, options), {
      detached: true,
      stdio: "ignore",
    });
    helper.once("spawn", () => resolve());
    helper.once("error", reject);
    helper.unref();
  });
}
