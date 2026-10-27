/** Darken a #rrggbb colour by `amount` (0..1) so white text on it meets WCAG contrast. */
export function darken(hex: string, amount = 0.25): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount)).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}
