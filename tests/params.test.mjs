import test from 'node:test';
import assert from 'node:assert/strict';
import { numParam } from '../src/core/params.js';

test('numeric URL params: missing -> default, unparsable -> default, never NaN or Infinity', () => {
  assert.equal(numParam('rig', 1, 0, 3, ''), 1);
  assert.equal(numParam('rig', 1, 0, 3, '?rig=abc'), 1);          // was `#define HERO_KEY NaN`: hero shader failed to compile
  assert.equal(numParam('ae', 0.5, 0, 1, '?ae=NaN'), 0.5);         // was a NaN exposure: black frame
  assert.equal(numParam('rain', 1, 0, 4, '?rain=Infinity'), 1);
  assert.equal(numParam('vox', 1, 0, 3, '?vox='), 0);              // empty string is Number('') = 0: an explicit "off"
});
test('numeric URL params are clamped so they cannot size huge allocations', () => {
  assert.equal(numParam('rain', 1, 0, 4, '?rain=1e9'), 4);
  assert.equal(numParam('smoke', 1, 0, 4, '?smoke=-5'), 0);
  assert.equal(numParam('vox', 1, 0, 3, '?vox=0.4'), 0.4);
});
