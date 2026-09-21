import {
  collectEntries as collectTree,
  inspectTrees,
  syncEntries as syncTree,
} from '@tanaab/codex-tools';

const SELECTION = {
  managedPaths: null,
  excludeNames: ['.DS_Store', '.git', 'node_modules'],
};

// Canon owns the whole-tree policy; Codex Tools owns all filesystem operations.
export function collectEntries(root, options = {}) {
  return collectTree(root, { ...options, ...SELECTION });
}

export function inspectEntries(options) {
  return inspectTrees({ ...options, ...SELECTION });
}

export function syncEntries(options) {
  return syncTree({ ...options, ...SELECTION });
}
