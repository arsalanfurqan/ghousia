import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdminPageConfig } from './adminViews.js';

test('returns dashboard config for overview section', () => {
  assert.deepEqual(getAdminPageConfig('overview'), {
    id: 'overview',
    label: 'Dashboard',
    title: 'Operations Dashboard',
    description: 'A quick overview of live orders, rider activity, and revenue.',
  });
});

test('returns order page config for orders section', () => {
  assert.deepEqual(getAdminPageConfig('orders'), {
    id: 'orders',
    label: 'Orders',
    title: 'Order Queue',
    description: 'Track every order, update statuses, and assign riders in one place.',
  });
});
