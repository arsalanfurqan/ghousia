import React, { useEffect, useRef } from 'react';
import { Leaf, UtensilsCrossed, Zap, DollarSign, Users, Sparkles } from 'lucide-react';
import './WhyChooseUs.css';

const WHY_CHOOSE_US_DATA = [
  {
    icon: <Leaf size={32} />,
    title: 'Fresh Ingredients',
    desc: 'We source the finest, locally produced organic vegetables and fresh meats daily to ensure peak taste and premium quality.'
  },
  {
    icon: <UtensilsCrossed size={32} />,
    title: 'Expert Chefs',
    desc: 'Our master culinary chefs have decades of heritage cooking experience in crafting authentic Lahori, Karachie and Chinese recipes.'
  },
  {
    icon: <Zap size={32} />,
    title: 'Fast Service',
    desc: 'Enjoy piping hot, freshly cooked meals delivered to your table or doorstep in record time without compromising flavor.'
  },
  {
    icon: <DollarSign size={32} />,
    title: 'Affordable Prices',
    desc: 'Indulge in premium high-end fine dining and rich flavors at competitive prices, making luxury dining accessible to everyone.'
  },
  {
    icon: <Users size={32} />,
    title: 'Family Environment',
    desc: 'A gorgeous, warm, and inviting custom interior design built to comfortably host private family gatherings and dinners.'
  },
  {
    icon: <Sparkles size={32} />,
    title: 'Hygienic Kitchen',
    desc: 'Strict food sanitation safety procedures, medical grade sterilization, and open-view live kitchen hygiene standards.'
  }
];

export default function WhyChooseUs() {
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

    const cards = containerRef.current.querySelectorAll('.reveal');
    cards.forEach((card) => observer.observe(card));

    return () => {
      cards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return (
    <section id="why-us" className="why-us-section section-padding" ref={containerRef}>
      <div className="container">
        
        <div className="why-us-header reveal">
          <h4 className="subtitle">Outstanding Service</h4>
          <h2 className="luxury-title">
            Why Choose <span>Us</span>
          </h2>
          <p className="why-us-intro">
            We strive to provide a dining experience that matches the highest standards of culinary art, ambiance, and service.
          </p>
        </div>

        <div className="grid-3 cards-grid">
          {WHY_CHOOSE_US_DATA.map((item, idx) => (
            <div key={idx} className="why-card glass reveal" style={{ transitionDelay: `${idx * 0.1}s` }}>
              <div className="why-icon-box">
                {item.icon}
              </div>
              <h3 className="why-card-title">{item.title}</h3>
              <p className="why-card-desc">{item.desc}</p>
              <div className="why-card-glow"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
