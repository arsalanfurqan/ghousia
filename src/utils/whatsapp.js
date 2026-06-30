export const buildTrackingLink = ({ orderId, origin = window.location.origin } = {}) => {
  const baseOrigin = origin || window.location.origin;
  return `${baseOrigin}/#/track?orderId=${encodeURIComponent(orderId)}`;
};

const normalizePhoneForWhatsApp = (phone = '') => String(phone || '').trim().replace(/^0/, '92').replace(/[^0-9]/g, '');

export const buildWhatsAppConfirmationUrl = ({ phone, orderId, trackingUrl, customerName, serviceType, total, assignedRiderName, assignedRiderPhone, orderStatus }) => {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  const isDelivery = serviceType !== 'pickup';
  const lines = [
    `Hello ${customerName || 'customer'}!`,
    `Your ${isDelivery ? 'delivery' : 'pickup'} order #${orderId} has been confirmed.`,
    `Order status: ${orderStatus || 'received'}`,
    `Total: Rs. ${total || 0}`,
  ];

  if (isDelivery) {
    if (assignedRiderName || assignedRiderPhone) {
      lines.push(`Assigned rider: ${assignedRiderName || 'To be assigned'} ${assignedRiderPhone ? '(' + assignedRiderPhone + ')' : ''}`);
    } else {
      lines.push('A rider will be assigned shortly.');
    }
  }

  lines.push(`Track your order here: ${trackingUrl}`);
  lines.push('Click the link above to follow the order in real time.');

  const text = lines.join('\n');
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
};

export const buildRiderNotificationUrl = ({ riderPhone, customerName, customerPhone, orderId, trackingUrl, serviceType, orderStatus }) => {
  const normalizedPhone = normalizePhoneForWhatsApp(riderPhone);
  const isDelivery = serviceType !== 'pickup';
  const lines = [
    `Hello rider!`,
    `You have been assigned a ${isDelivery ? 'delivery' : 'pickup'} order #${orderId}.`,
    `Order status: ${orderStatus || 'received'}`,
  ];

  if (customerName) {
    lines.push(`Customer: ${customerName}`);
  }
  if (customerPhone) {
    lines.push(`Customer phone: ${customerPhone}`);
  }
  if (isDelivery) {
    lines.push(`Track the order here: ${trackingUrl}`);
    lines.push('Use this link to navigate directly to the order tracker.');
  }

  const text = lines.join('\n');
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
};
