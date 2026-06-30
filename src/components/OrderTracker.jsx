import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ChefHat, Bike, MapPin, Clock, ShoppingBag, Phone, User } from 'lucide-react';
import './OrderTracker.css';

import { getFirestoreHelpers } from '../firebase';
import { buildCancelledOrderUpdate } from '../utils/orderCancellation';

const normalizeOrderIdentifier = (value) => value === undefined || value === null ? '' : String(value).trim();

export default function OrderTracker({ orderData, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayOrder, setDisplayOrder] = useState(orderData);

  const isPickup = displayOrder?.serviceType === 'pickup' || (displayOrder?.address && displayOrder.address.includes('Pickup at branch'));

  const getOrderItemCount = () => displayOrder?.items?.reduce((total, item) => total + item.quantity, 0) || 1;
  const computeBaseEstimatedTime = () => {
    const itemCount = getOrderItemCount();
    const prepTime = 10 + itemCount * 4;
    const travelTime = isPickup ? 0 : 12 + Math.min(10, itemCount * 1.3);
    const notesBuffer = displayOrder?.notes ? 3 : 0;
    return Math.max(18, Math.round(prepTime + travelTime + notesBuffer));
  };

  const parseOrderCreatedAt = () => {
    if (!displayOrder?.createdAt) return new Date();
    if (typeof displayOrder.createdAt === 'number') return new Date(displayOrder.createdAt * 1000);
    if (displayOrder.createdAt?.seconds) return new Date(displayOrder.createdAt.seconds * 1000);
    if (typeof displayOrder.createdAt.toDate === 'function') return displayOrder.createdAt.toDate();
    return new Date(displayOrder.createdAt);
  };

  const statusMap = {
    received: 0,
    preparing: 1,
    out: 2,
    delivered: 3,
  };

  const updateStep = (status) => {
    if (statusMap[status] !== undefined) {
      setCurrentStep(statusMap[status]);
    }
  };

  const orderCreatedAt = parseOrderCreatedAt();
  const baseEstimatedTime = computeBaseEstimatedTime();
  const elapsedMinutes = Math.max(0, (currentTime.getTime() - orderCreatedAt.getTime()) / 60000);
  const remainingMinutes = Math.max(0, Math.round(baseEstimatedTime - elapsedMinutes));
  const realtimeEta = currentStep === 3 ? 0 : (!isPickup && currentStep === 2 ? Math.max(0, Math.min(12, remainingMinutes)) : remainingMinutes);
  const etaLabel = isPickup ? 'Ready in approximately' : 'Estimated arrival';
  const etaValue = realtimeEta > 0 ? `${realtimeEta} mins` : 'Any moment';

  const dueTime = new Date(orderCreatedAt.getTime() + baseEstimatedTime * 60_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const deliveredAtLabel = currentStep === 3 ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  // Define steps dynamically based on service type
  const cancelOrderFromUser = async () => {
    if (!displayOrder?.id && !displayOrder?.orderId) return;

    const orderId = displayOrder.id || displayOrder.orderId;
    const localOrders = JSON.parse(localStorage.getItem('ghousia_orders') || '[]');
    const cancelledOrder = buildCancelledOrderUpdate(displayOrder, 'Customer cancelled from tracker', 'customer');
    const existingIndex = localOrders.findIndex((order) => order.id === orderId || order.orderId === orderId);
    const updatedOrders = existingIndex >= 0
      ? localOrders.map((order) => (order.id === orderId || order.orderId === orderId ? cancelledOrder : order))
      : [cancelledOrder, ...localOrders];
    localStorage.setItem('ghousia_orders', JSON.stringify(updatedOrders));
    setDisplayOrder(cancelledOrder);
    window.dispatchEvent(new Event('storage'));

    try {
      const firestore = await getFirestoreHelpers();
      const { doc, updateDoc } = firestore;
      const db = firestore.db;
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        cancellationReason: 'Customer cancelled from tracker',
        cancelledBy: 'customer',
        cancelledAt: cancelledOrder.cancelledAt,
      });
    } catch (error) {
      console.warn('Could not cancel order from the tracker.', error);
    }
  };

  const steps = [
    { id: 0, label: 'Order Received', icon: CheckCircle, desc: 'We have received your order.' },
    { id: 1, label: 'Preparing Food', icon: ChefHat, desc: 'The kitchen is preparing your delicious meal.' },
    { 
      id: 2, 
      label: isPickup ? 'Ready for Pickup' : 'Out for Delivery', 
      icon: isPickup ? ShoppingBag : Bike, 
      desc: isPickup ? 'Your order is ready at the counter!' : 'Rider is on the way to your location.' 
    },
    { 
      id: 3, 
      label: isPickup ? 'Collected' : 'Delivered', 
      icon: MapPin, 
      desc: isPickup ? 'Thank you for collecting your order!' : 'Enjoy your meal!' 
    }
  ];

  // Listen to firestore real-time status updates
  useEffect(() => {
    setDisplayOrder(orderData);
    if (orderData?.status) {
      updateStep(orderData.status);
    }
  }, [orderData]);

  useEffect(() => {
    if (!orderData) return;

    console.debug('OrderTracker:init subscribe for', orderData && (orderData.id || orderData.orderId));

    const timer = setInterval(() => setCurrentTime(new Date()), 15_000);
    let unsubscribe = () => {};
    let isSubscribed = true;

    const listenLocal = () => {
      const orderIdentifier = normalizeOrderIdentifier(orderData.id || orderData.orderId);
      const checkLocal = () => {
        const local = localStorage.getItem('ghousia_orders');
        if (local) {
          const currentOrders = JSON.parse(local);
          const found = currentOrders.find((o) => {
            const normalizedId = normalizeOrderIdentifier(o.id);
            const normalizedOrderId = normalizeOrderIdentifier(o.orderId);
            return normalizedId === orderIdentifier || normalizedOrderId === orderIdentifier;
          });
          if (found && found.status) {
            updateStep(found.status);
            setDisplayOrder(found);
          }
        }
      };

      checkLocal();
      window.addEventListener('storage', checkLocal);
      unsubscribe = () => window.removeEventListener('storage', checkLocal);
    };

    const subscribeToFirestoreOrder = async () => {
      try {
        const firestore = await getFirestoreHelpers();
        const { doc, collection, query, where, limit, getDocs, onSnapshot } = firestore;
        const db = firestore.db;
        const orderIdentifier = orderData.id || orderData.orderId;
        const isTempOrderId = typeof orderData.id === 'string' && (orderData.id.startsWith('order_') || orderData.id.startsWith('temp_'));
        const isNumericOrderId = typeof orderData.id === 'string' && /^[0-9]+$/.test(orderData.id);
        const isOrderIdStub = orderData.id && orderData.orderId && normalizeOrderIdentifier(orderData.id) === normalizeOrderIdentifier(orderData.orderId);

        const subscribeToDoc = (docId) => {
          console.debug('OrderTracker: subscribing to doc', docId);
          unsubscribe = onSnapshot(doc(db, 'orders', docId), (docSnapshot) => {
            if (!isSubscribed) return;
            console.debug('OrderTracker: snapshot for', docId, 'exists?', docSnapshot.exists());
            if (docSnapshot.exists()) {
              const data = { ...docSnapshot.data(), id: docId, orderId: orderData.orderId || orderData.id };
              console.debug('OrderTracker: live data', data.status, data);
              setDisplayOrder(data);
              updateStep(data.status);
            } else if (docId !== orderData.orderId && orderData.orderId) {
              queryByOrderId();
            } else {
              listenLocal();
            }
          }, (error) => {
            console.warn('Firestore order tracker failed. Fallback to LocalStorage.', error);
            listenLocal();
          });
        };

        const getFirestoreOrderIdCandidates = (rawId) => {
          const normalized = normalizeOrderIdentifier(rawId);
          const candidates = [normalized];
          const numeric = Number(normalized);
          if (!Number.isNaN(numeric) && String(numeric) === normalized) {
            candidates.push(numeric);
          }
          return Array.from(new Set(candidates));
        };

        const queryByOrderId = async () => {
          if (!orderData.orderId) {
            listenLocal();
            return;
          }

          const candidates = getFirestoreOrderIdCandidates(orderData.orderId);
          console.debug('OrderTracker: queryByOrderId candidates', candidates);
          for (const candidate of candidates) {
            const orderQuery = query(
              collection(db, 'orders'),
              where('orderId', '==', candidate),
              limit(1)
            );
            const snapshot = await getDocs(orderQuery);
            console.debug('OrderTracker: query result for', candidate, 'found?', !snapshot.empty);
            if (!snapshot.empty) {
              const docSnapshot = snapshot.docs[0];
              const docId = docSnapshot.id;
              subscribeToDoc(docId);
              return;
            }
          }

          listenLocal();
        };

        if (orderData.id && !isTempOrderId && !isOrderIdStub) {
          subscribeToDoc(orderData.id);
          return;
        }

        await queryByOrderId();
      } catch (error) {
        console.warn('Unable to connect tracker to Firestore. Falling back to local order sync.', error);
        listenLocal();
      }
    };

    void subscribeToFirestoreOrder();

    return () => {
      isSubscribed = false;
      unsubscribe();
      clearInterval(timer);
    };
  }, [orderData, isPickup]);

  if (!displayOrder) return null;

  const isCancelled = displayOrder.status === 'cancelled';
  const activeState = isCancelled
    ? { id: 4, label: 'Cancelled', icon: X, desc: 'This order has been cancelled.' }
    : steps[currentStep];

  return (
    <div className="tracker-overlay">
      <div className="tracker-modal glass-premium animate-fade-in-up">
        <div className="tracker-header">
          <h2 className="luxury-title">Order <span>Status</span></h2>
          <p className="tracker-order-id">Order #{displayOrder.orderId}</p>
        </div>

        <div className="tracker-status-highlight">
          <div className="status-icon-pulse">
            <activeState.icon size={48} className="gold-icon" />
          </div>
          <h3>{activeState.label}</h3>
          <p>{activeState.desc}</p>
          
          {!isCancelled && currentStep < 3 && (
            <div className="eta-badge">
              <Clock size={16} /> {etaLabel}: {etaValue} ({dueTime})
            </div>
          )}
        </div>

        <div className="tracker-timeline">
          {steps.map((state, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            let statusClass = '';
            if (isCompleted) statusClass = 'completed';
            if (isActive) statusClass = 'active';
            if (isPending) statusClass = 'pending';

            return (
              <div key={state.id} className={`timeline-step ${statusClass}`}>
                <div className="step-indicator">
                  <div className="step-icon">
                    <state.icon size={20} />
                  </div>
                  {index < steps.length - 1 && <div className="step-line"></div>}
                </div>
                <div className="step-content">
                  <h4>{state.label}</h4>
                </div>
              </div>
            );
          })}
        </div>

        <div className="tracker-footer">
          {isPickup ? (
            <p>Collection Location: <strong>{displayOrder.location || 'Main Branch'}</strong></p>
          ) : (
            <p>Delivering to: <strong>{displayOrder.address}</strong></p>
          )}
          <p>Total Amount: <strong>Rs. {displayOrder.total}</strong></p>
          {displayOrder.status === 'cancelled' ? (
            <div className="rider-info-card">
              <p className="rider-info-title">Order Status</p>
              <p><strong>This order was cancelled.</strong></p>
              {displayOrder.cancellationReason && (
                <p>Reason: {displayOrder.cancellationReason}</p>
              )}
              <p className="cancelled-note">The tracker will stay on this page until you navigate away.</p>
            </div>
          ) : displayOrder.assignedRiderName ? (
            <div className="rider-info-card">
              <p className="rider-info-title">Assigned Rider</p>
              <p><User size={14} className="gold-icon" /> <strong>{displayOrder.assignedRiderName}</strong></p>
              {displayOrder.assignedRiderPhone && (
                <p><Phone size={14} className="gold-icon" /> {displayOrder.assignedRiderPhone}</p>
              )}
              {displayOrder.assignedRiderVehicle && (
                <p><Bike size={14} className="gold-icon" /> {displayOrder.assignedRiderVehicle}</p>
              )}
            </div>
          ) : (
            <p className="rider-info-card">Rider will be assigned shortly.</p>
          )}
          {displayOrder.status === 'cancelled' ? (
            <button type="button" className="btn-outline close-tracker-btn" onClick={onClose}>
              Back to Menu
            </button>
          ) : (
            <>
              <button className="btn-gold close-tracker-btn" onClick={cancelOrderFromUser}>
                Cancel Order
              </button>
              {currentStep === 3 && (
                <p className="delivered-at-text">Delivered at <strong>{deliveredAtLabel}</strong></p>
              )}
              <button className="btn-outline close-tracker-btn" onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
