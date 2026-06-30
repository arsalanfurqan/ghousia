import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueOrder, getPendingOrders, markOrderSynced, removePendingOrder } from './orderQueue.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

test('enqueueOrder stores pending orders in order of latest-first', () => {
  globalThis.localStorage = createMemoryStorage();
  const storageKey = 'test-pending-orders';

  enqueueOrder({ id: 'order-1', payload: { total: 100 } }, storageKey);
  enqueueOrder({ id: 'order-2', payload: { total: 200 } }, storageKey);

  const pending = getPendingOrders(storageKey);

  assert.equal(pending.length, 2);
  assert.equal(pending[0].id, 'order-2');
  assert.equal(pending[1].id, 'order-1');
});

test('markOrderSynced removes an order from the pending queue', () => {
  globalThis.localStorage = createMemoryStorage();
  const storageKey = 'test-pending-orders-sync';

  enqueueOrder({ id: 'order-3', payload: { total: 300 } }, storageKey);
  markOrderSynced('order-3', 'firestore-3', storageKey);

  const pending = getPendingOrders(storageKey);

  assert.deepEqual(pending, []);
});

test('removePendingOrder removes a specific queued item', () => {
  globalThis.localStorage = createMemoryStorage();
  const storageKey = 'test-pending-orders-delete';

  enqueueOrder({ id: 'order-4', payload: { total: 400 } }, storageKey);
  enqueueOrder({ id: 'order-5', payload: { total: 500 } }, storageKey);
  removePendingOrder('order-4', storageKey);

  const pending = getPendingOrders(storageKey);

  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, 'order-5');
});

test('enqueueOrder can retain a large burst of queued orders', () => {
  globalThis.localStorage = createMemoryStorage();
  const storageKey = 'test-pending-orders-large-burst';

  for (let index = 1; index <= 5000; index += 1) {
    enqueueOrder({ id: `order-${index}`, payload: { total: index } }, storageKey);
  }

  const pending = getPendingOrders(storageKey);

  assert.equal(pending.length, 5000);
  assert.equal(pending[0].id, 'order-5000');
  assert.equal(pending[pending.length - 1].id, 'order-1');
});
