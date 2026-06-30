import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrackingLink, buildWhatsAppConfirmationUrl } from './whatsapp.js';

test('buildTrackingLink includes the order id in the tracking URL', () => {
  const link = buildTrackingLink({ orderId: 123456, origin: 'https://example.com' });
  assert.equal(link, 'https://example.com/#/track?orderId=123456');
});

test('buildWhatsAppConfirmationUrl formats a WhatsApp link with the order summary', () => {
  const link = buildWhatsAppConfirmationUrl({
    phone: '03001234567',
    orderId: 123456,
    trackingUrl: 'https://example.com/#/track?orderId=123456',
    customerName: 'Aiza',
    serviceType: 'delivery',
    total: 1200,
    assignedRiderName: 'Hassan',
    assignedRiderPhone: '03005551234',
    orderStatus: 'received',
  });

  assert.match(link, /https:\/\/wa\.me\/923001234567/);
  assert.match(link, /Order%20status%3A%20received/);
  assert.match(link, /Assigned%20rider%3A%20Hassan/);
  assert.match(link, /03005551234/);
  assert.match(link, /Track%20your%20order/);
});
