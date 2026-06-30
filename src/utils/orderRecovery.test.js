import test from 'node:test';
import assert from 'node:assert/strict';
import { clearPendingReceiptOrder, getPendingReceiptOrder, persistPendingReceiptOrder } from './orderRecovery.js';

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

test('persistPendingReceiptOrder restores the most recent order after refresh', () => {
  const storage = createMemoryStorage();
  const order = { id: 'order-100', total: 450, status: 'received' };

  persistPendingReceiptOrder(order, storage);

  assert.deepEqual(getPendingReceiptOrder(storage), order);

  clearPendingReceiptOrder(storage);

  assert.equal(getPendingReceiptOrder(storage), null);
});

test('persistPendingReceiptOrder expires entries when the ttl is reached', () => {
  const storage = createMemoryStorage();
  const order = { id: 'order-101', total: 500, status: 'received' };

  persistPendingReceiptOrder(order, storage, { ttlMs: 0 });

  assert.equal(getPendingReceiptOrder(storage), null);
});
