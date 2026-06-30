import React, { useRef, useState } from 'react';
import { Printer, X, Check, Phone, MapPin, User, Clock, Flame, Navigation, MessageCircle, Copy } from 'lucide-react';
import { buildTrackingLink, buildWhatsAppConfirmationUrl } from '../utils/whatsapp';
import './ReceiptModal.css';

export default function ReceiptModal({ isOpen, order, onClose, onTrack }) {
  const receiptRef = useRef();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !order) return null;

  const isPickup = order.serviceType === 'pickup';
  const subtotal = Math.round(order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0);
  const deliveryFee = isPickup ? 0 : 150;
  const total = Math.round(subtotal + deliveryFee);
  const receiptId = order.orderId || (order.id || '').slice(0, 6) || 'N/A';

  const getOrderItemCount = () => order.items?.reduce((sum, item) => sum + item.quantity, 0) || 1;
  const parseOrderCreatedAt = () => {
    if (!order.createdAt) return new Date();
    if (typeof order.createdAt === 'number') return new Date(order.createdAt * 1000);
    if (order.createdAt?.seconds) return new Date(order.createdAt.seconds * 1000);
    if (typeof order.createdAt.toDate === 'function') return order.createdAt.toDate();
    return new Date(order.createdAt);
  };
  const getEstimatedMinutes = () => {
    const itemCount = getOrderItemCount();
    const prepTime = 10 + itemCount * 4;
    const travelTime = isPickup ? 0 : 12 + Math.min(10, itemCount * 1.3);
    const noteBuffer = order.notes ? 3 : 0;
    return Math.max(18, Math.round(prepTime + travelTime + noteBuffer));
  };

  const estimatedMinutes = getEstimatedMinutes();
  const receiptBaseTime = parseOrderCreatedAt();
  const etaDue = new Date(receiptBaseTime.getTime() + estimatedMinutes * 60_000);
  const etaLabel = isPickup ? `Ready in ${estimatedMinutes} mins` : `Arrives in ~${estimatedMinutes} mins`;
  const etaDueLabel = etaDue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const etaDueLine = isPickup ? `Ready by ${etaDueLabel}` : `Expected by ${etaDueLabel}`;

  const getMapsUrl = () => {
    const query = encodeURIComponent(order.location || order.address || 'Ghousia Restaurant Karachi');
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ghousia Restaurant Receipt - #${receiptId}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .dashed { border-top: 1px dashed #555; margin: 8px 0; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            table { width: 100%; margin: 10px 0; border-collapse: collapse; }
            th, td { text-align: left; padding: 6px 0; font-size: 13px; }
            .text-right { text-align: right; }
            .receipt-brand { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
            .receipt-tagline { font-size: 11px; margin-bottom: 2px; color: #333; }
            .receipt-address { font-size: 11px; color: #444; }
            .receipt-meta-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
            .receipt-section-title { font-size: 12px; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 2px; font-weight: bold; }
            .receipt-customer p { margin: 3px 0; font-size: 12px; }
            .totals-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
            .totals-row.grand-total { font-size: 15px; margin-top: 6px; font-weight: bold; }
            .receipt-footer-text { font-size: 11px; margin-top: 8px; color: #333; }
            .receipt-barcode { margin: 15px 0; text-align: center; }
            .service-badge-print {
              display: inline-block;
              padding: 3px 8px;
              border: 1px solid #000;
              font-weight: bold;
              font-size: 12px;
              margin: 5px 0;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenMaps = () => {
    window.open(getMapsUrl(), '_blank', 'noopener,noreferrer');
  };

  const trackingUrl = buildTrackingLink({ orderId: order.orderId || order.id, origin: window.location.origin });
  const whatsappUrl = buildWhatsAppConfirmationUrl({
    phone: order.phone,
    orderId: order.orderId || order.id,
    trackingUrl,
    customerName: order.name,
    serviceType: order.serviceType,
    total,
    assignedRiderName: order.assignedRiderName,
    assignedRiderPhone: order.assignedRiderPhone,
    orderStatus: order.status,
  });

  const handleWhatsAppShare = () => {
    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      alert('WhatsApp popup was blocked. Opening WhatsApp in this tab instead.');
      window.location.href = whatsappUrl;
    }
  };

  const handleCopyTrackingLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1600);
    } catch (error) {
      console.warn('Could not copy tracking link automatically.', error);
    }
  };

  return (
    <div className="receipt-overlay">
      <div className="receipt-modal-container glass-premium animate-fade-in-up">
        <button className="receipt-close" onClick={onClose} aria-label="Close Receipt">
          <X size={24} />
        </button>

        {/* Order confirmed header */}
        <div className="receipt-header-top">
          <h2>ORDER CONFIRMED</h2>
          <p className="broadway-status-subtitle">
            {isPickup ? 'Your order is being prepared for self-pickup!' : 'We are preparing your delicious hot meal!'}
          </p>
        </div>

        {/* Pickup / Delivery Visual Process Tracker - 4 Steps */}
        <div className="process-tracker">
          <div className="tracker-step completed">
            <div className="step-number"><Check size={14} /></div>
            <span className="step-label">Placed</span>
          </div>
          <div className="tracker-line completed"></div>
          <div className="tracker-step active">
            <div className="step-number">2</div>
            <span className="step-label">Preparing</span>
          </div>
          <div className="tracker-line"></div>
          <div className="tracker-step">
            <div className="step-number">3</div>
            <span className="step-label">{isPickup ? 'Ready' : 'On Way'}</span>
          </div>
          <div className="tracker-line"></div>
          <div className="tracker-step">
            <div className="step-number">4</div>
            <span className="step-label">{isPickup ? 'Collected' : 'Delivered'}</span>
          </div>
        </div>

        {/* Pickup Alert Details Box if pickup */}
        {isPickup && (
          <div className="pickup-instruction-card">
            <MapPin className="pickup-card-icon" size={20} />
            <div className="pickup-card-info">
              <h4>Pickup Branch Collection</h4>
              <p className="pickup-branch-name">{order.location || 'Main Branch'}</p>
              <p className="pickup-timings"><Clock size={12} /> Ready in <strong>25 - 30 Mins</strong></p>
            </div>
          </div>
        )}

        {/* Paper Receipt Box */}
        <div className="paper-receipt-container">
          <div className="receipt-paper" ref={receiptRef}>
            
            {/* Top Zig-Zag Line Trim is handled by CSS border, print-friendly Header below */}
            <div className="receipt-header text-center">
              <div className="broadway-ticket-logo">
                <span className="logo-main">GHOUSIA</span>
                <span className="logo-sub">PIZZA & GRILL</span>
              </div>
              <p className="receipt-tagline">Broadway Premium Quality Cuisine</p>
              <p className="receipt-address">
                {isPickup ? `Collection Point: ${order.location}` : 'Hussainabad Food Street, Karachi'}
              </p>
              <div className="service-badge-print">
                {isPickup ? 'SELF-PICKUP ORDER' : 'HOME DELIVERY ORDER'}
              </div>
              <div className="receipt-divider"></div>
            </div>

            <div className="receipt-meta">
              <div className="receipt-meta-row">
                <span className="bold">RECEIPT NO:</span>
                <span>#{receiptId}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="bold">DATE/TIME:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="bold">SERVICE MODE:</span>
                <span className={`service-type-badge-text ${isPickup ? 'pickup' : 'delivery'}`}>
                  {isPickup ? 'SELF-PICKUP' : 'HOME DELIVERY'}
                </span>
              </div>
              <div className="receipt-meta-row">
                <span className="bold">ESTIMATED TIME:</span>
                <span>{etaLabel}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="bold">EXPECTED BY:</span>
                <span>{etaDueLine}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="bold">LOCATION:</span>
                <span>{order.location || 'Main Branch'}</span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-customer">
              <h4 className="receipt-section-title">Customer Info</h4>
              <p><User size={12} className="receipt-inline-icon" /> <strong>Name:</strong> {order.name}</p>
              <p><Phone size={12} className="receipt-inline-icon" /> <strong>Phone:</strong> {order.phone || 'N/A'}</p>
              {!isPickup ? (
                <p><MapPin size={12} className="receipt-inline-icon" /> <strong>Address:</strong> {order.address}</p>
              ) : (
                <p><MapPin size={12} className="receipt-inline-icon" /> <strong>Pickup Branch:</strong> {order.location}</p>
              )}
              {order.notes && (
                <p className="receipt-notes"><strong>Note:</strong> "{order.notes}"</p>
              )}
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-items">
              <h4 className="receipt-section-title">Ordered Items</h4>
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th className="text-center" style={{ width: '45px' }}>Qty</th>
                    <th className="text-right" style={{ width: '90px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td className="text-center">x{item.quantity}</td>
                      <td className="text-right">Rs. {Math.round(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-totals">
              <div className="totals-row">
                <span>Subtotal:</span>
                <span>Rs. {subtotal}</span>
              </div>
              <div className="totals-row">
                <span>{isPickup ? 'Pickup Handling Fee:' : 'Delivery Fee:'}</span>
                <span>Rs. {deliveryFee}</span>
              </div>
              <div className="receipt-divider dashed"></div>
              <div className="totals-row grand-total bold">
                <span>GRAND TOTAL:</span>
                <span>Rs. {total}</span>
              </div>
            </div>

            <div className="receipt-divider"></div>
            
            {/* Real Barcode Mock */}
            <div className="receipt-barcode text-center">
              <svg className="barcode-svg" style={{ width: '100%', height: '45px', background: 'transparent' }} viewBox="0 0 100 20">
                <rect x="5" y="0" width="2" height="13" fill="black"></rect>
                <rect x="8" y="0" width="1" height="13" fill="black"></rect>
                <rect x="11" y="0" width="3" height="13" fill="black"></rect>
                <rect x="16" y="0" width="1" height="13" fill="black"></rect>
                <rect x="18" y="0" width="2" height="13" fill="black"></rect>
                <rect x="22" y="0" width="4" height="13" fill="black"></rect>
                <rect x="28" y="0" width="1" height="13" fill="black"></rect>
                <rect x="30" y="0" width="2" height="13" fill="black"></rect>
                <rect x="34" y="0" width="3" height="13" fill="black"></rect>
                <rect x="39" y="0" width="1" height="13" fill="black"></rect>
                <rect x="42" y="0" width="2" height="13" fill="black"></rect>
                <rect x="46" y="0" width="4" height="13" fill="black"></rect>
                <rect x="52" y="0" width="1" height="13" fill="black"></rect>
                <rect x="55" y="0" width="2" height="13" fill="black"></rect>
                <rect x="59" y="0" width="3" height="13" fill="black"></rect>
                <rect x="64" y="0" width="1" height="13" fill="black"></rect>
                <rect x="67" y="0" width="2" height="13" fill="black"></rect>
                <rect x="71" y="0" width="4" height="13" fill="black"></rect>
                <rect x="77" y="0" width="1" height="13" fill="black"></rect>
                <rect x="80" y="0" width="2" height="13" fill="black"></rect>
                <rect x="84" y="0" width="3" height="13" fill="black"></rect>
                <rect x="89" y="0" width="1" height="13" fill="black"></rect>
                <rect x="92" y="0" width="2" height="13" fill="black"></rect>
                <text x="50" y="18" fontSize="4" textAnchor="middle" fill="black" fontFamily="monospace" letterSpacing="0.5">
                  *{receiptId}*
                </text>
              </svg>
            </div>
            
            <p className="receipt-footer-text text-center bold">
              {isPickup ? 'PAYMENT MODE: DUE ON COLLECTION' : 'PAYMENT MODE: CASH ON DELIVERY'}
            </p>
            <p className="receipt-footer-text text-center">Thank you for ordering with Ghousia!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions">
          <button className="btn-outline print-btn" onClick={handlePrint}>
            <Printer size={18} /> Print Receipt
          </button>
          <button className="btn-outline" onClick={handleCopyTrackingLink}>
            {copiedLink ? <Check size={18} /> : <Copy size={18} />} {copiedLink ? 'Copied' : 'Copy Link'}
          </button>
          <button className="btn-outline" onClick={handleWhatsAppShare}>
            <MessageCircle size={18} /> WhatsApp
          </button>
          <button className="btn-gold close-btn" onClick={() => { if (onTrack) onTrack(order); }}>
            <Navigation size={18} /> Track Order
          </button>
        </div>
      </div>
    </div>
  );
}
