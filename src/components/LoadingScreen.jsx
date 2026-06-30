import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

export default function LoadingScreen({ onFinished }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      const finishedTimer = setTimeout(() => {
        onFinished();
      }, 800); // match transition duration
      return () => clearTimeout(finishedTimer);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className={`loading-container ${fade ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="logo-wrapper">
          <div className="glow-circle"></div>
          <div className="logo-text-large">G</div>
        </div>
        <h1 className="loading-brand gold-gradient-text">GHOUSIA</h1>
        <p className="loading-tagline">Taste the Tradition, Feel the Flavor</p>
        <div className="loading-bar">
          <div className="loading-bar-progress"></div>
        </div>
      </div>
    </div>
  );
}
