# QR Code Scanner Changelog

## [Rewrite] - 2026-09-23

- Decode with the macOS Vision framework instead of `jimp` + `jsQR`; the command bundle drops from
  ~726 KB to ~1 KB and Retina-sized captures decode in well under a second.
- Run capture and decoding in a detached JXA helper, so a scan completes even when the launcher stops
  the command as its window hides.
- Copy every QR / Micro QR code found in the capture, one per line.
- Scan all displays with a single `screencapture` call in _Entire Screen_ mode.
- Convert the command to `no-view`; move to `@raycast/api` 2, TypeScript 6, ESLint 10, pnpm 11 and
  add vitest tests plus CI.

Earlier history lives in the
[upstream extension](https://github.com/raycast/extensions/blob/main/extensions/qr-code-scanner/CHANGELOG.md).
