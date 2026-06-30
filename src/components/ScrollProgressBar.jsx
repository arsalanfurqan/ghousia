import React, { useEffect, useState } from 'react';

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = (window.pageYOffset / totalScroll) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const progressBarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: `${scrollProgress}%`,
    height: '4px',
    backgroundColor: '#D4AF37',
    zIndex: 10001,
    transition: 'width 0.1s ease-out',
    boxShadow: '0 0 10px rgba(212, 175, 55, 0.7)'
  };

  return <div style={progressBarStyle} id="scroll-progress-bar" />;
}
