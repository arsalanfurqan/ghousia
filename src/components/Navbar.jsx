import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, ShoppingBag, Utensils, MapPin, Bike } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ onCartClick, cartCount, serviceType, selectedLocation, onChangeLocation }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Menu', href: '#menu' }
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const offset = 80; // height of sticky navbar
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const getPreferenceText = () => {
    if (!serviceType) return 'Choose Location';
    const typeLabel = serviceType === 'pickup' ? 'Pickup' : 'Delivery';
    return `${typeLabel}: ${selectedLocation}`;
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled glass' : ''}`}>
        <div className="navbar-container">
          <a href="#home" className="navbar-logo" onClick={(e) => handleLinkClick(e, '#home')}>
            <span className="logo-icon-wrapper"><Utensils size={28} /></span>
            <span className="logo-text">GHOUSIA</span>
          </a>

          {/* Desktop Navigation Links */}
          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="nav-link" onClick={(e) => handleLinkClick(e, link.href)}>
                  {link.name}
                </a>
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            {serviceType && (
              <button className="location-indicator-btn" onClick={onChangeLocation} title="Change Location Preference">
                {serviceType === 'pickup' ? <ShoppingBag size={14} className="gold-icon" /> : <Bike size={14} className="gold-icon" />}
                <span className="location-text">{getPreferenceText()}</span>
              </button>
            )}
            
            <button className="navbar-cart-btn" onClick={onCartClick} aria-label="Open Cart">
              <ShoppingBag size={20} color="#D4AF37" />
              {cartCount > 0 && <span className="cart-badge-navbar">{cartCount}</span>}
            </button>

            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Navigation Menu">
              {mobileMenuOpen ? <X size={24} color="#D4AF37" /> : <Menu size={24} color="#D4AF37" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'drawer-open' : ''}`}>
        <div className="drawer-overlay" onClick={() => setMobileMenuOpen(false)}></div>
        <div className="drawer-content">
          <div className="drawer-header">
            <div className="drawer-logo">
              <span className="logo-icon-wrapper"><Utensils size={28} /></span>
              <span className="logo-text">GHOUSIA</span>
            </div>
            <button className="drawer-close" onClick={() => setMobileMenuOpen(false)}>
              <X size={24} color="#D4AF37" />
            </button>
          </div>
          <ul className="drawer-links">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} onClick={(e) => handleLinkClick(e, link.href)}>
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="drawer-footer">
            {serviceType && (
              <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileMenuOpen(false); onChangeLocation(); }}>
                {getPreferenceText()}
              </button>
            )}
            <a href="tel:03013631555" className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
              <Phone size={16} /> Call Now
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
