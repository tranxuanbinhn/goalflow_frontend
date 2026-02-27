import { useEffect, useState } from 'react';

interface SparkleEffectProps {
  x: number;
  y: number;
  onComplete: () => void;
  color?: string;
}

export default function SparkleEffect({ x, y, onComplete, color = '#22c55e' }: SparkleEffectProps) {
  const [particles] = useState<Array<{
    id: number;
    angle: number;
    distance: number;
    size: number;
    delay: number;
  }>>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * 360,
      distance: 20 + Math.random() * 15,
      size: 3 + Math.random() * 3,
      delay: Math.random() * 50,
    }));
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete();
    }, 500);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-[70]"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full sparkle-particle"
          data-angle={particle.angle}
          data-distance={particle.distance}
          data-delay={particle.delay}
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
          }}
        />
      ))}
      
      {/* Center flash */}
      <div
        className="absolute inset-0 rounded-full sparkle-flash"
        style={{
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// Hook to manage sparkle effects
export function useSparkle() {
  const [sparkles, setSparkles] = useState<Array<{
    id: string;
    x: number;
    y: number;
  }>>([]);

  const triggerSparkle = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const id = `${Date.now()}-${Math.random()}`;
    setSparkles((prev) => [...prev, { id, x, y }]);
  };

  const removeSparkle = (id: string) => {
    setSparkles((prev) => prev.filter((s) => s.id !== id));
  };

  return { sparkles, triggerSparkle, removeSparkle };
}
