import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface CircularCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 20,
  md: 24,
  lg: 32,
};

export default function CircularCheckbox({ checked, onChange, size = 'md' }: CircularCheckboxProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Play completion sound using Web Audio API
  const playSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isAnimating) return;

    if (checked) {
      // Unchecking - no animation needed
      onChange(false);
    } else {
      // Checking
      setIsAnimating(true);
      
      // Trigger confetti
      confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#4ade80', '#86efac'],
        disableForReducedMotion: true,
      });

      // Play sound
      playSound();

      // Trigger state change
      onChange(true);

      // Reset animation state after transition
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [checked, isAnimating, onChange, playSound]);

  const dimension = sizes[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative flex-shrink-0 rounded-full transition-all duration-200 cursor-pointer
        ${checked 
          ? 'bg-primary-500 border-primary-500' 
          : 'border-2 border-text-muted hover:border-primary-500'
        }
        ${isAnimating ? 'scale-110' : 'scale-100'}
      `}
      style={{
        width: dimension,
        height: dimension,
      }}
      aria-checked={checked}
      role="checkbox"
    >
      {/* Inner circle that fills in */}
      <div 
        className={`
          absolute inset-1 rounded-full bg-white transition-transform duration-200
          ${checked ? 'scale-100' : 'scale-0'}
        `}
      />
      {/* Checkmark icon */}
      {checked && (
        <svg
          className="absolute inset-0 m-auto w-1/2 h-1/2 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}
