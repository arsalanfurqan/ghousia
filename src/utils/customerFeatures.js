export const PROMO_CODES = {
  WELCOME10: { label: 'WELCOME10', discountPercent: 10, description: '10% off your first order' },
  FRIDAY20: { label: 'FRIDAY20', discountPercent: 20, description: '20% off on Friday orders' },
  GHOUSIA15: { label: 'GHOUSIA15', discountPercent: 15, description: '15% off your order' },
};

export const getLoyaltyPointsForOrder = (orderTotal) => {
  const numericTotal = Number(orderTotal) || 0;
  return Math.floor(numericTotal / 100);
};

export const applyPromoCode = (subtotal, code) => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  const promo = PROMO_CODES[normalizedCode];

  if (!promo) {
    return { discountAmount: 0, totalAfterDiscount: subtotal, promo: null, message: 'Invalid promo code' };
  }

  const discountAmount = Math.round(subtotal * (promo.discountPercent / 100));
  return {
    discountAmount,
    totalAfterDiscount: Math.max(0, subtotal - discountAmount),
    promo,
    message: `${promo.label} applied successfully`,
  };
};

export const updateCustomerProfileAfterOrder = (profile, order) => {
  const currentProfile = profile || { loyaltyPoints: 0, favorites: [], orderHistory: [] };
  const loyaltyPoints = (currentProfile.loyaltyPoints || 0) + getLoyaltyPointsForOrder(order?.total || 0);

  return {
    ...currentProfile,
    loyaltyPoints,
    orderHistory: [
      {
        id: order?.id,
        total: order?.total || 0,
        items: order?.items || [],
        createdAt: new Date().toISOString(),
        status: order?.status || 'received',
        assignedRiderId: order?.assignedRiderId || '',
        assignedRiderName: order?.assignedRiderName || '',
        assignedRiderPhone: order?.assignedRiderPhone || '',
        assignedRiderVehicle: order?.assignedRiderVehicle || '',
        assignedRiderLocation: order?.assignedRiderLocation || '',
      },
      ...(currentProfile.orderHistory || []),
    ].slice(0, 8),
  };
};

export const toggleFavoriteItem = (profile, itemName) => {
  const currentProfile = profile || { loyaltyPoints: 0, favorites: [], orderHistory: [] };
  const favorites = currentProfile.favorites || [];
  const exists = favorites.includes(itemName);

  return {
    ...currentProfile,
    favorites: exists ? favorites.filter((entry) => entry !== itemName) : [...favorites, itemName],
  };
};
