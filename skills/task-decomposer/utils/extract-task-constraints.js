const CONSTRAINT_HEADINGS = new Set([
  'alternatives and constraints',
  'constraints',
  'constraints and approvals',
]);

/** Extract constraint sections without interpreting or rewriting their evidence. */
export default function extractTaskConstraints(body = '') {
  const lines = String(body).split(/\r?\n/);
  const constraints = [];

  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^(#{2,6})\s+(.+?)\s*$/);
    if (!heading || !CONSTRAINT_HEADINGS.has(heading[2].trim().toLowerCase())) continue;

    const level = heading[1].length;
    const content = [];
    for (index += 1; index < lines.length; index += 1) {
      const nextHeading = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
      if (nextHeading && nextHeading[1].length <= level) {
        index -= 1;
        break;
      }
      content.push(lines[index]);
    }
    const text = content.join('\n').trim();
    if (text) constraints.push(text);
  }

  return constraints;
}
