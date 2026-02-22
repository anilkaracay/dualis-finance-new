'use client';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span className={`lp-gradient-text ${className}`}>
      {children}
    </span>
  );
}
