import test from 'node:test';
import assert from 'node:assert/strict';
import { getTrackingRouteState } from './trackingRoute.js';

test('detects track route with an order id', () => {
  const state = getTrackingRouteState('#/track?orderId=abc123');
  assert.deepEqual(state, { isTrackRoute: true, orderId: 'abc123' });
});

test('ignores non-track routes', () => {
  const state = getTrackingRouteState('#/admin');
  assert.deepEqual(state, { isTrackRoute: false, orderId: null });
});
