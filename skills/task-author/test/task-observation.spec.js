import assert from 'node:assert/strict';

import {
  normalizeObservedComment,
  normalizeObservedIssueField,
  observedIssueFieldValue,
  observedIssueTypeName,
  observedLabelNames,
  observedWorkSize,
} from '../lib/task-observation.js';

describe('skills/task-author/lib/task-observation', () => {
  it('should normalize issue, label, field, and comment response variants', () => {
    assert.equal(observedIssueTypeName({ type: 'Feature' }), 'Feature');
    assert.equal(observedIssueTypeName({ type: { name: 'Task' } }), 'Task');
    assert.deepEqual(observedLabelNames(['task', { name: 'planning' }, null]), [
      'task',
      'planning',
    ]);
    assert.equal(
      observedIssueFieldValue({ single_select_option: { name: 'High' }, value: 'ignored' }),
      'High',
    );
    assert.deepEqual(
      normalizeObservedComment({
        author: { login: 'pirog' },
        body: 'Evidence',
        createdAt: '2026-08-25T12:00:00Z',
        url: 'https://example.test/comment',
      }),
      {
        author: 'pirog',
        body: 'Evidence',
        createdAt: '2026-08-25T12:00:00Z',
        url: 'https://example.test/comment',
      },
    );
  });

  it('should normalize GitHub field identity and typed value variants', () => {
    assert.deepEqual(
      normalizeObservedIssueField({
        field_id: '42',
        field: { name: 'Work size', data_type: 'number' },
        number_value: 8,
      }),
      { id: 42, name: 'Work size', type: 'number', value: 8 },
    );
    assert.deepEqual(
      normalizeObservedIssueField({
        issue_field_id: 43,
        issue_field_name: 'Impact',
        data_type: 'single_select',
        single_select_option: { name: 'High' },
      }),
      { id: 43, name: 'Impact', type: 'single_select', value: 'High' },
    );
  });

  it('should prefer native Work size while preserving fallback conflicts', () => {
    const fields = [{ name: 'Work size', value: '8' }];

    assert.deepEqual(observedWorkSize(fields, { 'work-size': 5 }), {
      value: 8,
      source: 'native',
      conflict: { native: 8, fallback: 5 },
    });
    assert.deepEqual(observedWorkSize([], { 'work-size': 5 }), {
      value: 5,
      source: 'fallback',
      conflict: null,
    });
    assert.deepEqual(observedWorkSize([], {}), {
      value: null,
      source: 'unavailable',
      conflict: null,
    });
  });
});
