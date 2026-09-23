import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type CaptureMode = "area" | "fullscreen";

export interface CaptureOptions {
  captureMode: CaptureMode;
  silence: boolean;
}

export type ScanResult = { status: "ok"; codes: string[] } | { status: "cancelled" } | { status: "not-found" };

export const HELPER_FILE = "scan-qr.js";

/** The `osascript` argv that runs the helper; it reads its options positionally. */
export function helperArguments(assetsPath: string, options: CaptureOptions): string[] {
  return ["-l", "JavaScript", join(assetsPath, HELPER_FILE), options.captureMode, options.silence ? "1" : "0"];
}

/** Parses the helper's stdout, keeping each distinct non-blank code once, in reading order. */
export function parseScanResult(stdout: string): ScanResult {
  const result = JSON.parse(stdout) as ScanResult;
  if (result.status !== "ok") return result;
  const codes = [...new Set(result.codes.map((code) => code.trim()).filter(Boolean))];
  return codes.length > 0 ? { status: "ok", codes } : { status: "not-found" };
}

/** Captures the screen and decodes every QR code in it with macOS Vision. */
export async function scanScreen(assetsPath: string, options: CaptureOptions): Promise<ScanResult> {
  const { stdout } = await execFileAsync("/usr/bin/osascript", helperArguments(assetsPath, options));
  return parseScanResult(stdout);
}
