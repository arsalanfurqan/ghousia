export const adminPages = [
  {
    id: 'overview',
    label: 'Dashboard',
    title: 'Operations Dashboard',
    description: 'A quick overview of live orders, rider activity, and revenue.',
  },
  {
    id: 'orders',
    label: 'Orders',
    title: 'Order Queue',
    description: 'Track every order, update statuses, and assign riders in one place.',
  },
  {
    id: 'riders',
    label: 'Riders',
    title: 'Rider Management',
    description: 'Register riders and mark them available for delivery jobs.',
  },
  {
    id: 'customer-flow',
    label: 'Customer Flow',
    title: 'Customer Flow',
    description: 'WhatsApp confirmation, live tracking, and rider updates in one place.',
  },
];

export const getAdminPageConfig = (pageId) => adminPages.find((page) => page.id === pageId) || adminPages[0];
