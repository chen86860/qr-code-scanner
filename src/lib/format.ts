const SAFE_PROTOCOLS = new Set(["http:", "https:", "ftp:", "mailto:"]);
const PREVIEW_LENGTH = 40;

/** The URL a decoded payload should open, or null when it is not a safe web or mail link. */
export function openableUrl(text: string): string | null {
  const value = text.trim();
  if (!value) return null;
  // `host:8080/path` has no scheme, so a colon followed only by a port does not count as one.
  const scheme = /^([a-z][a-z0-9+.-]*):(?!\d+(\/|$))/i.exec(value)?.[1];
  if (scheme) return SAFE_PROTOCOLS.has(`${scheme.toLowerCase()}:`) ? value : null;
  if (/\s/.test(value) || !/^[\w-]+(\.[\w-]+)*\.[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(value)) return null;
  return `https://${value}`;
}

/** The HUD text for what was copied. */
export function copiedMessage(codes: string[]): string {
  const [first = ""] = codes;
  const preview = first.length > PREVIEW_LENGTH ? `${first.slice(0, PREVIEW_LENGTH)}…` : first;
  return codes.length > 1 ? `Copied ${codes.length} codes: ${preview}` : `Copied: ${preview}`;
}
