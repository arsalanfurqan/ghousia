import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import './Reviews.css';

const REVIEWS_DATA = [
  {
    name: 'Ayesha Khan',
    role: 'Food Blogger',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    rating: 5,
    text: 'Ghousia Restaurant has the absolute best Chicken White Karahi in town! The creaminess is perfect, the chicken is exceptionally tender, and the Roghni Kulchas are baked to perfection. A truly premium dining experience.'
  },
  {
    name: 'Zain Malik',
    role: 'Local Guide',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    rating: 5,
    text: 'The Charcoal Grill Charaga is a masterpiece. The smoky flavor paired with their signature spicy dip is addictive. The service is incredibly fast, and the luxury dark theme atmosphere is stunning.'
  },
  {
    name: 'Hamza Siddiqui',
    role: 'Regular Guest',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    rating: 5,
    text: 'Ghousia offers the perfect balance of premium fine dining quality and authentic local flavors. Their Beef Bihari Boti is so tender it melts in your mouth. Extremely clean kitchen and friendly staff!'
  }
];

export default function Reviews() {
  const [current, setCurrent] = useState(0);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % REVIEWS_DATA.length);
    }, 5000); // auto slide every 5 seconds
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + REVIEWS_DATA.length) % REVIEWS_DATA.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % REVIEWS_DATA.length);
  };

  return (
    <section id="reviews" className="reviews-section section-padding" ref={containerRef}>
      <div className="container">
        
        <div className="reviews-wrapper reveal">
          <div className="reviews-header">
            <h4 className="subtitle">Guest Experiences</h4>
            <h2 className="luxury-title">
              What Our <span>Clients Say</span>
            </h2>
          </div>

          <div className="testimonial-slider glass-premium">
            <Quote className="quote-icon" size={60} color="rgba(212, 175, 55, 0.1)" />
            
            <div className="slider-content-window">
              {REVIEWS_DATA.map((review, idx) => (
                <div
                  key={idx}
                  className={`testimonial-slide ${idx === current ? 'active' : ''}`}
                >
                  <p className="testimonial-text">"{review.text}"</p>
                  
                  <div className="stars-wrapper">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={18} fill="#D4AF37" color="#D4AF37" />
                    ))}
                  </div>

                  <div className="client-info">
                    <img src={review.image} alt={review.name} className="client-img" />
                    <div className="client-details">
                      <h4 className="client-name">{review.name}</h4>
                      <p className="client-role">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Navigation */}
            <div className="slider-nav">
              <button className="slider-btn" onClick={handlePrev} aria-label="Previous Testimonial">
                <ChevronLeft size={20} />
              </button>
              <div className="slider-dots">
                {REVIEWS_DATA.map((_, idx) => (
                  <span
                    key={idx}
                    className={`slider-dot ${idx === current ? 'active' : ''}`}
                    onClick={() => setCurrent(idx)}
                  ></span>
                ))}
              </div>
              <button className="slider-btn" onClick={handleNext} aria-label="Next Testimonial">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
