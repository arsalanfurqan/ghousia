import React from 'react';
import { MessageCircle, ArrowUp } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLinkClick = (e, id) => {
    e.preventDefault();
    const targetElement = document.querySelector(id);
    if (targetElement) {
      const offset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="footer-container">
      <div className="footer-top container">
        
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <span className="logo-letter">G</span>
            <span className="logo-text">GHOUSIA</span>
          </div>
          <p className="footer-tagline">
            Serving premium authentic Pakistani & Chinese flavors with a luxury touch since 1998 in Hussainabad.
          </p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Youtube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
            <a href="https://wa.me/923013631555" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-col links-col">
          <h3>Quick Links</h3>
          <ul className="footer-links-list">
            <li><a href="#home" onClick={(e) => handleLinkClick(e, '#home')}>Home</a></li>
            <li><a href="#about" onClick={(e) => handleLinkClick(e, '#about')}>About Us</a></li>
            <li><a href="#popular" onClick={(e) => handleLinkClick(e, '#popular')}>Popular Dishes</a></li>
            <li><a href="#menu" onClick={(e) => handleLinkClick(e, '#menu')}>Digital Menu</a></li>
            <li><a href="#reservation" onClick={(e) => handleLinkClick(e, '#reservation')}>Book A Table</a></li>
            <li><a href="#contact" onClick={(e) => handleLinkClick(e, '#contact')}>Contact Us</a></li>
          </ul>
        </div>

        {/* Opening Hours Column */}
        <div className="footer-col hours-col">
          <h3>Opening Hours</h3>
          <ul className="hours-list">
            <li>
              <span className="day">Monday - Thursday</span>
              <span className="time">4:00 PM - 3:00 AM</span>
            </li>
            <li>
              <span className="day">Friday - Sunday</span>
              <span className="time">4:00 PM - 4:00 AM</span>
            </li>
            <li>
              <span className="day">Holidays</span>
              <span className="time">Open All Day</span>
            </li>
          </ul>
        </div>

        {/* Contact Info Footer Column */}
        <div className="footer-col contact-col">
          <h3>Get In Touch</h3>
          <p className="footer-contact-item">Shop 5, Fared Arcade, Hussainabad, Karachi</p>
          <p className="footer-contact-item">Phone: 0301-3631555</p>
          <p className="footer-contact-item">Email: info@ghousiarestaurant.com</p>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <p className="copyright-text">
            © {new Date().getFullYear()} Ghousia Restaurant. All Rights Reserved. Designed for premium tastes.
          </p>
          <button className="scroll-top-btn" onClick={handleScrollToTop} aria-label="Scroll to top">
            <ArrowUp size={16} /> Back To Top
          </button>
        </div>
      </div>
    </footer>
  );
}
