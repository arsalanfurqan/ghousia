const PENDING_RECEIPT_ORDER_KEY = 'ghousia_pending_receipt_order';
const PENDING_RECEIPT_ORDER_TTL_KEY = 'ghousia_pending_receipt_order_ttl';
const DEFAULT_RECEIPT_TTL_MS = 10 * 60 * 1000;

export const getPendingReceiptOrder = (storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return null;

  try {
    const raw = storage.getItem(PENDING_RECEIPT_ORDER_KEY);
    const ttlRaw = storage.getItem(PENDING_RECEIPT_ORDER_TTL_KEY);
    if (!raw || !ttlRaw) return null;

    const parsed = JSON.parse(raw);
    const ttl = Number(ttlRaw);
    if (!parsed || typeof parsed !== 'object' || !Number.isFinite(ttl) || Date.now() >= ttl) {
      storage.removeItem(PENDING_RECEIPT_ORDER_KEY);
      storage.removeItem(PENDING_RECEIPT_ORDER_TTL_KEY);
      return null;
    }

    return parsed;
  } catch {
    storage.removeItem(PENDING_RECEIPT_ORDER_KEY);
    storage.removeItem(PENDING_RECEIPT_ORDER_TTL_KEY);
    return null;
  }
};

export const persistPendingReceiptOrder = (order, storage = typeof window !== 'undefined' ? window.localStorage : null, options = {}) => {
  if (!storage) return;

  if (!order) {
    storage.removeItem(PENDING_RECEIPT_ORDER_KEY);
    storage.removeItem(PENDING_RECEIPT_ORDER_TTL_KEY);
    return;
  }

  const ttlMs = Number(options.ttlMs ?? DEFAULT_RECEIPT_TTL_MS);
  const expiresAt = Date.now() + ttlMs;
  storage.setItem(PENDING_RECEIPT_ORDER_KEY, JSON.stringify(order));
  storage.setItem(PENDING_RECEIPT_ORDER_TTL_KEY, String(expiresAt));
};

export const clearPendingReceiptOrder = (storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return;
  storage.removeItem(PENDING_RECEIPT_ORDER_KEY);
  storage.removeItem(PENDING_RECEIPT_ORDER_TTL_KEY);
};
