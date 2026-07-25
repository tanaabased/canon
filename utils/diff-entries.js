function contentEquals(leftContent, rightContent) {
  if (leftContent?.equals && rightContent instanceof Uint8Array) {
    return leftContent.equals(rightContent);
  }

  if (rightContent?.equals && leftContent instanceof Uint8Array) {
    return rightContent.equals(leftContent);
  }

  return Object.is(leftContent, rightContent);
}

/**
 * Compares normalized managed-tree entry maps.
 *
 * @param {Map<string, object>} sourceEntries Desired source snapshot.
 * @param {Map<string, object>} targetEntries Target snapshot to compare.
 * @returns {{changed: string[], extra: string[], missing: string[]}} Paths grouped by drift type.
 */
export default function diffEntries(sourceEntries, targetEntries) {
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
