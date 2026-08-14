function responseValue(element, answer) {
  if (element.type === 'checkboxes') {
    const selected = new Set(Array.isArray(answer) ? answer : []);
    return element.attributes.options
      .map(({ label }) => `- [${selected.has(label) ? 'x' : ' '}] ${label}`)
      .join('\n');
  }
  if (Array.isArray(answer)) return answer.map((value) => `- ${value}`).join('\n');
  if (answer === undefined || answer === null || String(answer).trim() === '') {
    return '_No response_';
  }
  return String(answer).trim();
}

/** Simulate the documented Markdown projection of submitted GitHub form responses. */
export function renderFormSubmission(form, answers = {}) {
  return `${form.body
    .filter(({ type }) => type !== 'markdown')
    .map(
      (element) =>
        `### ${element.attributes.label}\n\n${responseValue(element, answers[element.id])}`,
    )
    .join('\n\n')}\n`;
}
