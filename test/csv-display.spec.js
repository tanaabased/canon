import assert from 'node:assert/strict';

import csvDisplay from '../utils/csv-display.js';

describe('utils/csv-display', () => {
  it('should join values with a comma and space', () => {
    assert.equal(csvDisplay(['alpha', 'beta']), 'alpha, beta');
  });

  it('should split CSV input before display', () => {
    assert.equal(csvDisplay('alpha,beta'), 'alpha, beta');
  });

  it('should display a fallback for empty values', () => {
    assert.equal(csvDisplay(''), '(none)');
    assert.equal(csvDisplay('', { empty: 'empty' }), 'empty');
  });
});
