import assert from 'node:assert/strict';

import formatSkillValidationReport from '../utils/format-skill-validation-report.js';

describe('skills/skill-author/utils/format-skill-validation-report', () => {
  it('should render status and populated validation groups in stable order', () => {
    const report = formatSkillValidationReport({
      errors: ['missing metadata'],
      manualChecks: ['review scope'],
      skillDir: '/tmp/example',
      warnings: [],
    });

    assert.equal(
      report,
      [
        'skill: /tmp/example',
        'status: failed',
        'errors:',
        '- missing metadata',
        'warnings: none',
        'manual_checks:',
        '- review scope',
      ].join('\n'),
    );
  });
});
