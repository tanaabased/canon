import skillTypesData from '../references/skill-types.json';

function normalizeTypeDefinition(typeDefinition) {
  return {
    id: typeDefinition.id,
    description: typeDefinition.description,
    defaultCategoryTag: typeDefinition.default_category_tag,
    sectionOrder: typeDefinition.section_order,
    preWorkflowSectionPath: typeDefinition.pre_workflow_section_path,
    postWorkflowSectionPath: typeDefinition.post_workflow_section_path,
  };
}

export const SKILL_TYPES = Object.fromEntries(
  Object.entries(skillTypesData.types).map(([typeId, typeDefinition]) => [
    typeId,
    normalizeTypeDefinition(typeDefinition),
  ]),
);

export const SKILL_TYPE_IDS = Object.keys(SKILL_TYPES);

export function getSkillType(type) {
  return SKILL_TYPES[String(type ?? '').trim().toLowerCase()] ?? null;
}

export function isKnownSkillType(type) {
  return getSkillType(type) !== null;
}

export function formatSkillTypeIds() {
  return SKILL_TYPE_IDS.join(', ');
}
