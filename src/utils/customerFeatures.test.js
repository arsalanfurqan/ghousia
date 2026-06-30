import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPromoCode, getLoyaltyPointsForOrder, updateCustomerProfileAfterOrder } from './customerFeatures.js';

test('promo codes calculate the correct discount', () => {
  const result = applyPromoCode(1000, 'WELCOME10');
  assert.equal(result.discountAmount, 100);
  assert.equal(result.totalAfterDiscount, 900);
});

test('loyalty points are earned from the order total', () => {
  assert.equal(getLoyaltyPointsForOrder(1250), 12);
});

test('order history and loyalty points are updated after checkout', () => {
  const profile = { loyaltyPoints: 40, favorites: [], orderHistory: [] };
  const nextProfile = updateCustomerProfileAfterOrder(profile, {
    total: 600,
    id: 'order-1',
    items: [{ name: 'Zinger Burger', quantity: 2 }],
    assignedRiderId: 'rider-1',
    assignedRiderName: 'Ali',
    assignedRiderPhone: '03001234567',
    assignedRiderVehicle: 'Bike',
    assignedRiderLocation: 'Main Branch',
  });

  assert.equal(nextProfile.loyaltyPoints, 46);
  assert.equal(nextProfile.orderHistory.length, 1);
  assert.equal(nextProfile.orderHistory[0].id, 'order-1');
  assert.equal(nextProfile.orderHistory[0].assignedRiderName, 'Ali');
  assert.equal(nextProfile.orderHistory[0].assignedRiderPhone, '03001234567');
});
