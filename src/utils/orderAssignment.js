export const assignRiderToOrder = (order = {}, rider = {}) => ({
  ...order,
  assignedRiderId: rider.id || '',
  assignedRiderName: rider.name || '',
  assignedRiderPhone: rider.phone || '',
  assignedRiderVehicle: rider.vehicleType || '',
  assignedRiderLocation: rider.location || '',
  assignedRiderAt: new Date().toISOString(),
});

export const assignAvailableRiderToOrder = (order = {}, riders = []) => {
  const availableRider = riders.find((rider) => rider.available);
  if (!availableRider) return { ...order };
  return assignRiderToOrder(order, availableRider);
};

export const assignBestAvailableRiderToOrder = (order = {}, riders = [], orders = []) => {
  const availableRiders = riders.filter((rider) => rider.available);
  if (!availableRiders.length) return { ...order };

  const riderLoad = availableRiders.reduce((acc, rider) => {
    const activeJobs = orders.filter((candidate) => candidate.assignedRiderId === rider.id && candidate.status !== 'delivered' && candidate.status !== 'cancelled').length;
    acc[rider.id] = activeJobs;
    return acc;
  }, {});

  const bestRider = availableRiders.slice().sort((a, b) => (riderLoad[a.id] || 0) - (riderLoad[b.id] || 0))[0];
  return bestRider ? assignRiderToOrder(order, bestRider) : { ...order };
};

export const getAssignedRiderLabel = (order = {}) =>
  order.assignedRiderName ? order.assignedRiderName : 'Unassigned';

export const isOrderInDateRange = (order = {}, startDate, endDate) => {
  if (!startDate || !endDate) return true;
  const createdAt = order.createdAt;
  const dateValue = createdAt?.seconds
    ? new Date(createdAt.seconds * 1000)
    : createdAt instanceof Date
      ? createdAt
      : new Date(createdAt || Date.now());

  if (Number.isNaN(dateValue.getTime())) return true;
  return dateValue >= startDate && dateValue <= endDate;
};
