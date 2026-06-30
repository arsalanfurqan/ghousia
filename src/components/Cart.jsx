import React, { useState, useMemo } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, Check, Ticket, Sparkles } from 'lucide-react';
import './Cart.css';

export default function Cart({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveFromCart, onClearCart, onOrderPlaced, serviceType, selectedLocation, customerProfile, promoCode, setPromoCode, promoSummary, onApplyPromoCode }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const isPickup = serviceType === 'pickup';
  const subtotal = getSubtotal();
  const deliveryFee = (subtotal > 0 && !isPickup) ? 150 : 0;
  const discountAmount = promoSummary?.discountAmount || 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);
  const loyaltyPoints = useMemo(() => Math.floor(subtotal / 100), [subtotal]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePromoApply = (e) => {
    e.preventDefault();
    onApplyPromoCode?.(promoCode, subtotal);
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || (!isPickup && !formData.address)) {
      alert(isPickup ? 'Please fill in Name and Phone.' : 'Please fill in Name, Phone, and Delivery Address.');
      return;
    }
    
    const finalAddress = isPickup ? `Pickup at branch: ${selectedLocation}` : formData.address;

    const orderData = {
      orderId: String(Math.floor(100000 + Math.random() * 900000)),
      name: formData.name,
      phone: formData.phone,
      address: finalAddress,
      total: total,
      loyaltyPointsEarned: loyaltyPoints,
      promoCodeUsed: promoSummary?.promo?.label || '',
      items: cartItems,
      notes: formData.notes,
      status: 'received'
    };

    onClearCart();
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setShowCheckout(false);
    onClose();

    if (onOrderPlaced) {
      onOrderPlaced(orderData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-container">
      <div className="cart-overlay" onClick={onClose}></div>
      <div className="cart-drawer-content glass-premium">
        
        <div className="cart-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} color="#D4AF37" />
            <h2>Your Cart</h2>
          </div>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close Cart">
            <X size={24} />
          </button>
        </div>

        {orderPlaced ? (
          <div className="order-success-screen">
            <div className="success-icon-badge">
              <Check size={40} color="#111" />
            </div>
            <h3>Order Received!</h3>
            <p>Thank you <strong>{formData.name}</strong>. Your delicious meal is being prepared by our chefs.</p>
            <p className="order-details-tip">{isPickup ? `Pickup Location: ${selectedLocation}` : `Deliver to: ${formData.address}`}</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : (
          <>
            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingBag size={64} className="empty-icon" />
                <p>Your cart is empty.</p>
                <button className="btn-gold" onClick={onClose}>Browse Menu</button>
              </div>
            ) : (
              <div className="cart-body">
                {!showCheckout ? (
                  <>
                    {/* Item list */}
                    <div className="cart-items-list">
                      {cartItems.map((item) => (
                        <div key={item.id} className="cart-item-row">
                          <div className="cart-item-info">
                            <h4>{item.name}</h4>
                            <p className="cart-item-unit-price">Rs. {item.price}</p>
                          </div>
                          
                          <div className="cart-item-controls">
                            <div className="quantity-selector">
                              <button 
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                className="qty-btn"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="qty-value">{item.quantity}</span>
                              <button 
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                className="qty-btn"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="cart-item-total-price">Rs. {item.price * item.quantity}</span>
                            <button 
                              onClick={() => onRemoveFromCart(item.id)} 
                              className="cart-item-delete"
                              aria-label="Delete Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="cart-summary">
                      <div className="summary-row">
                        <span>Subtotal</span>
                        <span>Rs. {subtotal}</span>
                      </div>
                      <div className="summary-row">
                        <span>Delivery Fee ({isPickup ? 'Pickup' : 'Standard'})</span>
                        <span>Rs. {deliveryFee}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="summary-row discount-row">
                          <span>Promo Discount</span>
                          <span>- Rs. {discountAmount}</span>
                        </div>
                      )}
                      <div className="summary-row total-row">
                        <span>Total Amount</span>
                        <span>Rs. {total}</span>
                      </div>
                      <div className="loyalty-banner">
                        <Sparkles size={14} />
                        <span>You’ll earn {loyaltyPoints} loyalty points from this order.</span>
                      </div>
                      <form className="promo-code-form" onSubmit={handlePromoApply}>
                        <div className="promo-code-input-row">
                          <Ticket size={16} />
                          <input
                            type="text"
                            placeholder="WELCOME10"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          />
                        </div>
                        <button type="submit" className="btn-outline promo-apply-btn">Apply</button>
                      </form>
                      {promoSummary && (
                        <div className={`promo-message ${promoSummary.discountAmount > 0 ? 'success' : 'error'}`}>
                          {promoSummary.message}
                        </div>
                      )}
                      <button className="btn-gold checkout-trigger-btn" onClick={() => setShowCheckout(true)}>
                        Proceed to Checkout
                      </button>
                    </div>
                  </>
                ) : (
                  /* Checkout Form */
                  <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                    <h3>{isPickup ? 'Pickup Details' : 'Delivery Details'}</h3>
                    {isPickup && (
                      <div className="pickup-notice-box">
                        <p><strong>Selected Branch:</strong> {selectedLocation}</p>
                        <p className="subtext">Please collect your order within 30-45 minutes after confirmation.</p>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label htmlFor="checkout-name">Name</label>
                      <input
                        type="text"
                        id="checkout-name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="checkout-phone">Phone Number</label>
                      <input
                        type="tel"
                        id="checkout-phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 03013631555"
                        required
                      />
                    </div>
                    
                    {!isPickup && (
                      <div className="form-group">
                        <label htmlFor="checkout-address">Delivery Address</label>
                        <textarea
                          id="checkout-address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="House / Flat #, Street Name, Area"
                          rows="3"
                          required
                        ></textarea>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label htmlFor="checkout-notes">Special Instructions</label>
                      <input
                        type="text"
                        id="checkout-notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder={isPickup ? "e.g. Keep it warm, packing notes" : "e.g. Make it extra spicy, no onions"}
                      />
                    </div>

                    <div className="checkout-actions">
                      <button type="submit" className="btn-gold">
                        Place Order (Rs. {total})
                      </button>
                    </div>
                    {customerProfile && (
                      <div className="checkout-loyalty-box">
                        <strong>Current loyalty points:</strong> {customerProfile.loyaltyPoints || 0}
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
