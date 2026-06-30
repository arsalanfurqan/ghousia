import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCancelledOrderUpdate, reopenCancelledOrder } from './orderCancellation.js';

test('buildCancelledOrderUpdate marks the order as cancelled with a reason', () => {
  const updated = buildCancelledOrderUpdate({ id: 'order-1', status: 'received' }, 'Customer changed mind', 'admin');

  assert.equal(updated.status, 'cancelled');
  assert.equal(updated.cancellationReason, 'Customer changed mind');
  assert.equal(updated.cancelledBy, 'admin');
  assert.ok(updated.cancelledAt);
});

test('reopenCancelledOrder restores the order to active state', () => {
  const updated = reopenCancelledOrder({ id: 'order-2', status: 'cancelled', cancellationReason: 'Late', cancelledBy: 'admin' });

  assert.equal(updated.status, 'received');
  assert.equal(updated.cancellationReason, '');
  assert.equal(updated.cancelledBy, '');
  assert.equal(updated.cancelledAt, null);
});
