import { Clipboard, closeMainWindow, environment, getPreferenceValues, open, showHUD } from "@raycast/api";
import { copiedMessage, openableUrl } from "./lib/format";
import { scanScreen, type CaptureMode, type ScanResult } from "./lib/scanner";

export default async function scanQrCode() {
  const preferences = getPreferenceValues<Preferences.ScanQrCode>();
  const captureMode = preferences.captureMode as CaptureMode;
  // The window must be gone before the capture, or it covers the code being scanned.
  await closeMainWindow();

  let result: ScanResult;
  try {
    result = await scanScreen(environment.assetsPath, { captureMode, silence: preferences.silence });
  } catch (error) {
    await showHUD(`Scan failed: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  switch (result.status) {
    case "cancelled":
      if (captureMode === "fullscreen") await showHUD("Could not capture the screen. Is Screen Recording allowed?");
      return;
    case "not-found":
      await showHUD(
        captureMode === "fullscreen" ? "No QR code found on any screen" : "No QR code found in the selection",
      );
      return;
    case "ok":
      await Clipboard.copy(result.codes.join("\n"));
      break;
  }

  const url = preferences.openUrlAfterScan ? openableUrl(result.codes[0] ?? "") : null;
  if (url) {
    try {
      await open(url);
      return;
    } catch {
      // Opening is best-effort; the code is already on the clipboard either way.
    }
  }
  await showHUD(copiedMessage(result.codes));
}
