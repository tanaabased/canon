export const DEFAULT_SKILL_NAMESPACE = 'tanaab';
export const SKILL_CONTAINER_IDS = ['standalone', 'codex-plugin', 'openclaw-plugin'];

export function formatSkillContainerIds() {
  return SKILL_CONTAINER_IDS.join(', ');
}

export function getSkillNamespacePrefix(namespace = DEFAULT_SKILL_NAMESPACE) {
  return `${String(namespace).trim().toLowerCase()}-`;
}

export function isPluginSkillContainer(container) {
  return container === 'codex-plugin' || container === 'openclaw-plugin';
}

export function stripSkillNamespace(value, namespace = DEFAULT_SKILL_NAMESPACE) {
  const normalized = String(value ?? '').trim();
  const prefix = getSkillNamespacePrefix(namespace);
  return normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized;
}
