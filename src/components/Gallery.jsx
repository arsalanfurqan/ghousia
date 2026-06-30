import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn } from 'lucide-react';
import './Gallery.css';

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
    title: 'Succulent Beef Bihari Boti',
    size: 'tall'
  },
  {
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop',
    title: 'Luxury Dining Hall Ambiance',
    size: 'wide'
  },
  {
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop',
    title: 'Gourmet Red Karahi',
    size: 'tall'
  },
  {
    url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600&auto=format&fit=crop',
    title: 'Traditional Karahi Wok Cooking',
    size: 'square'
  },
  {
    url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=600&auto=format&fit=crop',
    title: 'Our Master Chef At Work',
    size: 'tall'
  },
  {
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop',
    title: 'Premium Chinese Fusions',
    size: 'wide'
  }
];

export default function Gallery() {
  const [selectedImg, setSelectedImg] = useState(null);
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
      { threshold: 0.1 }
    );

    const items = containerRef.current.querySelectorAll('.reveal');
    items.forEach((item) => observer.observe(item));

    return () => {
      items.forEach((item) => observer.unobserve(item));
    };
  }, []);

  return (
    <section id="gallery" className="gallery-section section-padding" ref={containerRef}>
      <div className="container">
        
        <div className="gallery-header reveal">
          <h4 className="subtitle">Visual Feast</h4>
          <h2 className="luxury-title">
            Our Gallery <span>& Ambiance</span>
          </h2>
          <p className="gallery-intro">
            A visual journey showcasing our signature cuisines, culinary preparation, and premium dining hall environment.
          </p>
        </div>

        {/* Pinterest-style Masonry Grid */}
        <div className="gallery-masonry reveal">
          {GALLERY_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className={`gallery-item ${img.size} glass`}
              onClick={() => setSelectedImg(img)}
            >
              <img src={img.url} alt={img.title} className="gallery-img" loading="lazy" />
              <div className="gallery-hover-overlay">
                <ZoomIn size={32} className="zoom-icon" />
                <span className="gallery-item-title">{img.title}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedImg && (
          <div className="lightbox-modal animate-fade-in" onClick={() => setSelectedImg(null)}>
            <button className="lightbox-close" onClick={() => setSelectedImg(null)} aria-label="Close Lightbox">
              <X size={28} />
            </button>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={selectedImg.url} alt={selectedImg.title} className="lightbox-img" />
              <div className="lightbox-caption">
                <h3>{selectedImg.title}</h3>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
