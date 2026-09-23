import { closeMainWindow, environment, getPreferenceValues, PopToRootType, showHUD } from "@raycast/api";
import { startScan, type CaptureMode } from "./lib/scanner";

export default async function scanQrCode() {
  const preferences = getPreferenceValues<Preferences.ScanQrCode>();

  try {
    await startScan(environment.assetsPath, {
      captureMode: preferences.captureMode as CaptureMode,
      silence: preferences.silence,
      openUrlAfterScan: preferences.openUrlAfterScan,
    });
  } catch (error) {
    await showHUD(`Could not start the scanner: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  await closeMainWindow({ clearRootSearch: true, popToRootType: PopToRootType.Immediate });
}
