// JXA helper: `osascript -l JavaScript scan-qr.js <area|fullscreen> <silence 0|1>`.
// Plain JavaScript because osascript runs it directly. It captures the screen, decodes QR codes
// with macOS Vision and prints the result as JSON; the extension handles everything after that.
//
// Output: {"status":"ok","codes":[…]} | {"status":"cancelled"} | {"status":"not-found"}

function run(argv) {
  ObjC.import("AppKit");
  ObjC.import("Vision");

  const [mode = "area", silence = "0"] = argv;
  const fileManager = $.NSFileManager.defaultManager;
  const displayCount = mode === "fullscreen" ? Number($.NSScreen.screens.count) : 1;
  const token = $.NSUUID.UUID.UUIDString.js;
  const files = Array.from(
    { length: displayCount },
    (_, index) => `${$.NSTemporaryDirectory().js}qr-code-scanner-${token}-${index}.png`,
  );
  const flags = silence === "1" ? ["-x"] : [];

  const task = $.NSTask.alloc.init;
  task.executableURL = $.NSURL.fileURLWithPath("/usr/sbin/screencapture");
  task.arguments = $(mode === "fullscreen" ? [...flags, ...files] : [...flags, "-i", files[0]]);
  task.launchAndReturnError(null);
  task.waitUntilExit;

  const captured = files.filter((file) => fileManager.fileExistsAtPath(file));
  // Escape during a selection leaves no file; for a full-screen capture it means no permission.
  if (captured.length === 0) return JSON.stringify({ status: "cancelled" });

  const codes = [];
  for (const file of captured) {
    const request = $.VNDetectBarcodesRequest.alloc.init;
    request.symbologies = $([$.VNBarcodeSymbologyQR, $.VNBarcodeSymbologyMicroQR]);
    const handler = $.VNImageRequestHandler.alloc.initWithURLOptions($.NSURL.fileURLWithPath(file), $({}));
    handler.performRequestsError($([request]), null);
    const results = request.results;
    const count = results.isNil() ? 0 : Number(results.count);
    for (let index = 0; index < count; index++) {
      const payload = results.objectAtIndex(index).payloadStringValue;
      if (!payload.isNil()) codes.push(payload.js);
    }
    fileManager.removeItemAtPathError(file, null);
  }

  return JSON.stringify(codes.length ? { status: "ok", codes } : { status: "not-found" });
}
