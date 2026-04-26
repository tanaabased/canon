import assert from 'node:assert/strict';

import splitCsv from '../utils/split-csv.js';

describe('utils/split-csv', () => {
  it('should return an empty list for blank input', () => {
    assert.deepEqual(splitCsv(undefined), []);
    assert.deepEqual(splitCsv(''), []);
    assert.deepEqual(splitCsv(' , , '), []);
  });

  it('should split and trim comma-separated values', () => {
    assert.deepEqual(splitCsv('alpha, beta,gamma '), ['alpha', 'beta', 'gamma']);
  });

  it('should flatten array inputs', () => {
    assert.deepEqual(splitCsv(['alpha,beta', ' gamma ']), ['alpha', 'beta', 'gamma']);
  });
});
