import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', hover = true, onClick }: GlassCardProps) {
  return (
    <div
      className={`
        bg-background-card
        border border-glass-border
        rounded-2xl
        transition-all duration-200
        ${hover ? 'hover:bg-background-cardHover hover:border-[rgba(0,0,0,0.1)] cursor-pointer' : ''} 
        ${className}
      `}
      onClick={onClick}
      style={{
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      {children}
    </div>
  );
}
