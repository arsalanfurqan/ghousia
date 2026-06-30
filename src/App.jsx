import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import LoadingScreen from './components/LoadingScreen';
import ScrollProgressBar from './components/ScrollProgressBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DigitalMenu from './components/DigitalMenu';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
const Cart = lazy(() => import('./components/Cart'));
const OrderTracker = lazy(() => import('./components/OrderTracker'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const LocationServiceModal = lazy(() => import('./components/LocationServiceModal'));
const ReceiptModal = lazy(() => import('./components/ReceiptModal'));
import { ShoppingBag } from 'lucide-react';
import { enqueueOrder, getPendingOrders, markOrderSynced } from './utils/orderQueue';
import { assignAvailableRiderToOrder } from './utils/orderAssignment';
import { getTrackingRouteState } from './utils/trackingRoute';
import { applyPromoCode, updateCustomerProfileAfterOrder, toggleFavoriteItem } from './utils/customerFeatures';
import { clearPendingReceiptOrder, getPendingReceiptOrder, persistPendingReceiptOrder } from './utils/orderRecovery';
import './App.css';

const normalizeOrderIdentifier = (value) => value === undefined || value === null ? '' : String(value);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isAdmin, setIsAdmin] = useState(
    window.location.hash === '#admin' || window.location.pathname === '/admin'
  );

  // Startup modal & preference state
  const [serviceType, setServiceType] = useState(() => localStorage.getItem('ghousia_service_type') || '');
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('ghousia_location') || '');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(!localStorage.getItem('ghousia_service_type'));
  
  // Receipt state
  const [placedOrderForReceipt, setPlacedOrderForReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [trackRouteState, setTrackRouteState] = useState(() => getTrackingRouteState());
  const [customerProfile, setCustomerProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ghousia_customer_profile') || 'null') || { loyaltyPoints: 0, favorites: [], orderHistory: [] };
    } catch {
      return { loyaltyPoints: 0, favorites: [], orderHistory: [] };
    }
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoSummary, setPromoSummary] = useState(null);
  const retryDelayRef = useRef(1000);
  const retryTimerRef = useRef(null);
  const isFlushingRef = useRef(false);
  const orderHistoryWriteTimerRef = useRef(null);
  const pendingOrderHistoryRef = useRef(null);

  useEffect(() => {
    const handleHashChange = () => {
      const nextTrackState = getTrackingRouteState(window.location.hash);
      setTrackRouteState(nextTrackState);
      setIsAdmin(window.location.hash === '#admin' || window.location.pathname === '/admin');
      if (!nextTrackState.isTrackRoute) {
        setActiveOrder((current) => current);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    document.body.dataset.theme = 'light';
    localStorage.removeItem('ghousia_dark_mode');
  }, []);

  useEffect(() => {
    const pendingReceiptOrder = getPendingReceiptOrder();
    if (pendingReceiptOrder) {
      setPlacedOrderForReceipt(pendingReceiptOrder);
      setIsReceiptOpen(true);
      setActiveOrder(pendingReceiptOrder);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const revealTimer = window.setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((element) => element.classList.add('active'));
    }, 80);

    return () => {
      window.clearTimeout(revealTimer);
    };
  }, [isLoading]);

  const schedulePersistOrderHistory = useCallback((orders) => {
    pendingOrderHistoryRef.current = orders;

    if (orderHistoryWriteTimerRef.current) {
      return;
    }

    orderHistoryWriteTimerRef.current = window.setTimeout(() => {
      if (pendingOrderHistoryRef.current) {
        localStorage.setItem('ghousia_orders', JSON.stringify(pendingOrderHistoryRef.current));
      }
      orderHistoryWriteTimerRef.current = null;
      window.dispatchEvent(new Event('storage'));
    }, 40);
  }, []);

  const handleLocationSelect = useCallback(({ serviceType: newService, location: newLoc }) => {
    setServiceType(newService);
    setSelectedLocation(newLoc);
    localStorage.setItem('ghousia_service_type', newService);
    localStorage.setItem('ghousia_location', newLoc);
    setIsLocationModalOpen(false);
  }, []);

  const handleAddToCart = useCallback((item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const handleUpdateQuantity = useCallback((id, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(id);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  }, []);

  const handleRemoveFromCart = useCallback((id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setPromoCode('');
    setPromoSummary(null);
  }, []);

  const handleToggleFavorite = useCallback((itemName) => {
    setCustomerProfile((current) => {
      const nextProfile = toggleFavoriteItem(current, itemName);
      localStorage.setItem('ghousia_customer_profile', JSON.stringify(nextProfile));
      return nextProfile;
    });
  }, []);

  const handleApplyPromoCode = useCallback((code, subtotal) => {
    const nextSummary = applyPromoCode(subtotal, code);
    setPromoSummary(nextSummary);
    return nextSummary;
  }, []);

  const flushPendingOrders = useCallback(async () => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;

    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const pendingOrders = getPendingOrders('ghousia_pending_orders');
    if (!pendingOrders.length) {
      retryDelayRef.current = 1000;
      isFlushingRef.current = false;
      return;
    }

    const { getFirestoreHelpers } = await import('./firebase');
    const firestore = await getFirestoreHelpers();
    const { writeBatch, doc, collection, serverTimestamp } = firestore;
    const db = firestore.db;

    const batchSize = Math.min(100, pendingOrders.length);
    const ordersToSync = pendingOrders.slice(0, batchSize);
    const batch = writeBatch(db);
    const syncedOrderIds = [];

    ordersToSync.forEach((order) => {
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        ...order.payload,
        status: 'received',
        createdAt: serverTimestamp()
      });
      syncedOrderIds.push(orderRef.id);
    });

    try {
      await batch.commit();
      ordersToSync.forEach((order, index) => {
        markOrderSynced(order.id, syncedOrderIds[index], 'ghousia_pending_orders');
      });

      retryDelayRef.current = 1000;
      if (pendingOrders.length > batchSize) {
        retryTimerRef.current = window.setTimeout(() => {
          void flushPendingOrders();
        }, 250);
      } else {
        retryTimerRef.current = null;
      }
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      const nextDelay = Math.min(10000, Math.max(1000, retryDelayRef.current * 1.5));
      retryDelayRef.current = nextDelay;
      retryTimerRef.current = window.setTimeout(() => {
        void flushPendingOrders();
      }, nextDelay);
      console.warn('Unable to sync queued orders right now. They will be retried automatically.', error);
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const startupTimer = window.setTimeout(() => {
      void flushPendingOrders();
    }, 250);

    const handleOnline = () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      void flushPendingOrders();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (orderHistoryWriteTimerRef.current) {
        window.clearTimeout(orderHistoryWriteTimerRef.current);
        orderHistoryWriteTimerRef.current = null;
      }
      window.clearTimeout(startupTimer);
      window.removeEventListener('online', handleOnline);
    };
  }, [flushPendingOrders]);

  const handleOrderPlaced = useCallback(async (orderData) => {
    const localId = `order_${Date.now()}`;
    const checkoutTotal = Number(orderData.total || 0);
    const nextProfile = updateCustomerProfileAfterOrder(customerProfile, { ...orderData, id: localId, total: checkoutTotal });
    localStorage.setItem('ghousia_customer_profile', JSON.stringify(nextProfile));
    setCustomerProfile(nextProfile);
    const completeOrderData = {
      ...orderData,
      serviceType: serviceType || 'delivery',
      location: selectedLocation || 'Main Branch',
    };

    const newOrder = {
      ...completeOrderData,
      id: localId,
      orderId: localId,
      status: 'received',
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };

    const availableRiders = JSON.parse(localStorage.getItem('ghousia_riders') || '[]');
    const autoAssignedOrder = assignAvailableRiderToOrder(newOrder, availableRiders);

    const currentLocalOrders = JSON.parse(localStorage.getItem('ghousia_orders') || '[]');
    const nextLocalOrders = [autoAssignedOrder, ...currentLocalOrders];
    schedulePersistOrderHistory(nextLocalOrders);
    localStorage.setItem('ghousia_orders', JSON.stringify(nextLocalOrders));
    window.dispatchEvent(new Event('storage'));

    enqueueOrder({ id: localId, payload: autoAssignedOrder }, 'ghousia_pending_orders');
    persistPendingReceiptOrder(autoAssignedOrder);

    setPlacedOrderForReceipt(autoAssignedOrder);
    setActiveOrder(autoAssignedOrder);
    setIsReceiptOpen(true);

    try {
      const { getFirestoreHelpers } = await import('./firebase');
      const firestore = await getFirestoreHelpers();
      const { addDoc, collection, serverTimestamp } = firestore;
      const db = firestore.db;
      const docRef = await addDoc(collection(db, 'orders'), {
        ...autoAssignedOrder,
        orderId: autoAssignedOrder.orderId || localId,
        status: 'received',
        createdAt: serverTimestamp()
      });

      const updatedLocalOrders = JSON.parse(localStorage.getItem('ghousia_orders') || '[]');
      const finalOrders = updatedLocalOrders.map(o => o.id === localId ? { ...o, id: docRef.id } : o);
      schedulePersistOrderHistory(finalOrders);
      window.dispatchEvent(new Event('storage'));

      markOrderSynced(localId, docRef.id, 'ghousia_pending_orders');

      const syncedOrder = { ...autoAssignedOrder, id: docRef.id, status: 'received', createdAt: newOrder.createdAt };
      persistPendingReceiptOrder(syncedOrder);
      setPlacedOrderForReceipt(syncedOrder);
      setActiveOrder(syncedOrder);
    } catch (error) {
      const nextDelay = Math.min(30000, retryDelayRef.current * 2);
      retryDelayRef.current = nextDelay;
      retryTimerRef.current = window.setTimeout(() => {
        void flushPendingOrders();
      }, nextDelay);
      console.warn('Firestore order creation failed. The order remains queued locally for retry.', error);
      const pendingOrders = getPendingOrders('ghousia_pending_orders');
      if (pendingOrders.length > 0) {
        console.info('Pending orders queued:', pendingOrders.length);
      }
    }
  }, [serviceType, selectedLocation]);

  const handleReceiptClose = useCallback(() => {
    if (placedOrderForReceipt) {
      setActiveOrder(placedOrderForReceipt);
    }
    clearPendingReceiptOrder();
    setIsReceiptOpen(false);
  }, [placedOrderForReceipt]);

  const openOrderTracker = useCallback((order) => {
    const nextOrderId = order?.orderId || order?.id;
    if (nextOrderId) {
      const nextHash = `#/track?orderId=${encodeURIComponent(nextOrderId)}`;
      setTrackRouteState({ isTrackRoute: true, orderId: nextOrderId });
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
      }
    }
    setActiveOrder(order);
    setIsReceiptOpen(false);
    setIsCartOpen(false);
  }, []);

  const closeTracker = useCallback(() => {
    window.history.replaceState(null, '', window.location.pathname);
    setTrackRouteState({ isTrackRoute: false, orderId: '' });
    setActiveOrder(null);
  }, []);

  const cartItemsCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const locationDockText = useMemo(
    () => (serviceType === 'pickup' ? `Pickup: ${selectedLocation}` : `Deliver: ${selectedLocation}`),
    [serviceType, selectedLocation]
  );

  useEffect(() => {
    if (!trackRouteState.isTrackRoute || !trackRouteState.orderId) return;

    const requestedOrderId = normalizeOrderIdentifier(trackRouteState.orderId);
    const localOrders = JSON.parse(localStorage.getItem('ghousia_orders') || '[]');
    const matchedOrder = localOrders.find((order) => {
      const id = normalizeOrderIdentifier(order.id);
      const orderId = normalizeOrderIdentifier(order.orderId);
      return id === requestedOrderId || orderId === requestedOrderId;
    });
    if (matchedOrder) {
      setActiveOrder(matchedOrder);
      return;
    }

    // If not found locally, try Firestore (helps when orders are synced remotely)
    (async () => {
      try {
        const { getFirestoreHelpers } = await import('./firebase');
        const firestore = await getFirestoreHelpers();
        const { collection, query, where, limit, getDocs } = firestore;
        const db = firestore.db;

        const candidates = [requestedOrderId];
        const numeric = Number(requestedOrderId);
        if (!Number.isNaN(numeric) && String(numeric) === requestedOrderId) candidates.push(numeric);

        for (const candidate of Array.from(new Set(candidates))) {
          const q = query(collection(db, 'orders'), where('orderId', '==', candidate), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            const data = { ...docSnap.data(), id: docSnap.id, orderId: requestedOrderId };
            setActiveOrder(data);
            return;
          }
        }
      } catch (error) {
        console.warn('OrderTracker: could not fetch order from Firestore', error);
      }
    })();
  }, [trackRouteState.orderId, trackRouteState.isTrackRoute]);

  return (
    <>
      {isLoading ? (
        <LoadingScreen onFinished={() => setIsLoading(false)} />
      ) : isAdmin ? (
        <Suspense fallback={<div className="loading-suspense">Loading admin...</div>}>
          <AdminDashboard />
        </Suspense>
      ) : trackRouteState.isTrackRoute ? (
        <div className="app-fade-in">
          <Suspense fallback={null}>
            <OrderTracker 
              orderData={activeOrder || { id: trackRouteState.orderId, orderId: trackRouteState.orderId, serviceType: 'delivery', total: 0 }}
              onClose={closeTracker} 
            />
          </Suspense>
        </div>
      ) : (
        <div className="app-fade-in">
          <ScrollProgressBar />
          
          {/* Floating Actions Dock instead of top Navbar */}
          <div className="floating-actions-dock glass">
            <button className="floating-location-indicator-btn" onClick={() => setIsLocationModalOpen(true)} title="Change Location Preference">
              <span className="location-dock-dot"></span>
              <span className="location-dock-text">
                {locationDockText}
              </span>
            </button>
            <div className="dock-separator"></div>
            <button className="floating-cart-indicator-btn" onClick={() => setIsCartOpen(true)} title="Open Cart">
              {cartItemsCount > 0 && <div className="cart-badge-dock">{cartItemsCount}</div>}
              <ShoppingBag size={22} />
            </button>
          </div>

          <main>
            <Hero />
            <DigitalMenu
              onAddToCart={handleAddToCart}
              customerProfile={customerProfile}
              onToggleFavorite={handleToggleFavorite}
            />
          </main>
          <Footer />
          <WhatsAppButton />
          
          <Suspense fallback={null}>
            <Cart 
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onOrderPlaced={handleOrderPlaced}
              serviceType={serviceType}
              selectedLocation={selectedLocation}
              customerProfile={customerProfile}
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              promoSummary={promoSummary}
              onApplyPromoCode={handleApplyPromoCode}
              activeOrder={activeOrder}
              onTrackOrder={openOrderTracker}
            />
          </Suspense>

          <Suspense fallback={null}>
            <LocationServiceModal 
              isOpen={isLocationModalOpen}
              onSelect={handleLocationSelect}
              currentService={serviceType}
              currentLocation={selectedLocation}
              isForceSelect={!serviceType}
              onClose={serviceType ? () => setIsLocationModalOpen(false) : null}
            />
          </Suspense>

          <Suspense fallback={null}>
            <ReceiptModal 
              isOpen={isReceiptOpen}
              order={placedOrderForReceipt}
              onClose={handleReceiptClose}
              onTrack={openOrderTracker}
            />
          </Suspense>

          <Suspense fallback={null}>
            <OrderTracker 
              orderData={activeOrder} 
              onClose={() => setActiveOrder(null)} 
            />
          </Suspense>
        </div>
      )}
    </>
  );
}
