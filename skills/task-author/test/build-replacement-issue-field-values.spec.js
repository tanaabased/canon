import assert from 'node:assert/strict';

import { buildReplacementIssueFieldValues } from '../utils/build-replacement-issue-field-values.js';

describe('skills/task-author/utils/build-replacement-issue-field-values', () => {
  it('should preserve observed values while replacing changed and adding new fields', () => {
    const current = [
      {
        issue_field_id: 1,
        data_type: 'single_select',
        value: 101,
        single_select_option: { name: '21' },
      },
      {
        issue_field_id: 2,
        data_type: 'single_select',
        value: 102,
        single_select_option: { name: 'High' },
      },
      { issue_field_id: 3, data_type: 'number', value: 30 },
    ];

    assert.deepEqual(
      buildReplacementIssueFieldValues(current, [
        { field_id: 3, value: 50 },
        { field_id: 4, value: 'Very high' },
      ]),
      [
        { field_id: 1, value: '21' },
        { field_id: 2, value: 'High' },
        { field_id: 3, value: 50 },
        { field_id: 4, value: 'Very high' },
      ],
    );
  });
});
