import { createHash } from 'node:crypto';

/** Bind authorization to one exact JSON-serializable mutation plan. */
export default function planDigest(plan) {
  return `sha256:${createHash('sha256').update(JSON.stringify(plan)).digest('hex')}`;
}
