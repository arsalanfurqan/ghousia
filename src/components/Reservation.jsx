import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Users } from 'lucide-react';
import './Reservation.css';

export default function Reservation() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: '2'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
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

    const el = containerRef.current.querySelector('.reveal');
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date || !formData.time) {
      alert('Please fill out all fields.');
      return;
    }

    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      date: '',
      time: '',
      guests: '2'
    });
    setSubmitted(false);
  };

  return (
    <section id="reservation" className="reservation-section section-padding" ref={containerRef}>
      <div className="container">
        
        <div className="reservation-container glass-premium reveal">
          <div className="reservation-info-pane">
            <h4 className="subtitle">Reservations</h4>
            <h2 className="luxury-title">Book A <span>Table</span></h2>
            <p className="res-pane-desc">
              Experience the royal tastes of authentic Pakistani and Chinese cuisine. Secure your premium table and avoid wait times.
            </p>
            
            <div className="res-rules">
              <div className="rule-item">
                <span className="gold-bullet"></span>
                <p>For parties larger than 10, please contact us directly via phone.</p>
              </div>
              <div className="rule-item">
                <span className="gold-bullet"></span>
                <p>Reservations are held for a maximum of 15 minutes past the booking time.</p>
              </div>
              <div className="rule-item">
                <span className="gold-bullet"></span>
                <p>Dress code: Smart Casual / Traditional Premium.</p>
              </div>
            </div>
          </div>

          <div className="reservation-form-pane">
            {submitted ? (
              <div className="res-success-message">
                <CheckCircle size={60} color="#D4AF37" className="success-icon" />
                <h3>Booking Confirmed!</h3>
                <p>Thank you <strong>{formData.name}</strong>. Your reservation for <strong>{formData.guests} Guests</strong> on <strong>{formData.date}</strong> at <strong>{formData.time}</strong> is successfully locked.</p>
                <p className="confirmation-note">A confirmation SMS has been sent to {formData.phone}.</p>
                <button className="btn-gold" onClick={handleReset}>Book Another Table</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="res-form">
                
                {/* Name */}
                <div className="form-group">
                  <label htmlFor="name"><User size={16} /> Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="phone"><Phone size={16} /> Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="e.g. 03013631555"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Date / Time */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date"><Calendar size={16} /> Date</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="time"><Clock size={16} /> Time</label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="form-group">
                  <label htmlFor="guests"><Users size={16} /> Number of Guests</label>
                  <select
                    id="guests"
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn-gold submit-btn" disabled={loading}>
                  {loading ? 'Processing Booking...' : 'Reserve Table Now'}
                </button>

              </form>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
