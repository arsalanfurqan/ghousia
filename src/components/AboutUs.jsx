import React, { useEffect, useRef } from 'react';
import { Award, ShieldCheck, Flame, Heart } from 'lucide-react';
import './AboutUs.css';

export default function AboutUs() {
  const sectionRef = useRef(null);

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

    const revealElements = sectionRef.current.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section id="about" className="about-section section-padding" ref={sectionRef}>
      <div className="container grid-2">
        
        {/* Left Side: Luxury Images collage */}
        <div className="about-images reveal">
          <div className="main-img-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=800&auto=format&fit=crop" 
              alt="Our Professional Chef" 
              className="about-img-main"
              loading="lazy"
            />
          </div>
          <div className="sub-img-wrapper glass">
            <img 
              src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop" 
              alt="Gourmet Platter" 
              className="about-img-sub"
              loading="lazy"
            />
          </div>
          <div className="experience-badge glass">
            <span className="exp-num">28</span>
            <span className="exp-text">Years of<br />Excellence</span>
          </div>
        </div>

        {/* Right Side: Text Story */}
        <div className="about-content">
          <h4 className="subtitle reveal">Our Legacy</h4>
          <h2 className="luxury-title reveal">
            Taste the Tradition, <br /><span>Feel the Flavor</span>
          </h2>
          <p className="about-description reveal">
            Since 1998, Ghousia Restaurant has been a beacon of gourmet dining in the heart of Hussainabad. We specialize in bringing you the most authentic Pakistani Karahis, rich BBQ delicacies, and premium Chinese fusions, prepared with recipes passed down through generations.
          </p>
          <p className="about-description reveal">
            Every dish we serve is an invitation to share our passion for high-quality food, cooked with hand-picked premium spices, fresh local ingredients, and served with true traditional hospitality.
          </p>

          {/* Key Value Highlights */}
          <div className="about-features grid-2 reveal">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Flame size={24} color="#D4AF37" />
              </div>
              <div className="feature-info">
                <h3>Fresh Ingredients</h3>
                <p>Locally sourced fresh meats and farm vegetables daily.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Award size={24} color="#D4AF37" />
              </div>
              <div className="feature-info">
                <h3>Expert Chefs</h3>
                <p>Master culinary artists with decades of experience.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Heart size={24} color="#D4AF37" />
              </div>
              <div className="feature-info">
                <h3>Family Environment</h3>
                <p>Comfortable, premium dining space for your loved ones.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} color="#D4AF37" />
              </div>
              <div className="feature-info">
                <h3>100% Hygienic</h3>
                <p>Strict safety and sanitary protocols in our state-of-the-art kitchen.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
