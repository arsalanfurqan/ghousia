import React, { useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import './PopularDishes.css';

const POPULAR_DISHES = [
  {
    name: 'Chicken Karahi',
    category: 'Karahi',
    description: 'Traditional chicken cooked in a wok with fresh tomatoes, ginger, garlic, and special spices.',
    price: 'Rs. 1000',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'White Karahi',
    category: 'Karahi',
    description: 'Creamy and mild chicken karahi prepared with butter, yogurt, cream, and green chillies.',
    price: 'Rs. 1100',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Red Karahi',
    category: 'Karahi',
    description: 'Fiery red chicken karahi cooked in high flame with a rich paste of tomatoes and red peppers.',
    price: 'Rs. 1000',
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Chicken Tikka',
    category: 'BBQ',
    description: 'Succulent chicken leg or breast piece marinated in spicy red tandoori masala and grilled on charcoal.',
    price: 'Rs. 200',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Beef Bihari Boti',
    category: 'BBQ',
    description: 'Ultra-tender beef strips marinated in a traditional spicy yogurt mix, flame-grilled to perfection.',
    price: 'Rs. 280',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Chicken Zinger Burger',
    category: 'Fast Food',
    description: 'Crispy fried chicken breast fillet topped with lettuce, premium cheese, and spicy signature mayo.',
    price: 'Rs. 240',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Chicken Chowmein',
    category: 'Chinese',
    description: 'Stir-fried noodles loaded with shredded chicken, fresh seasonal vegetables, and savory Chinese sauces.',
    price: 'Rs. 350',
    image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Chicken Fried Rice',
    category: 'Chinese',
    description: 'Wok-tossed premium basmati rice mixed with diced chicken, eggs, green onions, and soy sauce.',
    price: 'Rs. 250',
    image: 'https://images.unsplash.com/photo-1603133872878-685f208b8482?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Chicken Roll',
    category: 'Rolls',
    description: 'Flavorful chicken tikka boti rolled inside a soft crispy paratha with tangy green chutney.',
    price: 'Rs. 100',
    image: 'https://images.unsplash.com/photo-1628189487820-45a44ac75b51?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Malai Boti',
    category: 'BBQ',
    description: 'Creamy, melt-in-your-mouth grilled chicken boneless cubes marinated in white cream, butter, and herbs.',
    price: 'Rs. 280',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600&auto=format&fit=crop'
  }
];

export default function PopularDishes({ onAddToCart }) {
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

  const handleOrderNow = (dish) => {
    // Parse the price to a number (e.g., "Rs. 1000" -> 1000)
    const priceNumber = parseInt(dish.price.replace(/\D/g, ''), 10);
    const cartItem = {
      id: `popular-${dish.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: dish.name,
      price: priceNumber
    };
    onAddToCart(cartItem);
  };

  return (
    <section id="popular" className="popular-section section-padding" ref={containerRef}>
      <div className="container">
        
        <div className="popular-header reveal">
          <h4 className="subtitle">Signature Selections</h4>
          <h2 className="luxury-title">
            Our Popular <span>Dishes</span>
          </h2>
          <p className="popular-intro-text">
            Handpicked crowd favorites crafted to perfection. Indulge in our most celebrated culinary creations.
          </p>
        </div>

        <div className="grid-3 popular-grid">
          {POPULAR_DISHES.map((dish, idx) => (
            <div key={idx} className="dish-card glass reveal">
              <div className="dish-img-container">
                <img src={dish.image} alt={dish.name} className="dish-img" loading="lazy" />
                <span className="dish-tag">{dish.category}</span>
              </div>
              <div className="dish-info">
                <h3 className="dish-name">{dish.name}</h3>
                <p className="dish-description">{dish.description}</p>
                <div className="dish-footer">
                  <span className="dish-price">{dish.price}</span>
                  <button className="btn-gold dish-order-btn" onClick={() => handleOrderNow(dish)}>
                    <ShoppingBag size={14} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
