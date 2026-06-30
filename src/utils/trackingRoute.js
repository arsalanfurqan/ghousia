export const getTrackingRouteState = (hash = window.location.hash) => {
  const rawHash = typeof hash === 'string' && hash.startsWith('#') ? hash.slice(1) : (hash || '');
  const [pathPart = '', queryPart = ''] = rawHash.split('?');
  const normalizedPath = pathPart.replace(/^\//, '').toLowerCase();

  if (normalizedPath !== 'track') {
    return { isTrackRoute: false, orderId: null };
  }

  const params = new URLSearchParams(queryPart);
  return {
    isTrackRoute: true,
    orderId: params.get('orderId') || '',
  };
};
