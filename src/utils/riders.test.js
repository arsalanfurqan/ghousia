import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRiderData, getRiderStatusText } from './riders.js';

test('normalizeRiderData fills defaults and preserves availability', () => {
  const rider = normalizeRiderData({ name: 'Ali', phone: '03001234567' });

  assert.equal(rider.name, 'Ali');
  assert.equal(rider.phone, '03001234567');
  assert.equal(rider.vehicleType, 'Bike');
  assert.equal(rider.location, 'Main Branch');
  assert.equal(rider.available, true);
});

test('getRiderStatusText returns the right labels', () => {
  assert.equal(getRiderStatusText({ available: true }), 'Available');
  assert.equal(getRiderStatusText({ available: false }), 'Busy');
});
