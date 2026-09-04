import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePinChange } from '../lib/memberPin.mjs';

test('accepts a valid PIN change', () => {
  assert.equal(validatePinChange('817204', '390175', '390175'), null);
});

test('requires six numeric digits', () => {
  assert.equal(validatePinChange('12345', '390175', '390175'), 'Current PIN must be exactly 6 digits.');
  assert.equal(validatePinChange('817204', '39A175', '39A175'), 'New PIN must be exactly 6 digits.');
});

test('requires matching, changed, non-obvious new PINs', () => {
  assert.equal(validatePinChange('817204', '390175', '390176'), 'New PINs do not match.');
  assert.equal(validatePinChange('817204', '817204', '817204'), 'Choose a new PIN that is different from your current PIN.');
  assert.equal(validatePinChange('817204', '123456', '123456'), 'Choose a less predictable PIN.');
});
