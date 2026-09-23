// JXA helper, run as `osascript -l JavaScript scan-qr.js <captureMode> <silence> <openUrl>`.
//
// It is plain JavaScript because osascript executes it directly. It runs detached from the extension
// so a launcher that tears the command down once its window hides cannot interrupt a scan: capture,
// decoding (macOS Vision), clipboard and feedback all happen here.
//
// Top-level declarations are pure so the tests can load them; everything touching macOS is in run().

const SAFE_PROTOCOLS = ["http:", "https:", "ftp:", "mailto:"];
const PREVIEW_LENGTH = 40;

/** The URL a decoded payload should open, or null when it is not a safe web or mail link. */
function openableUrl(text) {
  const value = text.trim();
  if (!value) return null;
  // `host:8080/path` has no scheme, so a colon followed only by a port does not count as one.
  const protocol = /^([a-z][a-z0-9+.-]*):(?!\d+(\/|$))/i.exec(value);
  if (protocol) return SAFE_PROTOCOLS.includes(protocol[1].toLowerCase() + ":") ? value : null;
  if (/\s/.test(value) || !/^[\w-]+(\.[\w-]+)*\.[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(value)) return null;
  return `https://${value}`;
}

/** Codes in reading order, without blanks or duplicates. */
function uniquePayloads(payloads) {
  return [...new Set(payloads.map((payload) => payload.trim()).filter(Boolean))];
}

/** The notification body for what was copied. */
function copiedMessage(payloads) {
  const [first] = payloads;
  const preview = first.length > PREVIEW_LENGTH ? `${first.slice(0, PREVIEW_LENGTH)}…` : first;
  return payloads.length > 1 ? `Copied ${payloads.length} codes: ${preview}` : `Copied: ${preview}`;
}

/** screencapture arguments: one output file per display, or an interactive selection. */
function captureArguments(mode, silence, files) {
  const flags = silence ? ["-x"] : [];
  return mode === "fullscreen" ? [...flags, ...files] : [...flags, "-i", files[0]];
}

function run(argv) {
  ObjC.import("AppKit");
  ObjC.import("Vision");

  const [mode = "area", silence = "0", openUrl = "0"] = argv;
  const app = Application.currentApplication();
  app.includeStandardAdditions = true;
  const notify = (message) => app.displayNotification(message, { withTitle: "QR Code Scanner" });
  const fileManager = $.NSFileManager.defaultManager;

  const displayCount = mode === "fullscreen" ? Number($.NSScreen.screens.count) : 1;
  const token = $.NSUUID.UUID.UUIDString.js;
  const files = Array.from({ length: displayCount }, (_, index) =>
    $.NSTemporaryDirectory().js + `qr-code-scanner-${token}-${index}.png`,
  );

  const task = $.NSTask.alloc.init;
  task.executableURL = $.NSURL.fileURLWithPath("/usr/sbin/screencapture");
  task.arguments = $(captureArguments(mode, silence === "1", files));
  task.launchAndReturnError(null);
  task.waitUntilExit;

  const captured = files.filter((file) => fileManager.fileExistsAtPath(file));
  // Escape during an interactive selection leaves no file: the user cancelled, so stay quiet.
  if (captured.length === 0) {
    if (mode === "fullscreen") notify("Could not capture the screen. Is Screen Recording allowed?");
    return;
  }

  const payloads = [];
  for (const file of captured) {
    const request = $.VNDetectBarcodesRequest.alloc.init;
    request.symbologies = $([$.VNBarcodeSymbologyQR, $.VNBarcodeSymbologyMicroQR]);
    const handler = $.VNImageRequestHandler.alloc.initWithURLOptions($.NSURL.fileURLWithPath(file), $({}));
    handler.performRequestsError($([request]), null);
    const results = request.results;
    const count = results.isNil() ? 0 : Number(results.count);
    for (let index = 0; index < count; index++) {
      const payload = results.objectAtIndex(index).payloadStringValue;
      if (!payload.isNil()) payloads.push(payload.js);
    }
    fileManager.removeItemAtPathError(file, null);
  }

  const codes = uniquePayloads(payloads);
  if (codes.length === 0) {
    notify(mode === "fullscreen" ? "No QR code found on any screen." : "No QR code found in the selection.");
    return;
  }

  const pasteboard = $.NSPasteboard.generalPasteboard;
  pasteboard.clearContents;
  pasteboard.setStringForType($(codes.join("\n")), $.NSPasteboardTypeString);

  const url = openUrl === "1" ? openableUrl(codes[0]) : null;
  if (url && $.NSWorkspace.sharedWorkspace.openURL($.NSURL.URLWithString(url))) return;
  notify(copiedMessage(codes));
}
