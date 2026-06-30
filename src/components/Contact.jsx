import React, { useEffect, useRef } from 'react';
import { MapPin, Phone, MessageSquare, Clock, Mail } from 'lucide-react';
import './Contact.css';

export default function Contact() {
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15 }
    );

    const cards = containerRef.current.querySelectorAll('.reveal');
    cards.forEach((card) => observer.observe(card));

    return () => {
      cards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return (
    <section id="contact" className="contact-section section-padding" ref={containerRef}>
      <div className="container">
        
        <div className="contact-header reveal">
          <h4 className="subtitle">Locate & Connect</h4>
          <h2 className="luxury-title">
            Contact <span>Us</span>
          </h2>
          <p className="contact-intro">
            Visit us in the heart of Karachi's food street or get in touch for takeaway, catering, and home delivery services.
          </p>
        </div>

        <div className="grid-2 contact-grid">
          {/* Left: Contact Info pane */}
          <div className="contact-info-column reveal">
            <div className="contact-card glass-premium">
              <h3>Connect With Us</h3>
              
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon">
                    <MapPin size={20} color="#D4AF37" />
                  </div>
                  <div className="info-text">
                    <h4>Address</h4>
                    <p>Shop 5, Fared Arcade, Near Memon Masjid, Hussainabad, Karachi, Pakistan</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <Phone size={20} color="#D4AF37" />
                  </div>
                  <div className="info-text">
                    <h4>Phone</h4>
                    <p><a href="tel:03013631555">0301-3631555</a></p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <Clock size={20} color="#D4AF37" />
                  </div>
                  <div className="info-text">
                    <h4>Opening Hours</h4>
                    <p>Monday - Sunday: 4:00 PM - 3:00 AM</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <Mail size={20} color="#D4AF37" />
                  </div>
                  <div className="info-text">
                    <h4>Email</h4>
                    <p><a href="mailto:info@ghousiarestaurant.com">info@ghousiarestaurant.com</a></p>
                  </div>
                </div>
              </div>

              {/* Call & WhatsApp Quick Buttons */}
              <div className="contact-action-buttons">
                <a href="tel:03013631555" className="btn-gold contact-btn">
                  <Phone size={16} /> Call Now
                </a>
                <a 
                  href="https://wa.me/923013631555?text=Hi%20Ghousia%20Restaurant,%20I'd%20like%20to%20place%20an%20order." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-outline contact-btn whatsapp-btn"
                >
                  <MessageSquare size={16} /> WhatsApp Us
                </a>
              </div>
            </div>
          </div>

          {/* Right: Map Iframe wrapper */}
          <div className="contact-map-column reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="map-frame-wrapper glass">
              <iframe
                title="Ghousia Restaurant Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3618.138402483863!2d67.0601625!3d24.9273767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33f678457c66d%3A0xe96cf02ad526d11!2sHussainabad%20Food%20Street%20Karachi!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
