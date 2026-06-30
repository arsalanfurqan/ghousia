import React, { useState, useEffect } from 'react';
import { MapPin, Bike, ShoppingBag, Check } from 'lucide-react';
import './LocationServiceModal.css';

const BRANCHES = [
  { id: 'hussainabad', name: 'Main Branch (Hussainabad)', address: 'Hussainabad Food Street, Karachi' },
  { id: 'saddar', name: 'Saddar Branch', address: 'Saddar commercial zone, Rawalpindi' },
  { id: 'bahria', name: 'Bahria Town Branch', address: 'Phase 7, Bahria Town, Rawalpindi' }
];

const DELIVERY_AREAS = [
  { label: 'Hussainabad & Surroundings', value: 'Hussainabad Food Street, Karachi' },
  { label: 'Saddar, Rawalpindi', value: 'Saddar commercial zone, Rawalpindi' },
  { label: 'Chaklala Scheme III', value: 'Chaklala Scheme III, Rawalpindi' },
  { label: 'Bahria Town (Phase 1-8)', value: 'Bahria Town, Rawalpindi' },
  { label: 'DHA Phase I & II', value: 'DHA Phase I & II, Rawalpindi' },
  { label: 'Westridge & Cantonment', value: 'Westridge, Rawalpindi' },
  { label: 'Adyala Road', value: 'Adyala Road, Rawalpindi' }
];

export default function LocationServiceModal({ onSelect, currentService, currentLocation, isOpen, onClose, isForceSelect = false }) {
  const [serviceType, setServiceType] = useState(currentService || 'delivery');
  const [location, setLocation] = useState(currentLocation || '');

  useEffect(() => {
    if (!isOpen) return;
    // Auto-detect on modal open if no location present
    if (!location) {
      detectLocation(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const detectLocation = async (autoConfirm = true) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    const handleSuccess = async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const address = data.display_name || `${latitude}, ${longitude}`;
        setLocation(address);
        setServiceType('delivery');
        if (autoConfirm && onSelect) {
          onSelect({ serviceType: 'delivery', location: address });
          if (onClose) onClose();
        }
      } catch (err) {
        console.error('Reverse geocode failed', err);
        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setLocation(coords);
        if (autoConfirm && onSelect) {
          onSelect({ serviceType: 'delivery', location: coords });
          if (onClose) onClose();
        }
      }
    };

    const handleError = (err) => {
      console.error('Geolocation error', err);
      alert('Unable to detect location automatically. Please select your area.');
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { enableHighAccuracy: true, timeout: 8000 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location) {
      alert('Please choose a branch or delivery area.');
      return;
    }
    onSelect({ serviceType, location });
    if (onClose) onClose();
  };

  const handleOpenMaps = () => {
    const query = encodeURIComponent(location || (serviceType === 'pickup' ? 'Ghousia Restaurant Karachi' : 'Ghousia Restaurant Delivery Area'));
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className={`location-modal-overlay ${isForceSelect ? 'force' : ''}`}>
      <div className="location-modal-content glass-premium animate-fade-in-up">
        {!isForceSelect && onClose && (
          <button className="location-modal-close" onClick={onClose}>&times;</button>
        )}
        <div className="location-modal-header">
          <h2 className="luxury-title">Ghousia <span>Restaurant</span></h2>
          <p className="subtitle">Choose Dining Preference</p>
        </div>

        <form onSubmit={handleSubmit} className="location-form">
          <div className="service-selector">
            <label 
              className={`service-card ${serviceType === 'delivery' ? 'active' : ''}`}
              onClick={() => {
                setServiceType('delivery');
                setLocation('');
              }}
            >
              <input 
                type="radio" 
                name="serviceType" 
                value="delivery" 
                checked={serviceType === 'delivery'} 
                onChange={() => {}} 
                style={{ display: 'none' }}
              />
              <Bike size={32} className="service-icon" />
              <h3>Delivery</h3>
              <p>Delivered fresh to your doorstep (Fee: Rs. 150)</p>
            </label>

            <label 
              className={`service-card ${serviceType === 'pickup' ? 'active' : ''}`}
              onClick={() => {
                setServiceType('pickup');
                setLocation('');
              }}
            >
              <input 
                type="radio" 
                name="serviceType" 
                value="pickup" 
                checked={serviceType === 'pickup'} 
                onChange={() => {}} 
                style={{ display: 'none' }}
              />
              <ShoppingBag size={32} className="service-icon" />
              <h3>Self Pickup</h3>
              <p>Collect direct from our branch (Fee: Rs. 0)</p>
            </label>
          </div>

          <div className="location-selector-group">
            <label htmlFor="location-select">
              <MapPin size={18} className="gold-icon" /> 
              <span>Select {serviceType === 'pickup' ? 'Branch' : 'Delivery Area'}</span>
            </label>
            <select
              id="location-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="location-select-input"
            >
              <option value="" disabled>-- Select location --</option>
              {serviceType === 'pickup' ? (
                BRANCHES.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))
              ) : (
                DELIVERY_AREAS.map(area => (
                  <option key={area.label} value={area.value}>{area.label}</option>
                ))
              )}
            </select>
            <div className="location-inline-actions">
              <button type="button" className="location-detect-inline" onClick={() => detectLocation(true)} title="Detect my location">
                Detect
              </button>
              {location && (
                <button type="button" className="location-map-link" onClick={handleOpenMaps}>
                  Open this location on Google Maps
                </button>
              )}
            </div>
          </div>

          <button type="submit" className="btn-gold confirm-btn">
            Confirm & Start Ordering <Check size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
