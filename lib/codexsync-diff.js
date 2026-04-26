import { MAX_DIFF_PREVIEW } from './codexsync-context.js';

function contentEquals(leftContent, rightContent) {
  if (leftContent?.equals && rightContent instanceof Uint8Array) {
    return leftContent.equals(rightContent);
  }

  if (rightContent?.equals && leftContent instanceof Uint8Array) {
    return rightContent.equals(leftContent);
  }

  return Object.is(leftContent, rightContent);
}

export function diffEntries(sourceEntries, targetEntries) {
  const changed = [];
  const extra = [];
  const missing = [];

  for (const [relativePath, sourceEntry] of sourceEntries) {
    const targetEntry = targetEntries.get(relativePath);
    if (!targetEntry) {
      missing.push(relativePath);
      continue;
    }

    if (sourceEntry.type !== targetEntry.type) {
      changed.push(relativePath);
      continue;
    }

    if (sourceEntry.type === 'file') {
      const sameMode = sourceEntry.mode === targetEntry.mode;
      const sameContent = contentEquals(sourceEntry.content, targetEntry.content);
      if (!sameMode || !sameContent) {
        changed.push(relativePath);
      }
      continue;
    }

    if (sourceEntry.type === 'symlink' && sourceEntry.target !== targetEntry.target) {
      changed.push(relativePath);
    }
  }

  for (const relativePath of targetEntries.keys()) {
    if (!sourceEntries.has(relativePath)) {
      extra.push(relativePath);
    }
  }

  return { changed, extra, missing };
}

export function hasDiff(diff) {
  return diff.changed.length > 0 || diff.missing.length > 0 || diff.extra.length > 0;
}

export function summarizeDiff(diff) {
  const parts = [];
  if (diff.changed.length > 0) parts.push(`changed ${diff.changed.length}`);
  if (diff.missing.length > 0) parts.push(`missing ${diff.missing.length}`);
  if (diff.extra.length > 0) parts.push(`extra ${diff.extra.length}`);
  return parts.length > 0 ? parts.join(', ') : 'in sync';
}

export function previewPaths(paths, maxPreview = MAX_DIFF_PREVIEW) {
  if (paths.length === 0) {
    return [];
  }

  const preview = paths.slice(0, maxPreview);
  if (paths.length > maxPreview) {
    preview.push(`... ${paths.length - maxPreview} more`);
  }

  return preview;
}
