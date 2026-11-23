/**
 * File-size formatting. Latin digits by default for both locales (the
 * Bengali-digits option is a future setting, per the project spec).
 */
const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value)} ${UNITS[unit]}`;
}
