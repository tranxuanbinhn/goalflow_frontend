// Feedback utility for task and habit completion
// Uses Web Audio API for sounds and canvas-confetti for animations

import confetti from 'canvas-confetti';

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

// Get audio context (lazy initialization)
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Check if sound is enabled
// This will need to be connected to settings in a real app
let soundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

// Generate a simple beep sound using Web Audio API
const playBeep = (frequency: number = 800, duration: number = 0.1, type: OscillatorType = 'sine'): void => {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
};

// Play task completion sound - subtle and quick
export const playTaskCompleteSound = (): void => {
  playBeep(800, 0.08, 'sine');
};

// Play habit completion sound - more celebratory
export const playHabitCompleteSound = (): void => {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    
    // Play a cheerful ascending sequence
    const playNote = (freq: number, delay: number) => {
      setTimeout(() => playBeep(freq, 0.15, 'sine'), delay);
    };
    
    playNote(523.25, 0);    // C5
    playNote(659.25, 100);  // E5
    playNote(783.99, 200);  // G5
    playNote(1046.50, 300); // C6
  } catch (error) {
    console.warn('Failed to play habit sound:', error);
  }
};

// Task completion animation - subtle scale effect
export const triggerTaskAnimation = (element: HTMLElement): void => {
  element.style.transform = 'scale(1.05)';
  element.style.transition = 'transform 0.15s ease-out';
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 150);
};

// Habit completion animation - larger scale with glow
export const triggerHabitAnimation = (element: HTMLElement): void => {
  // Add glow effect
  element.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.5)';
  
  // Scale up
  element.style.transform = 'scale(1.03)';
  element.style.transition = 'all 0.3s ease-out';
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
    element.style.boxShadow = '';
  }, 300);
};

// Confetti explosion for habit completion
export const triggerConfetti = (): void => {
  if (!soundEnabled) return;
  
  const duration = 1500;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  };

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Create two sources of confetti
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'],
    });
  }, 250);
};

// Trigger all feedback for task completion
export const feedbackTaskComplete = (element?: HTMLElement): void => {
  playTaskCompleteSound();
  if (element) {
    triggerTaskAnimation(element);
  }
};

// Trigger all feedback for habit completion
export const feedbackHabitComplete = (element?: HTMLElement): void => {
  playHabitCompleteSound();
  triggerConfetti();
  if (element) {
    triggerHabitAnimation(element);
  }
};
