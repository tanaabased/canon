import { readFileSync } from 'node:fs';

// Bun expands this macro while bundling the scaffolder.
export function readLargeIconBase64() {
  return readFileSync(new URL('../assets/icon-large.png', import.meta.url), 'base64');
}
