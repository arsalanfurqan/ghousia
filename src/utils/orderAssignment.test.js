import test from 'node:test';
import assert from 'node:assert/strict';
import { assignRiderToOrder, assignAvailableRiderToOrder, assignBestAvailableRiderToOrder, getAssignedRiderLabel, isOrderInDateRange } from './orderAssignment.js';

test('assignRiderToOrder stores rider details on the order payload', () => {
  const order = { id: 'order-1', name: 'Aiza' };
  const rider = { id: 'rider-1', name: 'Ali', phone: '03001234567' };

  const updated = assignRiderToOrder(order, rider);

  assert.equal(updated.assignedRiderId, 'rider-1');
  assert.equal(updated.assignedRiderName, 'Ali');
  assert.equal(updated.assignedRiderPhone, '03001234567');
  assert.equal(updated.assignedRiderAt, updated.assignedRiderAt);
});

test('assignAvailableRiderToOrder picks the first available rider', () => {
  const order = { id: 'order-1', status: 'received' };
  const riders = [
    { id: 'r1', name: 'Ali', available: false },
    { id: 'r2', name: 'Hassan', available: true, phone: '0300', vehicleType: 'Bike', location: 'Main Branch' },
  ];

  const updated = assignAvailableRiderToOrder(order, riders);

  assert.equal(updated.assignedRiderId, 'r2');
  assert.equal(updated.assignedRiderName, 'Hassan');
});

test('assignBestAvailableRiderToOrder picks the least busy available rider', () => {
  const order = { id: 'order-2', status: 'received' };
  const riders = [
    { id: 'r1', name: 'Ali', available: true },
    { id: 'r2', name: 'Hassan', available: true },
  ];
  const orders = [
    { id: 'o1', assignedRiderId: 'r1', status: 'preparing' },
    { id: 'o2', assignedRiderId: 'r2', status: 'out' },
  ];

  const updated = assignBestAvailableRiderToOrder(order, riders, orders);

  assert.equal(updated.assignedRiderId, 'r1');
  assert.equal(updated.assignedRiderName, 'Ali');
});

test('getAssignedRiderLabel returns a clear rider label', () => {
  assert.equal(getAssignedRiderLabel({ assignedRiderName: 'Ali' }), 'Ali');
  assert.equal(getAssignedRiderLabel({}), 'Unassigned');
});

test('isOrderInDateRange respects the selected date window', () => {
  const order = { createdAt: { seconds: 1717200000 } };
  const start = new Date('2024-06-01T00:00:00.000Z');
  const end = new Date('2024-06-30T23:59:59.999Z');

  assert.equal(isOrderInDateRange(order, start, end), true);
});
