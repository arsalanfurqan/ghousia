export const buildCancelledOrderUpdate = (order = {}, reason = '', cancelledBy = '') => ({
  ...order,
  status: 'cancelled',
  cancellationReason: reason,
  cancelledBy,
  cancelledAt: new Date().toISOString(),
});

export const reopenCancelledOrder = (order = {}) => ({
  ...order,
  status: 'received',
  cancellationReason: '',
  cancelledBy: '',
  cancelledAt: null,
});