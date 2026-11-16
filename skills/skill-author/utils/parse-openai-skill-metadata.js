import { YAML } from 'bun';

function stringValues(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, String(entry)]));
}

/**
 * Parse agents/openai.yaml into the string-valued inputs used by skill validation.
 *
 * @param {string} content agents/openai.yaml content.
 * @returns {{dependencyTools: object[], hasDependencyToolsSection: boolean, interfaceValues: object, policyValues: object}} Parsed validation inputs.
 */
export default function parseOpenAiSkillMetadata(content) {
  const parsed = YAML.parse(String(content ?? ''));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Skill metadata must be a YAML mapping.');
  }
  const tools = parsed.dependencies?.tools;
  return {
    dependencyTools: Array.isArray(tools) ? tools.map(stringValues) : [],
    hasDependencyToolsSection: Object.hasOwn(parsed.dependencies ?? {}, 'tools'),
    interfaceValues: stringValues(parsed.interface),
    policyValues: stringValues(parsed.policy),
  };
}
