import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
  sway: number;
}

const SeasonalEffect: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });

  const month = new Date().getMonth() + 1;
  const season = month >= 3 && month <= 5 ? 'spring'
    : month >= 6 && month <= 8 ? 'summer'
    : month >= 9 && month <= 11 ? 'autumn'
    : 'winter';

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * windowSize.width,
      y: -50 - Math.random() * 200,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 3,
      size: 12 + Math.random() * 16,
      sway: (Math.random() - 0.5) * 150
    }));
  }, [windowSize]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const getParticleContent = () => {
    switch (season) {
      case 'spring':
        return { emoji: '🌸', color: '#f472b6', rotate: true };
      case 'summer':
        return { emoji: '☀️', color: '#fbbf24', rotate: false };
      case 'autumn':
        return { emoji: '🍁', color: '#f97316', rotate: true };
      case 'winter':
        return { emoji: '❄️', color: '#60a5fa', rotate: true };
      default:
        return { emoji: '❄️', color: '#60a5fa', rotate: true };
    }
  };

  const { emoji, color, rotate } = getParticleContent();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ 
                y: p.y, 
                x: p.x, 
                opacity: 0,
                rotate: 0 
              }}
              animate={{
                y: windowSize.height + 100,
                x: p.x + p.sway,
                opacity: [0, 0.8, 0.8, 0],
                rotate: rotate ? [0, 180, 360] : [0, 10, -10, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                fontSize: p.size,
                willChange: 'transform',
              }}
            >
              <span style={{ color, opacity: 0.7 }}>{emoji}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeasonalEffect;
