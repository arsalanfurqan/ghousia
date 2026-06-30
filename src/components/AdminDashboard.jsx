import React, { useState, useEffect } from 'react';
import { getFirestoreHelpers } from '../firebase';
import { normalizeRiderData, getRiderStatusText } from '../utils/riders';
import { assignRiderToOrder, assignAvailableRiderToOrder, assignBestAvailableRiderToOrder, getAssignedRiderLabel, isOrderInDateRange } from '../utils/orderAssignment';
import { buildCancelledOrderUpdate, reopenCancelledOrder } from '../utils/orderCancellation';
import { buildRiderNotificationUrl } from '../utils/whatsapp';
import { buildTrackingLink } from '../utils/whatsapp';
import { ChefHat, Bike, CheckCircle, Clock, MapPin, Phone, User, ShoppingBag, X, DollarSign, TrendingUp, Plus, Users, LayoutGrid, Package, MessageCircle } from 'lucide-react';
import { adminPages, getAdminPageConfig } from '../utils/adminViews';
import './AdminDashboard.css';

const normalizeOrderId = (value) => value === undefined || value === null ? '' : String(value);
const orderMatches = (order, orderId) => {
  const id = normalizeOrderId(orderId);
  return normalizeOrderId(order.id) === id || normalizeOrderId(order.orderId) === id;
};

const parseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
  if (typeof timestamp === 'number') return new Date(timestamp * 1000);
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  return new Date(timestamp);
};

const normalizeOrderData = (order) => {
  const normalizedId = normalizeOrderId(order.id || order.orderId);
  return {
    ...order,
    id: normalizedId,
    orderId: normalizeOrderId(order.orderId) || normalizedId,
    status: order.status || 'received',
    serviceType: order.serviceType || 'delivery',
    total: order.total || 0,
    items: order.items || [],
    createdAt: order.createdAt || { seconds: Math.floor(Date.now() / 1000) },
  };
};

const formatOrderTime = (order) => {
  const ts = parseTimestamp(order.createdAt);
  return ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
};

const formatOrderDateTime = (order) => {
  const ts = parseTimestamp(order.createdAt);
  return ts ? ts.toLocaleString() : 'Just now';
};

const mergeOrders = (baseOrders, extraOrders) => {
  const merged = [...baseOrders];
  extraOrders.forEach((extra) => {
    const index = merged.findIndex((order) => orderMatches(order, extra.id || extra.orderId));
    if (index >= 0) {
      merged[index] = { ...merged[index], ...extra };
    } else {
      merged.push(extra);
    }
  });
  return merged;
};

const normalizeRiderId = (value) => value === undefined || value === null ? '' : String(value);

