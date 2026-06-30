export const normalizeRiderData = (rider = {}) => ({
  id: rider.id || '',
  name: rider.name || 'Rider',
  phone: rider.phone || '',
  vehicleType: rider.vehicleType || 'Bike',
  location: rider.location || 'Main Branch',
  available: rider.available !== false,
  createdAt: rider.createdAt || { seconds: Math.floor(Date.now() / 1000) },
  ...rider,
});

export const getRiderStatusText = (rider = {}) => (rider.available ? 'Available' : 'Busy');
