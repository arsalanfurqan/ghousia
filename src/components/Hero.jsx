import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import './Hero.css';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=900&auto=format&fit=crop'
];

export default function Hero() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIdx((prevIdx) => (prevIdx + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const handleScrollTo = (id) => {
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
    <section id="home" className="hero-section">
      {/* Background Slideshow */}
      <div
        className="hero-backgrounds"
        aria-hidden="true"
      >
        <div
          className="hero-bg-slide active"
          style={{ backgroundImage: `url(${HERO_IMAGES[currentIdx]})` }}
        />
      </div>

      {/* Dark Overlay */}
      <div className="hero-overlay"></div>

      {/* Main Content */}
      <div className="hero-content container">
        <div className="hero-badge animate-fade-in">
          <span className="gold-line"></span>
          <span className="badge-text">Est. 1998 • Hussainabad</span>
          <span className="gold-line"></span>
        </div>

        <h1 className="hero-title animate-fade-in-up">
          <span className="serif-title">Welcome To</span>
          <span className="brand-gold gold-gradient-text">GHOUSIA</span>
          <span className="brand-sub">RESTAURANT</span>
        </h1>

        <p className="hero-tagline animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          "Authentic Pakistani & Chinese Cuisine"
          <span className="hero-subtagline">Taste the Tradition, Feel the Flavor</span>
        </p>

        <div className="hero-buttons animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button className="btn-gold" onClick={() => handleScrollTo('#menu')}>
            View Menu <ArrowRight size={16} />
          </button>
          <button className="btn-outline" onClick={() => handleScrollTo('#reservation')}>
            Book Table <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="scroll-indicator" onClick={() => handleScrollTo('#about')}>
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <span>Scroll Down</span>
      </div>
    </section>
  );
}
