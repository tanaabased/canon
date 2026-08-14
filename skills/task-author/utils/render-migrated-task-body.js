import { renderFallbackMetadata } from './render-fallback-metadata.js';

/** Render a body after verified fallback keys have been removed. */
export function renderMigratedTaskBody(baseBody, fallback, removedKeys = []) {
  const remaining = Object.fromEntries(
    Object.entries(fallback).filter(([key]) => !removedKeys.includes(key)),
  );
  const capsule = renderFallbackMetadata(remaining);
  return capsule
    ? `${String(baseBody).trimEnd()}\n\n${capsule}`
    : `${String(baseBody).trimEnd()}\n`;
}