const mergeRiders = (baseRiders, extraRiders) => {
  const merged = [...baseRiders];
  extraRiders.forEach((extra) => {
    const index = merged.findIndex((rider) => normalizeRiderId(rider.id) === normalizeRiderId(extra.id));
    if (index >= 0) {
      merged[index] = { ...merged[index], ...normalizeRiderData(extra) };
    } else {
      merged.push(normalizeRiderData(extra));
    }
  });
  return merged;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('active'); // 'all', 'active', 'completed'
  const [serviceFilter, setServiceFilter] = useState('all'); // 'all', 'pickup', 'delivery'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState('overview');
  const [riders, setRiders] = useState([]);
  const [riderForm, setRiderForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'Bike',
    location: 'Main Branch',
    available: true,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    
    const loadLocalOrders = () => {
      const local = localStorage.getItem('ghousia_orders');
      if (local) {
        const parsed = JSON.parse(local).map(normalizeOrderData);
        setOrders((currentOrders) => mergeOrders(currentOrders, parsed));
      }
    };

    const subscribeToOrders = async () => {
      try {
        const firestore = await getFirestoreHelpers();
        const { collection, query, orderBy, onSnapshot } = firestore;
        const db = firestore.db;
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const ordersData = [];
          snapshot.forEach((docSnapshot) => {
            ordersData.push(normalizeOrderData({ id: docSnapshot.id, ...docSnapshot.data() }));
          });

          const localOrders = JSON.parse(localStorage.getItem('ghousia_orders') || '[]').map(normalizeOrderData);
          const mergedOrders = mergeOrders(ordersData, localOrders);
          setOrders(mergedOrders);
        }, (error) => {
          console.warn('Firestore snapshot listener permission denied. Using LocalStorage sync.', error);
          loadLocalOrders();
        });
      } catch (e) {
        console.warn('Firestore failed to initialize. Using LocalStorage sync.', e);
        loadLocalOrders();
      }
    };

    void subscribeToOrders();

    window.addEventListener('storage', loadLocalOrders);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', loadLocalOrders);
    };
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    const loadLocalRiders = () => {
      const local = localStorage.getItem('ghousia_riders');
      if (local) {
        const parsed = JSON.parse(local).map(normalizeRiderData);
        setRiders((currentRiders) => mergeRiders(currentRiders, parsed));
      } else {
        setRiders([]);
      }
    };

    const subscribeToRiders = async () => {
      try {
        const firestore = await getFirestoreHelpers();
        const { collection, query, orderBy, onSnapshot } = firestore;
        const db = firestore.db;
        const q = query(collection(db, 'riders'), orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const ridersData = snapshot.docs.map((docSnapshot) => normalizeRiderData({ id: docSnapshot.id, ...docSnapshot.data() }));
          const localRiders = JSON.parse(localStorage.getItem('ghousia_riders') || '[]').map(normalizeRiderData);
          const mergedRiders = mergeRiders(ridersData, localRiders);
          setRiders(mergedRiders);
        }, (error) => {
          console.warn('Firestore rider listener failed. Using local rider sync.', error);
          loadLocalRiders();
        });
      } catch (error) {
        console.warn('Rider sync failed to initialize. Using local rider sync.', error);
        loadLocalRiders();
      }
    };

    void subscribeToRiders();
    window.addEventListener('storage', loadLocalRiders);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', loadLocalRiders);
    };
  }, []);

  const handleRiderInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setRiderForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddRider = async (event) => {
    event.preventDefault();
    const name = riderForm.name.trim();
    const phone = riderForm.phone.trim();

    if (!name || !phone) return;

    const tempRider = normalizeRiderData({
      id: `temp_${Date.now()}`,
      name,
      phone,
      vehicleType: riderForm.vehicleType,
      location: riderForm.location,
      available: riderForm.available,
    });

    const localRiders = JSON.parse(localStorage.getItem('ghousia_riders') || '[]').map(normalizeRiderData);
    const nextLocalRiders = [tempRider, ...localRiders];
    localStorage.setItem('ghousia_riders', JSON.stringify(nextLocalRiders));
    setRiders(nextLocalRiders);
    setRiderForm({ name: '', phone: '', vehicleType: 'Bike', location: 'Main Branch', available: true });

    try {
      const firestore = await getFirestoreHelpers();
      const { addDoc, collection, serverTimestamp } = firestore;
      const db = firestore.db;
      const docRef = await addDoc(collection(db, 'riders'), {
        ...tempRider,
        createdAt: serverTimestamp(),
      });

      const syncedRider = normalizeRiderData({ ...tempRider, id: docRef.id });
      const updatedLocalRiders = nextLocalRiders.map((rider) => (rider.id === tempRider.id ? syncedRider : rider));
      localStorage.setItem('ghousia_riders', JSON.stringify(updatedLocalRiders));
      setRiders(updatedLocalRiders);
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.warn('Could not save rider to Firestore. It remains in local storage.', error);
    }
  };

  const toggleRiderAvailability = async (riderId) => {
    const riderDocId = normalizeRiderId(riderId);
    const currentRider = riders.find((rider) => normalizeRiderId(rider.id) === riderDocId);
    if (!currentRider) return;

    const nextAvailable = !currentRider.available;
    const updatedRiders = riders.map((rider) => (normalizeRiderId(rider.id) === riderDocId ? { ...rider, available: nextAvailable } : rider));
    setRiders(updatedRiders);

    const localRiders = JSON.parse(localStorage.getItem('ghousia_riders') || '[]').map(normalizeRiderData);
    const savedRiders = localRiders.map((rider) => (normalizeRiderId(rider.id) === riderDocId ? { ...rider, available: nextAvailable } : rider));
    localStorage.setItem('ghousia_riders', JSON.stringify(savedRiders));
    window.dispatchEvent(new Event('storage'));

    try {
      const firestore = await getFirestoreHelpers();
      const { doc, updateDoc } = firestore;
      const db = firestore.db;
      await updateDoc(doc(db, 'riders', riderDocId), { available: nextAvailable });
    } catch (error) {
      console.warn('Could not update rider availability in Firestore.', error);
    }
  };

  const openWhatsAppLink = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      alert('WhatsApp popup was blocked. Redirecting the current tab to WhatsApp.');
      window.location.href = url;
    }
  };

  const buildRiderNotificationUrlForOrder = (order) => buildRiderNotificationUrl({
    riderPhone: order.assignedRiderPhone,
    customerName: order.name,
    customerPhone: order.phone,
    orderId: order.orderId || order.id,
    trackingUrl: buildTrackingLink({ orderId: order.orderId || order.id, origin: window.location.origin }),
    serviceType: order.serviceType,
    orderStatus: order.status,
  });

  const handleAssignRider = async (orderId, rider) => {
    const orderDocId = normalizeOrderId(orderId);
    const updatedOrder = assignRiderToOrder(
      orders.find((order) => orderMatches(order, orderDocId)) || {},
      rider
    );

    const nextOrders = orders.map((order) => (orderMatches(order, orderDocId) ? updatedOrder : order));
    setOrders(nextOrders);

    if (selectedOrder && orderMatches(selectedOrder, orderDocId)) {
      setSelectedOrder(updatedOrder);
    }

    const local = JSON.parse(localStorage.getItem('ghousia_orders') || '[]').map(normalizeOrderData);
    const updatedLocalOrders = local.map((order) => (orderMatches(order, orderDocId) ? updatedOrder : order));
    localStorage.setItem('ghousia_orders', JSON.stringify(updatedLocalOrders));
    window.dispatchEvent(new Event('storage'));

    try {
      const firestore = await getFirestoreHelpers();
      const { doc, updateDoc } = firestore;
      const db = firestore.db;
      const resolvedDocId = await resolveFirestoreOrderDocumentId(firestore, orderDocId);
      if (resolvedDocId) {
        await updateDoc(doc(db, 'orders', resolvedDocId), {
          assignedRiderId: updatedOrder.assignedRiderId,
          assignedRiderName: updatedOrder.assignedRiderName,
          assignedRiderPhone: updatedOrder.assignedRiderPhone,
          assignedRiderVehicle: updatedOrder.assignedRiderVehicle,
          assignedRiderLocation: updatedOrder.assignedRiderLocation,
          assignedRiderAt: updatedOrder.assignedRiderAt,
        });
      } else {
        console.warn('Could not persist rider assignment to Firestore: no matching document found for', orderDocId);
      }
    } catch (error) {
      console.warn('Could not persist rider assignment to Firestore.', error);
    }

    if (window.confirm('Send rider WhatsApp notification now?')) {
      const notificationUrl = buildRiderNotificationUrlForOrder(updatedOrder);
      openWhatsAppLink(notificationUrl);
    }
  };

  const resolveFirestoreOrderDocumentId = async (firestore, orderId) => {
    const { collection, doc, getDoc, query, where, getDocs } = firestore;
    const db = firestore.db;
    const candidate = normalizeOrderId(orderId);
    if (!candidate) return null;

    try {
      const directRef = doc(db, 'orders', candidate);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        return candidate;
      }
    } catch {
      // Direct doc lookup failed; fallback to query by orderId field.
    }

    try {
      const q = query(collection(db, 'orders'), where('orderId', '==', String(candidate)));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
    } catch (error) {
      console.warn('Unable to resolve Firestore order document id for', orderId, error);
    }

    return null;
  };

  const updateStatus = async (orderId, newStatus) => {
    const orderDocId = normalizeOrderId(orderId);

    // Optimistically update local state immediately
    setOrders((currentOrders) => currentOrders.map(o => orderMatches(o, orderDocId) ? { ...o, status: newStatus } : o));
    if (selectedOrder && orderMatches(selectedOrder, orderDocId)) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }

    // 1. Try Firestore update
    try {
      const firestore = await getFirestoreHelpers();
      const { doc, updateDoc } = firestore;
      const db = firestore.db;
      const targetDocId = await resolveFirestoreOrderDocumentId(firestore, orderDocId);

      if (targetDocId) {
        await updateDoc(doc(db, 'orders', targetDocId), { status: newStatus });
      } else {
        console.warn('updateStatus: no Firestore document found for', orderId);
      }
    } catch (error) {
      console.warn("Could not update Firestore status (probably security rules):", error);
    }

    // 2. Sync to LocalStorage for cross-tab updates
    const local = localStorage.getItem('ghousia_orders');
    if (local) {
      const currentOrders = JSON.parse(local).map(normalizeOrderData);
      const updated = currentOrders.map(o => {
        if (orderMatches(o, orderDocId)) {
          return { ...o, status: newStatus };
        }
        return o;
      });
      localStorage.setItem('ghousia_orders', JSON.stringify(updated));
      // Notify other tabs
      window.dispatchEvent(new Event('storage'));
    }
  };

  const getStatusIcon = (status, serviceType) => {
    const isPickup = serviceType === 'pickup';
    switch (status) {
      case 'received':
        return <Clock size={20} className="status-received-icon" />;
      case 'preparing':
        return <ChefHat size={20} className="status-preparing-icon" />;
      case 'out':
        return isPickup ? <ShoppingBag size={20} className="status-out-icon" /> : <Bike size={20} className="status-out-icon" />;
      case 'delivered':
        return <CheckCircle size={20} className="status-delivered-icon" />;
      default:
        return <X size={20} />;
    }
  };

  const getStatusLabel = (status, serviceType) => {
    const isPickup = serviceType === 'pickup';
    switch (status) {
      case 'received': return 'Order Received';
      case 'preparing': return 'Preparing Food';
      case 'out': return isPickup ? 'Ready for Pickup' : 'Out for Delivery';
      case 'delivered': return isPickup ? 'Collected' : 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  useEffect(() => {
    if (!selectedOrder) return;
    const matched = orders.find((order) => orderMatches(order, selectedOrder.id || selectedOrder.orderId));
    if (matched) {
      setSelectedOrder(matched);
    }
  }, [orders, selectedOrder]);

  const statusSteps = [
    { key: 'received', label: 'Received' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'out', label: selectedOrder?.serviceType === 'pickup' ? 'Ready for Pickup' : 'Out for Delivery' },
    { key: 'delivered', label: selectedOrder?.serviceType === 'pickup' ? 'Collected' : 'Delivered' }
  ];

  const getOrderRemainingMinutes = (order) => {
    if (!order) return 0;
    const createdAt = parseTimestamp(order.createdAt) || new Date();
    const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    const prepTime = 10 + itemCount * 4;
    const travelTime = order.serviceType === 'pickup' ? 0 : 12 + Math.min(10, itemCount * 1.3);
    const notesBuffer = order.notes ? 3 : 0;
    const baseEstimate = Math.max(18, Math.round(prepTime + travelTime + notesBuffer));
    const elapsed = Math.max(0, Math.round((currentTime.getTime() - createdAt.getTime()) / 60000));
    return Math.max(0, baseEstimate - elapsed);
  };

  const formatOrderEtaLabel = (order) => {
    const remaining = getOrderRemainingMinutes(order);
    if (!order) return '';
    if (order.status === 'delivered') return 'Delivered';
    if (remaining === 0) return 'Any moment';

    // Guard against missing or malformed createdAt
    const createdAtTs = parseTimestamp(order.createdAt) || new Date();
    const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    const prepTime = 10 + itemCount * 4;
    const travelTime = order.serviceType === 'pickup' ? 0 : 12 + Math.min(10, itemCount * 1.3);
    const notesBuffer = order.notes ? 3 : 0;
    const baseEstimate = Math.max(18, Math.round(prepTime + travelTime + notesBuffer));

    const dueTime = new Date(createdAtTs.getTime() + baseEstimate * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${remaining} mins • ${dueTime}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filter === 'all' || 
      (filter === 'active' && order.status !== 'delivered' && order.status !== 'cancelled') ||
      (filter === 'completed' && order.status === 'delivered') ||
      (filter === 'cancelled' && order.status === 'cancelled');

    const matchesService = serviceFilter === 'all' ||
      (serviceFilter === 'pickup' && order.serviceType === 'pickup') ||
      (serviceFilter === 'delivery' && (order.serviceType === 'delivery' || !order.serviceType));

    const startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : null;
    const endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59`) : null;
    const matchesDate = isOrderInDateRange(order, startDate, endDate);
    const haystack = `${order.name || ''} ${order.phone || ''} ${order.address || ''} ${order.orderId || ''} ${order.id || ''}`.toLowerCase();
    const matchesSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());

    return matchesStatus && matchesService && matchesDate && matchesSearch;
  });

  // Quick stats
  const pendingCount = orders.filter(o => o.status === 'received').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const pickupCount = orders.filter(o => o.serviceType === 'pickup' && o.status !== 'delivered').length;
  const deliveryCount = orders.filter((o) => (o.serviceType === 'delivery' || !o.serviceType) && o.status !== 'delivered').length;
  
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pickupRevenue = orders
    .filter(o => o.status === 'delivered' && o.serviceType === 'pickup')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const deliveryRevenue = orders
    .filter(o => o.status === 'delivered' && (o.serviceType === 'delivery' || !o.serviceType))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  const detailStats = {
    preparing: orders.filter(o => o.status === 'preparing').length,
    activeOrders: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length,
    totalDeliveredRevenue: totalRevenue,
    todayEarnings: totalRevenue,
  };

  const unassignedCount = orders.filter((order) => !order.assignedRiderId && order.status !== 'delivered' && order.status !== 'cancelled').length;
  const averageOrderValue = orders.filter((order) => order.status === 'delivered').length
    ? Math.round(totalRevenue / orders.filter((order) => order.status === 'delivered').length)
    : 0;
  const availableRidersCount = riders.filter((rider) => rider.available).length;

  const resetFilters = () => {
    setFilter('active');
    setServiceFilter('all');
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
  };

  const handleAutoAssignRider = async (orderId) => {
    const orderDocId = normalizeOrderId(orderId);
    const availableRider = riders.find((rider) => rider.available);
    if (!availableRider) return;

    const updatedOrder = assignBestAvailableRiderToOrder(
      orders.find((order) => orderMatches(order, orderDocId)) || {},
      riders,
      orders
    );

    const nextOrders = orders.map((order) => (orderMatches(order, orderDocId) ? updatedOrder : order));
    setOrders(nextOrders);

    const local = JSON.parse(localStorage.getItem('ghousia_orders') || '[]').map(normalizeOrderData);
    const updatedLocalOrders = local.map((order) => (orderMatches(order, orderDocId) ? updatedOrder : order));
    localStorage.setItem('ghousia_orders', JSON.stringify(updatedLocalOrders));
    window.dispatchEvent(new Event('storage'));

    try {
      const firestore = await getFirestoreHelpers();
      const { doc, updateDoc } = firestore;
      const db = firestore.db;
      const resolvedDocId = await resolveFirestoreOrderDocumentId(firestore, orderDocId);
      if (resolvedDocId) {
        await updateDoc(doc(db, 'orders', resolvedDocId), {
          assignedRiderId: updatedOrder.assignedRiderId,
          assignedRiderName: updatedOrder.assignedRiderName,
          assignedRiderPhone: updatedOrder.assignedRiderPhone,
          assignedRiderVehicle: updatedOrder.assignedRiderVehicle,
          assignedRiderLocation: updatedOrder.assignedRiderLocation,
          assignedRiderAt: updatedOrder.assignedRiderAt,
        });
      } else {
        console.warn('Could not auto-assign rider to Firestore: no matching document found for', orderDocId);
      }
    } catch (error) {
      console.warn('Could not auto-assign rider to Firestore.', error);
    }
  };

  const handleAutoAssignAllPendingOrders = async () => {
    const pendingOrders = orders.filter((order) => order.status !== 'delivered' && order.status !== 'cancelled' && !order.assignedRiderId);
    for (const order of pendingOrders) {
      const updatedOrder = assignBestAvailableRiderToOrder(order, riders, orders);
      if (updatedOrder.assignedRiderId) {
        const orderDocId = normalizeOrderId(order.id || order.orderId);
        const nextOrders = orders.map((candidate) => (orderMatches(candidate, orderDocId) ? updatedOrder : candidate));
        setOrders(nextOrders);

        const local = JSON.parse(localStorage.getItem('ghousia_orders') || '[]').map(normalizeOrderData);
        const updatedLocalOrders = local.map((candidate) => (orderMatches(candidate, orderDocId) ? updatedOrder : candidate));
        localStorage.setItem('ghousia_orders', JSON.stringify(updatedLocalOrders));
        window.dispatchEvent(new Event('storage'));

        try {
          const firestore = await getFirestoreHelpers();
          const { doc, updateDoc } = firestore;
          const db = firestore.db;
          const resolvedDocId = await resolveFirestoreOrderDocumentId(firestore, orderDocId);
          if (resolvedDocId) {
            await updateDoc(doc(db, 'orders', resolvedDocId), {
              assignedRiderId: updatedOrder.assignedRiderId,
              assignedRiderName: updatedOrder.assignedRiderName,
              assignedRiderPhone: updatedOrder.assignedRiderPhone,
              assignedRiderVehicle: updatedOrder.assignedRiderVehicle,
              assignedRiderLocation: updatedOrder.assignedRiderLocation,
              assignedRiderAt: updatedOrder.assignedRiderAt,
            });
          } else {
            console.warn('Could not auto-assign rider in bulk: no matching document found for', orderDocId);
          }
        } catch (error) {
          console.warn('Could not auto-assign rider in bulk.', error);
        }
      }
    }
  };

  const cancelOrder = async (orderId) => {
    const orderDocId = normalizeOrderId(orderId);
    const baseOrder = orders.find((order) => orderMatches(order, orderDocId)) || {};
    const updatedOrder = buildCancelledOrderUpdate(baseOrder, 'Cancelled from admin dashboard', 'admin');
    const nextOrders = orders.map((order) => (orderMatches(order, orderDocId) ? updatedOrder : order));
    setOrders(nextOrders);

    const local = JSON.parse(localStorage.getItem('ghousia_orders') || '[]').map(normalizeOrderData);
    const existingIndex = local.findIndex((order) => orderMatches(order, orderDocId));
    const updatedLocalOrders = existingIndex >= 0
      ? local.map((order) => (orderMatches(order, orderDocId) ? updatedOrder : order))
      : [updatedOrder, ...local];
    localStorage.setItem('ghousia_orders', JSON.stringify(updatedLocalOrders));
    setSelectedOrder(updatedOrder);
    window.dispatchEvent(new Event('storage'));

    try {
      const firestore = await getFirestoreHelpers();
      const { doc, updateDoc } = firestore;
      const db = firestore.db;
      const resolvedDocId = await resolveFirestoreOrderDocumentId(firestore, orderDocId);
      if (resolvedDocId) {
        await updateDoc(doc(db, 'orders', resolvedDocId), {
          status: 'cancelled',
          cancellationReason: 'Cancelled from admin dashboard',
          cancelledBy: 'admin',
          cancelledAt: updatedOrder.cancelledAt,
        });
      } else {
        console.warn('Could not cancel order in Firestore: no matching document found for', orderDocId);
      }
    } catch (error) {
      console.warn('Could not cancel order in Firestore.', error);
    }
  };

  const reopenOrder = async (orderId) => {
    const orderDocId = normalizeOrderId(orderId);
    const baseOrder = orders.find((order) => orderMatches(order, orderDocId)) || {};
    const updatedOrder = reopenCancelledOrder(baseOrder);
    const nextOrders = orders.map((order) => (orderMatches(order, orderDocId) ? updatedOrder : order));
    setOrders(nextOrders);

    const local = JSON.parse(localStorage.getItem('ghousia_orders') || '[]').map(normalizeOrderData);
    const existingIndex = local.findIndex((order) => orderMatches(order, orderDocId));
    const updatedLocalOrders = existingIndex >= 0
      ? local.map((order) => (orderMatches(order, orderDocId) ? updatedOrder : order))
      : [updatedOrder, ...local];
    localStorage.setItem('ghousia_orders', JSON.stringify(updatedLocalOrders));
    setSelectedOrder(updatedOrder);
    window.dispatchEvent(new Event('storage'));

    try {
      const firestore = await getFirestoreHelpers();
      const { doc, updateDoc } = firestore;
      const db = firestore.db;
      const resolvedDocId = await resolveFirestoreOrderDocumentId(firestore, orderDocId);
      if (resolvedDocId) {
        await updateDoc(doc(db, 'orders', resolvedDocId), {
          status: 'received',
          cancellationReason: '',
          cancelledBy: '',
          cancelledAt: null,
        });
      } else {
        console.warn('Could not reopen order in Firestore: no matching document found for', orderDocId);
      }
    } catch (error) {
      console.warn('Could not reopen order in Firestore.', error);
    }
  };
  const navItems = adminPages.map((page) => ({
    ...page,
    icon: page.id === 'overview' ? LayoutGrid : page.id === 'orders' ? Package : page.id === 'riders' ? Users : MessageCircle,
  }));

  const activePageConfig = getAdminPageConfig(activeSection);

  const switchSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  return (
    <div className="admin-dashboard-container">
      <aside className="admin-sidebar glass">
        <div className="admin-sidebar-brand">
          <ChefHat size={28} className="gold-icon animate-pulse" />
          <div>
            <h2>Ghousia</h2>
            <p>Admin Portal</p>
          </div>
        </div>

        <div className="admin-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`admin-sidebar-btn ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => switchSection(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="admin-sidebar-footer">
          <span className="live-indicator">
            <span className="dot animate-ping"></span> Live Sync
          </span>
          <button className="btn-outline sidebar-ghost-btn" onClick={() => window.location.hash = ''}>
            Go to User Site
          </button>
        </div>
      </aside>

      <main className="admin-main-content">
        <header className="admin-header glass">
          <div className="admin-header-title">
            <ChefHat size={28} className="gold-icon animate-pulse" />
            <h1>{activePageConfig.title} <span>{activePageConfig.description}</span></h1>
          </div>
          <div className="admin-meta">
            <span className="live-indicator">
              <span className="dot animate-ping"></span> Live Real-time Sync
            </span>
          </div>
        </header>

        {activeSection === 'overview' && (
          <div className="admin-page-shell">
            <section id="overview" className="admin-stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon-wrapper red">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">New Orders</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper orange">
            <ChefHat size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Preparing</span>
            <span className="stat-value">{preparingCount}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper gold">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Pickups</span>
            <span className="stat-value">{pickupCount}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper blue">
            <Bike size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Deliveries</span>
            <span className="stat-value">{deliveryCount}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper gold">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Available Riders</span>
            <span className="stat-value">{availableRidersCount}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper orange">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Unassigned Orders</span>
            <span className="stat-value">{unassignedCount}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper blue">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Average Order</span>
            <span className="stat-value">Rs. {averageOrderValue}</span>
          </div>
        </div>

        {/* Earning Cards */}
        <div className="stat-card glass highlight-gold">
          <div className="stat-icon-wrapper gold-bg">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Earnings</span>
            <span className="stat-value">Rs. {totalRevenue}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper gold">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pickup Earnings</span>
            <span className="stat-value text-gold">Rs. {pickupRevenue}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper blue">
            <Bike size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Delivery Earnings</span>
            <span className="stat-value text-blue">Rs. {deliveryRevenue}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper red">
            <X size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Cancelled Orders</span>
            <span className="stat-value">{cancelledCount}</span>
          </div>
        </div>
      </section>
          </div>
        )}

        {activeSection === 'riders' && (
          <div className="admin-page-shell">
            <section id="riders" className="rider-management-panel glass">
        <div className="panel-header">
          <div className="panel-header-row">
            <h2>Rider Management</h2>
            <span className="panel-subtitle">Register riders and mark them available for delivery jobs.</span>
          </div>
        </div>

        <div className="rider-management-grid">
          <form className="rider-form" onSubmit={handleAddRider}>
            <div className="form-field">
              <label htmlFor="rider-name">Rider Name</label>
              <input id="rider-name" name="name" value={riderForm.name} onChange={handleRiderInputChange} placeholder="Enter name" required />
            </div>
            <div className="form-field">
              <label htmlFor="rider-phone">Phone</label>
              <input id="rider-phone" name="phone" value={riderForm.phone} onChange={handleRiderInputChange} placeholder="03XXXXXXXXX" required />
            </div>
            <div className="form-field">
              <label htmlFor="rider-vehicle">Vehicle</label>
              <select id="rider-vehicle" name="vehicleType" value={riderForm.vehicleType} onChange={handleRiderInputChange}>
                <option value="Bike">Bike</option>
                <option value="Car">Car</option>
                <option value="Scooter">Scooter</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="rider-location">Location</label>
              <input id="rider-location" name="location" value={riderForm.location} onChange={handleRiderInputChange} placeholder="Branch / Area" />
            </div>
            <label className="checkbox-field">
              <input type="checkbox" name="available" checked={riderForm.available} onChange={handleRiderInputChange} />
              Available for new orders
            </label>
            <button className="add-rider-btn" type="submit">
              <Plus size={16} /> Add Rider
            </button>
          </form>

          <div className="riders-list">
            {riders.length === 0 ? (
              <div className="no-riders-state">
                <Users size={40} className="muted-icon" />
                <p>No riders registered yet.</p>
              </div>
            ) : (
              riders.map((rider) => (
                <div key={rider.id} className="rider-card">
                  <div className="rider-card-main">
                    <div className="rider-name-row">
                      <h3>{rider.name}</h3>
                      <span className={`rider-status-pill ${rider.available ? 'available' : 'busy'}`}>{getRiderStatusText(rider)}</span>
                    </div>
                    <p><Phone size={14} className="gold-icon" /> {rider.phone || 'No phone number'}</p>
                    <p><Bike size={14} className="gold-icon" /> {rider.vehicleType || 'Bike'} • {rider.location || 'Main Branch'}</p>
                    <p className="rider-assignment-count">Open jobs: {orders.filter((order) => order.assignedRiderId === rider.id && order.status !== 'delivered' && order.status !== 'cancelled').length}</p>
                  </div>
                  <button className={`toggle-rider-btn ${rider.available ? 'busy-btn' : 'available-btn'}`} onClick={() => toggleRiderAvailability(rider.id)}>
                    {rider.available ? 'Mark Busy' : 'Mark Available'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
          </div>
        )}

        {activeSection === 'customer-flow' && (
          <div className="admin-page-shell">
            <section id="customer-flow" className="customer-flow-panel glass">
        <div className="panel-header">
          <div className="panel-header-row">
            <h2>Customer Flow</h2>
            <span className="panel-subtitle">WhatsApp confirmation, live tracking, and rider updates in one place.</span>
          </div>
        </div>

        <div className="customer-flow-grid">
          <div className="flow-card">
            <div className="flow-card-icon"><MessageCircle size={18} /></div>
            <div>
              <h3>WhatsApp Confirmation</h3>
              <p>Customers receive a confirmation message with the order number, total, and tracking link as soon as the order is placed.</p>
            </div>
          </div>
          <div className="flow-card">
            <div className="flow-card-icon"><Bike size={18} /></div>
            <div>
              <h3>Live Tracking</h3>
              <p>Order tracking shows the current status and rider details once a rider is assigned to the delivery.</p>
            </div>
          </div>
        </div>
      </section>
          </div>
        )}

        {activeSection === 'orders' && (
          <div className="admin-page-shell">
            <section id="orders" className="admin-main-layout">
        
        {/* Left Side: Orders list */}
        <div className="admin-orders-list-panel glass">
          <div className="panel-header">
            <h2>Order Queue ({filteredOrders.length})</h2>
            
            <div className="filter-controls-group">
              <div className="search-row">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by customer, phone, address or order ID"
                />
                <button className="action-btn received-btn" onClick={() => void handleAutoAssignAllPendingOrders()}>
                  <Users size={16} /> Auto Assign Pending
                </button>
                <button className="btn-outline" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
              <div className="date-filter-row">
                <label>
                  From
                  <input type="date" value={dateRange.start} onChange={(event) => setDateRange((current) => ({ ...current, start: event.target.value }))} />
                </label>
                <label>
                  To
                  <input type="date" value={dateRange.end} onChange={(event) => setDateRange((current) => ({ ...current, end: event.target.value }))} />
                </label>
              </div>
              {/* Status Filters */}
              <div className="filter-tabs">
                <button 
                  className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  Active
                </button>
                <button 
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </button>
                <button 
                  className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setFilter('cancelled')}
                >
                  Cancelled
                </button>
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
              </div>

              {/* Service Filters */}
              <div className="filter-tabs service-filters">
                <button 
                  className={`filter-btn ${serviceFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setServiceFilter('all')}
                >
                  All Services
                </button>
                <button 
                  className={`filter-btn ${serviceFilter === 'pickup' ? 'active' : ''}`}
                  onClick={() => setServiceFilter('pickup')}
                >
                  Pickup
                </button>
                <button 
                  className={`filter-btn ${serviceFilter === 'delivery' ? 'active' : ''}`}
                  onClick={() => setServiceFilter('delivery')}
                >
                  Delivery
                </button>
              </div>
            </div>
          </div>

          <div className="orders-queue-container">
            {filteredOrders.length === 0 ? (
              <div className="no-orders-state">
                <ShoppingBag size={48} className="muted-icon" />
                <p>No orders found in this filter.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`admin-order-card ${selectedOrder?.id === order.id ? 'selected' : ''} ${order.status === 'received' ? 'new-alert' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="card-header-row">
                    <span className="order-number">Order #{order.orderId || order.id.slice(0, 6)}</span>
                    <span className="order-time">
                      {formatOrderTime(order)}
                    </span>
                  </div>
                  
                  <div className="card-customer-info-row">
                    <div className="card-customer-info">
                      <User size={14} className="icon" /> <span>{order.name}</span>
                    </div>
                    <span className={`service-type-tag ${order.serviceType || 'delivery'}`}>
                      {order.serviceType || 'delivery'}
                    </span>
                  </div>
                  
                  <div className="card-details-row">
                    <span className="order-total">Rs. {order.total}</span>
                    <div className={`status-pill ${order.status}`}>
                      {getStatusIcon(order.status, order.serviceType)}
                      <span>{getStatusLabel(order.status, order.serviceType)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Order Detail Panel */}
        <div className="admin-order-detail-panel glass">
          {selectedOrder ? (
            <div className="detail-content animate-fade-in">
              <div className="detail-header-row">
                <div>
                  <h2>Order #{selectedOrder.orderId || selectedOrder.id.slice(0,6)} Details</h2>
                  <p className="detail-timestamp">
                    Placed at: {formatOrderDateTime(selectedOrder)}
                  </p>
                </div>
                <div className={`status-badge ${selectedOrder.status}`}>
                  {getStatusLabel(selectedOrder.status, selectedOrder.serviceType)}
                </div>
              </div>

              <div className="order-progress-flow">
                {statusSteps.map((step, index) => {
                  const activeIndex = statusSteps.findIndex((s) => s.key === selectedOrder.status);
                  const isCompleted = index <= activeIndex;
                  return (
                    <div key={step.key} className={`progress-step ${isCompleted ? 'completed' : ''}`}>
                      <div className="progress-dot"></div>
                      <span>{step.label}</span>
                      {index < statusSteps.length - 1 && <div className={`progress-line ${isCompleted ? 'completed' : ''}`}></div>}
                    </div>
                  );
                })}
              </div>

              <div className="detail-summary-grid">
                <div className="summary-card glass">
                  <span className="summary-label">Preparing Now</span>
                  <span className="summary-value">{detailStats.preparing}</span>
                </div>
                <div className="summary-card glass">
                  <span className="summary-label">Active Orders</span>
                  <span className="summary-value">{detailStats.activeOrders}</span>
                </div>
                <div className="summary-card glass highlight-gold">
                  <span className="summary-label">Delivered Revenue</span>
                  <span className="summary-value">Rs. {detailStats.totalDeliveredRevenue}</span>
                </div>
              </div>

              <div className="detail-eta-box">
                <p><strong>Live ETA:</strong> {formatOrderEtaLabel(selectedOrder)}</p>
              </div>

              {/* Status Action Buttons */}
              <div className="detail-actions-panel">
                <h3>Update Order Status</h3>
                <div className="action-buttons-row">
                  {selectedOrder.status !== 'cancelled' ? (
                    <button className="action-btn received-btn" onClick={() => cancelOrder(selectedOrder.id || selectedOrder.orderId)}>
                      <X size={16} /> Cancel Order
                    </button>
                  ) : (
                    <button className="action-btn preparing-btn" onClick={() => reopenOrder(selectedOrder.id || selectedOrder.orderId)}>
                      <CheckCircle size={16} /> Reopen Order
                    </button>
                  )}
                  <button 
                    className={`action-btn received-btn ${selectedOrder.status === 'received' ? 'active' : ''}`}
                    onClick={() => updateStatus(selectedOrder.id || selectedOrder.orderId, 'received')}
                  >
                    <Clock size={16} /> Received
                  </button>
                  <button 
                    className={`action-btn preparing-btn ${selectedOrder.status === 'preparing' ? 'active' : ''}`}
                    onClick={() => updateStatus(selectedOrder.id || selectedOrder.orderId, 'preparing')}
                  >
                    <ChefHat size={16} /> Prepare Food
                  </button>
                  <button 
                    className={`action-btn out-btn ${selectedOrder.status === 'out' ? 'active' : ''}`}
                    onClick={() => updateStatus(selectedOrder.id || selectedOrder.orderId, 'out')}
                  >
                    {selectedOrder.serviceType === 'pickup' ? (
                      <>
                        <ShoppingBag size={16} /> Ready for Pickup
                      </>
                    ) : (
                      <>
                        <Bike size={16} /> Out with Rider
                      </>
                    )}
                  </button>
                  <button 
                    className={`action-btn delivered-btn ${selectedOrder.status === 'delivered' ? 'active' : ''}`}
                    onClick={() => updateStatus(selectedOrder.id || selectedOrder.orderId, 'delivered')}
                  >
                    <CheckCircle size={16} /> {selectedOrder.serviceType === 'pickup' ? 'Collected' : 'Delivered'}
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div className="detail-section">
                <h3>Delivery Assignment</h3>
                <div className="customer-info-box">
                  <p><strong>Assigned Rider:</strong> {getAssignedRiderLabel(selectedOrder)}</p>
                  {selectedOrder.cancellationReason && (
                    <p><strong>Cancellation:</strong> {selectedOrder.cancellationReason}</p>
                  )}
                  {selectedOrder.assignedRiderPhone && (
                    <p><Phone size={16} className="gold-icon" /> <strong>Phone:</strong> {selectedOrder.assignedRiderPhone}</p>
                  )}
                  {selectedOrder.assignedRiderVehicle && (
                    <p><Bike size={16} className="gold-icon" /> <strong>Vehicle:</strong> {selectedOrder.assignedRiderVehicle}</p>
                  )}
                  <div className="action-buttons-row">
                    {selectedOrder.assignedRiderPhone && selectedOrder.status !== 'cancelled' && (
                      <button type="button" className="action-btn received-btn" onClick={() => openWhatsAppLink(buildRiderNotificationUrlForOrder(selectedOrder))}>
                        <MessageCircle size={16} /> Send Rider WhatsApp
                      </button>
                    )}
                    {selectedOrder.status !== 'cancelled' && !selectedOrder.assignedRiderId && (
                      <button className="action-btn active" onClick={() => handleAutoAssignRider(selectedOrder.id || selectedOrder.orderId)}>
                        <Users size={16} /> Auto Assign Free Rider
                      </button>
                    )}
                    {riders.filter((rider) => rider.available).length === 0 ? (
                      <span className="muted-copy">No riders are currently available.</span>
                    ) : (
                      riders.filter((rider) => rider.available).map((rider) => (
                        <button
                          key={rider.id}
                          className={`action-btn ${selectedOrder.assignedRiderId === rider.id ? 'active' : ''}`}
                          onClick={() => handleAssignRider(selectedOrder.id || selectedOrder.orderId, rider)}
                        >
                          <Users size={16} /> {rider.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="customer-info-box">
                  <p><User size={16} className="gold-icon" /> <strong>Name:</strong> {selectedOrder.name}</p>
                  <p>
                    <Phone size={16} className="gold-icon" /> 
                    <strong>Phone:</strong> <a href={`tel:${selectedOrder.phone}`} className="phone-link">{selectedOrder.phone || 'N/A'}</a>
                  </p>
                  <p>
                    <MapPin size={16} className="gold-icon" /> 
                    <strong>{selectedOrder.serviceType === 'pickup' ? 'Branch Location' : 'Address'}:</strong> 
                    {selectedOrder.address}
                  </p>
                  <p>
                    <ShoppingBag size={16} className="gold-icon" />
                    <strong>Dining Preference:</strong> <span className={`service-type-badge ${selectedOrder.serviceType || 'delivery'}`}>{(selectedOrder.serviceType || 'delivery').toUpperCase()}</span>
                  </p>
                  {selectedOrder.notes && (
                    <p className="special-notes-box">
                      <strong>Special Note:</strong> "{selectedOrder.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="detail-section">
                <h3>Ordered Items</h3>
                <div className="detail-items-table">
                  <div className="table-header">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  <div className="table-body">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="table-row">
                        <span>{item.name}</span>
                        <span>x{item.quantity}</span>
                        <span>Rs. {item.price}</span>
                        <span>Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="detail-total-row">
                  <span>Grand Total (incl. Fee):</span>
                  <span>Rs. {selectedOrder.total}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="no-detail-state">
              <ChefHat size={64} className="muted-icon animate-bounce" />
              <h3>No Order Selected</h3>
              <p>Click on any order in the queue to view full details and update delivery status.</p>
            </div>
          )}
        </div>

      </section>
          </div>
        )}
      </main>
    </div>
  );
}
