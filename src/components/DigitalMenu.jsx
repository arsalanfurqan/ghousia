import React, { useState, useEffect, useRef, useMemo, useCallback, memo, useDeferredValue } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import './DigitalMenu.css';

const MENU_DATA = {
  'Special Grill': [
    { name: 'Charaga Grill Charaga Full with Fries', price: 1000, desc: 'Whole chicken seasoned with chef\'s signature spices and slowly grilled over hot coals, served with hand-cut gold fries.', image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=500&q=80' },
    { name: 'Grill Charaga Half with Fries', price: 500, desc: 'Half chicken marinated and fire-grilled, served with golden fries.', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80' }
  ],
  'Special Karahi': [
    { name: 'Chicken Red Karahi Full', price: 1000, desc: 'Full portion chicken cooked with red ripe tomatoes, green chillies, and traditional spices.', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&q=80' },
    { name: 'Chicken Red Karahi Half', price: 500, desc: 'Half portion of traditional Red Karahi.', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80' },
    { name: 'Chicken White Karahi Full', price: 1100, desc: 'Full portion chicken cooked in yogurt, fresh cream, butter, and mild green chillies.', image: 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=500&q=80' },
    { name: 'Chicken White Karahi Half', price: 550, desc: 'Half portion of creamy white karahi.', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80' }
  ],
  'Rolls': [
    { name: 'Beef Bihari Boti Chatni Roll', price: 100, desc: 'Charcoal grilled beef bihari boti wrapped in soft paratha with tangy mint chutney.', image: 'https://images.unsplash.com/photo-1628189487820-45a44ac75b51?w=500&q=80' },
    { name: 'Chicken Zinger Crispy Roll', price: 130, desc: 'Crispy fried chicken zinger strip wrapped with lettuce and signature garlic mayo.', image: 'https://images.unsplash.com/photo-1626804475297-41609ea0ea4eb?w=500&q=80' },
    { name: 'Chicken Spicy Chatni Roll', price: 100, desc: 'Spicy chicken tikka pieces rolled in crisp paratha with spicy green chutney.', image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=500&q=80' },
    { name: 'Chicken Mayo Garlic Roll', price: 100, desc: 'Juicy chicken cubes rolled in paratha with creamy mayo garlic sauce.', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&q=80' }
  ],
  'Fast Food': [
    { name: 'Fried Chicken Broast', price: 200, desc: 'Crispy, golden deep-fried chicken piece served with garlic sauce.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80' },
    { name: 'Zinger Club Sandwich', price: 240, desc: 'Double decker toasted bread with crispy zinger piece, fried egg, cheese, and vegetables.', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80' },
    { name: 'BBQ Sandwich', price: 180, desc: 'Grilled sandwich stuffed with smoky BBQ chicken boti and melted cheese.', image: 'https://images.unsplash.com/photo-1475090169767-40ed8d18a67d?w=500&q=80' },
    { name: 'Club Sandwich', price: 160, desc: 'Traditional layered club sandwich with egg, chicken, mayo, and salad.', image: 'https://images.unsplash.com/photo-1554433607-66b5eed9d504?w=500&q=80' }
  ],
  'Burgers': [
    { name: 'Zinger Burger', price: 240, desc: 'Crispy breast fillet with fresh lettuce and dynamic mayo in warm toasted sesame buns.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' },
    { name: 'Beef Burger', price: 150, desc: 'Juicy beef patty grilled to order, served with onions, pickles, and classic burger sauce.', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80' }
  ],
  'BBQ': [
    { name: 'BBQ Chicken Tikka', price: 200, desc: 'Flame grilled chicken quarter piece marinated in hot spices.', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&q=80' },
    { name: 'Chicken Spicy Boti Plate', price: 280, desc: 'Plate of spicy grilled boneless chicken skewers.', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80' },
    { name: 'Chicken Malai Boti Plate', price: 280, desc: 'Melt-in-mouth chicken boti plate marinated in fresh cream and mild spices.', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&q=80' },
    { name: 'Beef Bihari Boti Plate', price: 280, desc: 'Plate of tender marinated beef slices grilled on hot coals.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80' },
    { name: 'Beef Seekh Kabab Plate', price: 220, desc: 'Skewered minced beef flame-grilled with special spices.', image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500&q=80' },
    { name: 'Puri Paratha', price: 40, desc: 'Crispy, deep-fried puffed bread.', image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&q=80' }
  ],
  'Chinese': [
    { name: 'Chinese Chowmein', price: 350, desc: 'Stir-fried noodles with chicken, cabbage, carrots, and sweet-savory stir-fry sauce.', image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=500&q=80' },
    { name: 'Manchurian with Rice', price: 350, desc: 'Chicken cubes in tangy red garlic sauce, served with fried rice.', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=80' },
    { name: 'Singaporean with Rice', price: 350, desc: 'Layered rice and noodles dish topped with stir fried chicken, veggies, and garlic sauce.', image: 'https://images.unsplash.com/photo-1603133872878-685f208b8482?w=500&q=80' },
    { name: 'Chilli with Rice', price: 350, desc: 'Spicy stir-fried chicken and green peppers in soy sauce, served with rice.', image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&q=80' },
    { name: 'Shashlik with Rice', price: 350, desc: 'Chicken skewers and vegetables in sweet and sour tomato sauce, served with rice.', image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&q=80' },
    { name: 'Jalfrezi with Rice', price: 350, desc: 'Thick spicy gravy with chicken, bell peppers, onions, and eggs, served with rice.', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&q=80' },
    { name: 'Vegetables Rice', price: 180, desc: 'Fluffy basmati rice tossed with fresh vegetables.', image: 'https://images.unsplash.com/photo-1603133872878-685f208b8482?w=500&q=80' },
    { name: 'Chicken Fried Rice', price: 250, desc: 'Wok tossed rice with eggs, shredded chicken, and scallions.', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80' },
    { name: 'Chicken Dry Chilli with Rice', price: 400, desc: 'Crispy dry beef or chicken with green chillies and garlic, served with rice.', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&q=80' },
    { name: 'Sauce extra', price: 200, desc: 'Portion of extra signature Chinese red sauce.', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&q=80' }
  ],
  'Tandoor': [
    { name: 'Roghni Kulcha', price: 30, desc: 'Traditional oven-baked flatbread glazed with butter and sesame seeds.', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80' }
  ],
  'Beverages': [
    { name: 'Mineral Water Small', price: 40, desc: 'Refreshing pure drinking water.', image: 'https://images.unsplash.com/photo-1608885898957-a599fb1698d6?w=500&q=80' },
    { name: 'Mineral Water Large', price: 60, desc: 'Refreshing large bottle drinking water.', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&q=80' },
    { name: 'Can 300ml', price: 60, desc: 'Assorted soft drinks (Coke, Sprite, Fanta).', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80' }
  ]
};

function DigitalMenu({ onAddToCart, customerProfile, onToggleFavorite }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
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
      { threshold: 0.05 }
    );

    const items = containerRef.current.querySelectorAll('.reveal');
    items.forEach((item) => observer.observe(item));

    return () => {
      items.forEach((item) => observer.unobserve(item));
    };
  }, [activeCategory, searchQuery]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const menuKeys = useMemo(() => Object.keys(MENU_DATA), []);
  const preferredOrder = useMemo(() => ['Burgers', 'BBQ'], []);
  const sortedKeys = useMemo(() => {
    return menuKeys.slice().sort((a, b) => {
      const ai = preferredOrder.indexOf(a);
      const bi = preferredOrder.indexOf(b);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return a.localeCompare(b);
    });
  }, [menuKeys, preferredOrder]);

  const categories = useMemo(() => ['All', ...sortedKeys], [sortedKeys]);

  const filteredMenu = useMemo(() => {
    const result = {};
    const normalizedQuery = deferredSearchQuery.toLowerCase();

    menuKeys.forEach((category) => {
      if (activeCategory !== 'All' && category !== activeCategory) {
        return;
      }

      const filteredItems = MENU_DATA[category].filter((item) =>
        item.name.toLowerCase().includes(normalizedQuery)
      );

      if (filteredItems.length > 0) {
        result[category] = filteredItems;
      }
    });
    return result;
  }, [activeCategory, deferredSearchQuery, menuKeys]);

  const handleAddToCartClick = useCallback((e, item) => {
    e.stopPropagation(); // prevent row click
    const cartItem = {
      id: `menu-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: item.name,
      price: item.price
    };
    onAddToCart(cartItem);
  }, [onAddToCart]);

  return (
    <section id="menu" className="menu-section section-padding" ref={containerRef}>
      <div className="container">
        
        <div className="menu-header reveal">
          <h4 className="subtitle">Culinary Masterpieces</h4>
          <h2 className="luxury-title">
            Our Digital <span>Menu</span>
          </h2>
          <p className="menu-intro">
            Explore our rich collection of traditional Pakistani specialties, freshly grilled BBQ, fast food classics, and savory Chinese favorites.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="menu-controls reveal">
          <div className="menu-search-wrapper glass">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="menu-search-input"
            />
          </div>

          <div className="menu-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`menu-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="menu-highlights reveal">
          <div className="menu-highlight-card glass">
            <strong>Reward Points</strong>
            <span>Earn points on every meal and redeem them later.</span>
          </div>
          <div className="menu-highlight-card glass">
            <strong>Saved Favorites</strong>
            <span>Tap the heart to keep your go-to dishes handy.</span>
          </div>
          <div className="menu-highlight-card glass">
            <strong>Order History</strong>
            <span>Your recent orders stay available for quick reorders.</span>
          </div>
        </div>

        {customerProfile?.orderHistory?.length > 0 && (
          <div className="menu-history-card reveal glass">
            <h3>Recent Orders</h3>
            <div className="menu-history-list">
              {customerProfile.orderHistory.slice(0, 4).map((order, index) => (
                <div key={`${order.id || index}`} className="history-row">
                  <span>Order #{order.id || index + 1}</span>
                  <span>Rs. {order.total || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Listings */}
        <div className="menu-categories-container">
          {Object.keys(filteredMenu).map((category, catIdx) => (
            <div key={category} className="menu-category-block reveal">
              <div className="menu-category-heading">
                <span className="menu-category-icon">✦</span>
                <h3 className="menu-category-title">{category}</h3>
                <span className="menu-category-line"></span>
              </div>
              <div className="menu-items-list">
                {filteredMenu[category].map((item, itemIdx) => {
                  const imageSrc = item.image && !item.image.startsWith('https://images.unsplash.com') ? item.image : null;

                  return (
                    <div key={itemIdx} className="menu-item-card glass" onClick={(e) => handleAddToCartClick(e, item)}>
                      {imageSrc && (
                        <div className="menu-item-img-container">
                          <img src={imageSrc} alt={item.name} className="menu-item-img" loading="lazy" decoding="async" />
                        </div>
                      )}
                      <div className="menu-item-content">
                      <div className="menu-item-top-row">
                        <h4 className="menu-item-name">{item.name}</h4>
                        <button
                          className={`favorite-btn ${customerProfile?.favorites?.includes(item.name) ? 'active' : ''}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleFavorite?.(item.name);
                          }}
                          aria-label={`Save ${item.name}`}
                        >
                          ♥
                        </button>
                      </div>
                      {item.desc && <p className="menu-item-desc">{item.desc}</p>}
                      <div className="menu-item-footer">
                        <span className="menu-item-price">Rs. {item.price}</span>
                        <button 
                          className="btn-gold menu-add-btn" 
                          onClick={(e) => handleAddToCartClick(e, item)}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          <ShoppingBag size={14} /> Add
                        </button>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {Object.keys(filteredMenu).length === 0 && (
            <div className="menu-no-results glass">
              <p>No dishes found matching "{deferredSearchQuery}"</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

export default memo(DigitalMenu);
