const DEFAULT_STORAGE_KEY = 'ghousia_pending_orders';
const MAX_QUEUE_SIZE = 5000;
const STORAGE_WRITE_DELAY_MS = 50;

let storageWriteTimer = null;
const pendingStorageWrites = new Map();

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return null;
}

function flushPendingStorageWrites() {
  storageWriteTimer = null;
  pendingStorageWrites.forEach((orders, storageKey) => {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(storageKey, JSON.stringify(orders));
    } catch (error) {
      console.warn('Unable to persist pending orders queue.', error);
    }
  });
  pendingStorageWrites.clear();
}

function schedulePendingStorageWrite(orders, storageKey = DEFAULT_STORAGE_KEY) {
  pendingStorageWrites.set(storageKey, orders);

  if (storageWriteTimer === null) {
    storageWriteTimer = setTimeout(() => {
      flushPendingStorageWrites();
    }, STORAGE_WRITE_DELAY_MS);
  }
}

function readPendingOrders(storageKey = DEFAULT_STORAGE_KEY) {
  const queuedWrite = pendingStorageWrites.get(storageKey);
  if (queuedWrite) {
    return queuedWrite;
  }

  const storage = getStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to read pending orders queue.', error);
    return [];
  }
}

function writePendingOrders(orders, storageKey = DEFAULT_STORAGE_KEY) {
  schedulePendingStorageWrite(orders, storageKey);
}

export function enqueueOrder(order, storageKey = DEFAULT_STORAGE_KEY) {
  const pendingOrders = readPendingOrders(storageKey);
  const normalizedOrder = {
    ...order,
    queuedAt: order.queuedAt || Date.now()
  };

  const nextOrders = [normalizedOrder, ...pendingOrders].slice(0, MAX_QUEUE_SIZE);
  writePendingOrders(nextOrders, storageKey);
  return nextOrders;
}

export function getPendingOrders(storageKey = DEFAULT_STORAGE_KEY) {
  return readPendingOrders(storageKey);
}

export function markOrderSynced(localOrderId, firestoreOrderId, storageKey = DEFAULT_STORAGE_KEY) {
  const pendingOrders = readPendingOrders(storageKey);
  const nextOrders = pendingOrders.filter((order) => order.id !== localOrderId);
  writePendingOrders(nextOrders, storageKey);
  return { firestoreOrderId };
}

export function removePendingOrder(localOrderId, storageKey = DEFAULT_STORAGE_KEY) {
  const pendingOrders = readPendingOrders(storageKey);
  const nextOrders = pendingOrders.filter((order) => order.id !== localOrderId);
  writePendingOrders(nextOrders, storageKey);
  return nextOrders;
}
