# QR Code Scanner

[![CI](https://github.com/chen86860/qr-code-scanner/actions/workflows/ci.yml/badge.svg)](https://github.com/chen86860/qr-code-scanner/actions/workflows/ci.yml)

![Select a QR code on screen, macOS Vision decodes it, and the text lands on your clipboard](media/hero.svg)

A Raycast extension that scans QR codes on your screen. Select an area (or capture every display),
and the decoded text is copied to your clipboard. URLs can optionally be opened right away.

It also runs in Raycast-compatible launchers that execute Raycast extensions.

## Features

- **Native decoding.** Uses the macOS Vision framework instead of a JavaScript image pipeline: a
  full Retina display decodes in under a second, with no image libraries at all (the command bundle
  is about 1 KB).
- **Several codes at once.** Every QR / Micro QR code in the capture is copied, one per line.
- **Survives the launcher.** Capture and decoding run in a detached helper, so the scan finishes even
  when the launcher tears the command down as its window hides (e.g. _Pop to Root Search:
  Immediately_).
- **Safe URL opening.** Only `http`, `https`, `ftp` and `mailto` links, plus bare domains such as
  `example.com/path`, are ever opened; everything else is just copied.

## Preferences

| Preference          | Default   | Description                                                             |
| ------------------- | --------- | ----------------------------------------------------------------------- |
| Capture Mode        | Selection | _Selection_ lets you drag an area; _Entire Screen_ scans every display. |
| Silence Mode        | off       | Skip the shutter sound.                                                 |
| Open URL After Scan | off       | Open a decoded URL instead of only copying it.                          |

## Permissions

macOS asks for **Screen Recording** permission for your launcher the first time you scan
(System Settings → Privacy & Security → Screen & System Audio Recording). Results are reported with
a system notification, so allow notifications for _Script Editor_ if you want to see them.

## How it works

```
Scan QR Code (src/scan-qr-code.ts)
  └─ spawns, detached:  osascript -l JavaScript assets/scan-qr.js <mode> <silence> <openUrl>
                           ├─ /usr/sbin/screencapture  (-i selection, or one file per display)
                           ├─ VNDetectBarcodesRequest  (QR + Micro QR)
                           └─ NSPasteboard / NSWorkspace / notification
```

`assets/scan-qr.js` is plain JavaScript for Automation (JXA) because `osascript` executes it
directly. Its pure helpers are unit-tested from Node; only `run()` touches macOS.

## Development

Requires macOS, Node 22+ and pnpm 11 (`corepack enable`).

```sh
pnpm install
pnpm dev        # ray develop — load it into Raycast
pnpm build      # production build into ./dist (also generates raycast-env.d.ts)
pnpm lint       # ray lint: ESLint + Prettier + manifest checks
pnpm typecheck  # needs raycast-env.d.ts, so run build or dev once first
pnpm test       # vitest
```

## Credits

Based on the [QR Code Scanner](https://github.com/raycast/extensions/tree/main/extensions/qr-code-scanner)
Raycast extension by [StevenRCE0](https://github.com/StevenRCE0) and contributors
(MoienTajik, 0xdhrv), rewritten around macOS Vision.

## License

[MIT](LICENSE)
