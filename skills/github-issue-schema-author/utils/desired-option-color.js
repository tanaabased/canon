/** Return the canonical GitHub palette color for one select option. */
export function desiredOptionColor(field, optionName) {
  return field.optionColors?.[optionName] ?? 'gray';
}
