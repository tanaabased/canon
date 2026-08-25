export default function normalizeSchemaVisibility(value) {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'all') return 'all';
  if (['org_only', 'organization_only', 'organization_members_only'].includes(normalized)) {
    return 'organization_members_only';
  }
  return normalized || null;
}
