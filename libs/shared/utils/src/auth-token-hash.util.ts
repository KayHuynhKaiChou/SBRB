import { createHash } from 'crypto';

/**
 * Deterministic SHA-256 hash for opaque refresh tokens (UUIDv4).
 * Enables O(1) indexed DB lookup vs the previous O(N) bcrypt scan.
 * Safe for high-entropy random tokens — bcrypt's slow-hash is wasted CPU here.
 *
 * **NODE-ONLY** — uses `crypto.createHash`. Do not import from FE/browser code.
 */
export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

/**
 * Parse duration strings (e.g. "30s", "1m", "7d", "365d") into milliseconds.
 * Inline to avoid @types/ms dependency drama. Throws on invalid input.
 * Browser-safe.
 */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d|y)$/i.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: "${value}". Expected like "30s", "1m", "7d".`);
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const factor: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    y: 31_536_000_000,
  };
  return n * factor[unit];
}
