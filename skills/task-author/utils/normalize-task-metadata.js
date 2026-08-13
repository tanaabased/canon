import { COMPLEXITIES, IMPACTS, PRIORITIES, WORK_SIZES } from '../lib/task-author-contract.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizedEnum(value) {
  return typeof value === 'string' ? value.trim().toLowerCase().replaceAll(' ', '-') : value;
}

function validateEnum(values, key, allowed, errors) {
  if (values[key] === null || values[key] === undefined || values[key] === '') {
    delete values[key];
    return;
  }
  values[key] = normalizedEnum(values[key]);
  if (!allowed.includes(values[key])) {
    errors.push(`${key} must be one of: ${allowed.join(', ')}.`);
  }
}

function validateDate(values, key, errors) {
  if (values[key] === null || values[key] === undefined || values[key] === '') {
    delete values[key];
    return;
  }
  const value = String(values[key]).trim();
  const parsed = new Date(`${value}T00:00:00Z`);
  const isExactDate =
    DATE_PATTERN.test(value) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value;
  if (!isExactDate) {
    errors.push(`${key} must be a valid ISO YYYY-MM-DD date.`);
  }
  values[key] = value;
}

/** Normalize canonical task metadata without inventing values for missing evidence. */
export function normalizeTaskMetadata(input = {}) {
  const values = Object.fromEntries(
    ['priority', 'workSize', 'complexity', 'impact', 'startDate', 'targetDate']
      .filter((key) => input?.[key] !== undefined)
      .map((key) => [key, input[key]]),
  );
  const errors = [];

  if (input?.taskScore !== undefined && input.taskScore !== null) {
    errors.push('taskScore is derived from task-score/v1 inputs and may not be supplied directly.');
  }

  validateEnum(values, 'priority', PRIORITIES, errors);
  validateEnum(values, 'complexity', COMPLEXITIES, errors);
  validateEnum(values, 'impact', IMPACTS, errors);

  if (values.workSize === null || values.workSize === undefined || values.workSize === '') {
    delete values.workSize;
  } else {
    values.workSize = Number(values.workSize);
    if (!WORK_SIZES.includes(values.workSize)) {
      errors.push(`workSize must be one of: ${WORK_SIZES.join(', ')}.`);
    }
  }

  validateDate(values, 'startDate', errors);
  validateDate(values, 'targetDate', errors);

  return { errors, values };
}
